import { db } from "../config/connect_database.js";

export const getOrdersByCustomer = async (req, res) => {
  try {
    const { customer_id } = req.user;
    const role = req.user.roles;
    let orders;
    if (role === 'admin') {
      [orders] = await db.query(
        `SELECT o.*, c.name as customer_name 
         FROM orders o 
         JOIN customers c ON o.customer_id = c.customer_id 
         ORDER BY o.created_at DESC`
      );
    } else {
      [orders] = await db.query(
        `SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC`,
        [customer_id]
      );
    }

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createOrder = async (req, res) => {
  try {
    const user = req.user;
    const customer_id = user?.customer_id;
    const { total } = req.body;

    if (!total || isNaN(total) || total <= 0) {
      return res.status(400).json({ message: "Valid total amount is required" });
    }

    const [result] = await db.query(
      `INSERT INTO orders (customer_id, total, status) VALUES (?, ?, 'pending')`,
      [customer_id, total]
    );
    const message = `${user.name} Placed an order`;
    await db.query(
            "INSERT INTO messages (admin_id, type, title, message, created_at) VALUES (?, ?, ?, ?, ? )",
            ["AD001", "Order", "Order has been placed", message, new Date()]
        );

    res.status(201).json({
      message: "Order created successfully",
      order_id: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ message: error?.message || "Internal server error" });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "paid", "shipped", "delivered"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const [orders] = await db.query(`SELECT * FROM orders WHERE id = ?`, [id]);
    if (orders.length === 0) return res.status(404).json({ message: "Order not found" });
    const order = orders[0];

    const [result] = await db.query(
      `UPDATE orders SET status = ? WHERE id = ?`,
      [status, id]
    );

    // Award Loyalty Points if status changed to 'paid'
    if (status === 'paid' && order.status !== 'paid') {
      const points = Math.floor(order.total / 100);
      if (points > 0) {
        await db.query(
          "UPDATE customers SET loyalty_points = loyalty_points + ? WHERE customer_id = ?",
          [points, order.customer_id]
        );
        await db.query(
          "INSERT INTO points_history (customer_id, points_change, reason) VALUES (?, ?, ?)",
          [order.customer_id, points, `Points earned from Order #${id}`]
        );
      }
    }

    res.status(200).json({ message: "Order status updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error?.message || "Internal server error" });
  }
};
export const getOrderById = async (req, res) => {
  const { id } = req.params;
  const { customer_id, role } = req.user;

  let orderQuery = `SELECT * FROM orders WHERE id = ?`;
  let queryParams = [id];

  if (role !== 'admin') {
    orderQuery += ` AND customer_id = ?`;
    queryParams.push(customer_id);
  }

  const [[order]] = await db.query(orderQuery, queryParams);

  if (!order) return res.status(404).json({ message: "Order not found" });

  const [items] = await db.query(
    `SELECT oi.*, p.name 
     FROM order_items oi 
     JOIN products p ON oi.product_id = p.id 
     WHERE oi.order_id = ?`,
    [id]
  );

  res.json({ order, items });
};
export const cancelOrder = async (req, res) => {
  const { id } = req.params;
  const customer_id = req.user?.customer_id;

  const [[order]] = await db.query(
    `SELECT * FROM orders WHERE id = ? AND customer_id = ?`,
    [id, customer_id]
  );

  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.status !== "pending") {
    return res.status(400).json({ message: "Only pending orders can be cancelled" });
  }

  await db.query(`DELETE FROM order_items WHERE order_id = ?`, [id]);
  await db.query(`DELETE FROM orders WHERE id = ?`, [id]);

  res.json({ message: "Order cancelled successfully" })

};

export const getOrderCount = async (req, res) => {
  try {
    const { customer_id, role } = req.user;
    let query = "SELECT COUNT(*) as count FROM orders";
    let params = [];

    if (role !== 'admin') {
      query += " WHERE customer_id = ?";
      params.push(customer_id);
    }

    const [rows] = await db.query(query, params);
    res.status(200).json({ count: rows[0].count || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getRecentOrders = async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.id, o.total, o.status, o.created_at,
              c.name as customer_name, c.email as customer_email
       FROM orders o
       JOIN customers c ON o.customer_id = c.customer_id
       ORDER BY o.created_at DESC
       LIMIT 5`
    );
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
