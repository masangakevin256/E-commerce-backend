import { db } from "../config/connect_database.js";
import { createNotification } from "./controlNotifications.js";

export const checkout = async (req, res) => {
  const { voucherCode } = req.body;
  const customer_id = req.user?.customer_id;

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Get cart items WITH stock
    const [cartItems] = await connection.query(
      `
      SELECT 
        c.product_id,
        c.quantity,
        p.price,
        p.stock,
        p.name
      FROM carts c
      JOIN products p ON c.product_id = p.id
      WHERE c.customer_id = ?
      `,
      [customer_id]
    );

    if (cartItems.length === 0) {
      throw new Error("Cart is empty");
    }

    // 2. Check stock availability
    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        throw new Error(`Insufficient stock for ${item.name}`);
      }
    }

    // 3. Calculate total
    let subtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    let total = subtotal;
    let discount = 0;

    // 3.1 Apply voucher if provided
    if (voucherCode) {
      try {
        const [vouchers] = await connection.query(
          "SELECT * FROM vouchers WHERE code = ? AND (customer_id = ? OR customer_id IS NULL) AND status = 'active' AND expiry_date > NOW()",
          [voucherCode, customer_id]
        );

        if (vouchers.length > 0) {
          const voucher = vouchers[0];
          if (!voucher.min_spend || subtotal >= voucher.min_spend) {
            if (voucher.discount_type === 'percentage') {
              discount = (voucher.discount_value / 100) * subtotal;
            } else {
              discount = voucher.discount_value;
            }
            total = Math.max(0, subtotal - discount);
          }
        }
      } catch (vErr) {
        console.warn("Voucher lookup failed (table might be missing):", vErr.message);
        // Continue without voucher if table doesn't exist yet
      }
    }

    // Add shipping and tax
    const shipping = subtotal > 1000 ? 0 : 150;
    const tax = subtotal * 0.16;
    total = total + shipping + tax;

    // 4. Create order
    const [orderResult] = await connection.query(
      `INSERT INTO orders (customer_id, total, status)
       VALUES (?, ?, 'pending')`,
      [customer_id, total]
    );

    const orderId = orderResult.insertId;

    // 5. Insert order items + reduce stock
    for (const item of cartItems) {
      // insert order item
      await connection.query(
        `
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES (?, ?, ?, ?)
        `,
        [orderId, item.product_id, item.quantity, item.price]
      );

      // reduce stock SAFELY
      const [updateResult] = await connection.query(
        `
        UPDATE products
        SET stock = stock - ?
        WHERE id = ? AND stock >= ?
        `,
        [item.quantity, item.product_id, item.quantity]
      );

      if (updateResult.affectedRows === 0) {
        throw new Error("Stock conflict detected");
      }
    }

    // 6. Clear cart
    await connection.query(
      `DELETE FROM carts WHERE customer_id = ?`,
      [customer_id]
    );

    await connection.commit();

    // Trigger notification
    try {
      await createNotification(
        customer_id,
        'order',
        'Order Placed!',
        `Your order #${orderId} for KES ${total.toFixed(2)} has been placed successfully.`
      );
    } catch (nErr) {
      console.warn("Notification trigger failed:", nErr.message);
    }

    res.status(201).json({
      message: "Order placed successfully",
      order_id: orderId,
      total,
    });

  } catch (error) {
    console.error("CRITICAL: Checkout failed -", error);
    if (connection) await connection.rollback();
    res.status(400).json({
      message: error.message || "Checkout failed",
    });
  } finally {
    if (connection) connection.release();
  }
};
