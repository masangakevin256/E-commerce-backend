import { db } from "../config/connect_database.js";

export const getCart = async (req, res) => {
  try {
    const customer_id = req.user.customer_id;

    const [items] = await db.query(
      `
      SELECT
        c.id,
        c.product_id,
        c.quantity,
        p.name,
        p.price,
        p.image
      FROM carts c
      JOIN products p ON c.product_id = p.id
      WHERE c.customer_id=?
      `,
      [customer_id]
    );

    res.json(items);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const addToCart = async (req, res) => {
  const { product_id } = req.body;
  const user = req.user;
  const customer_id = user.customer_id;

  if (!product_id) return res.status(400).json({ message: "All fields are required" });
  const quantity = req.body.quantity ? parseInt(req.body.quantity) : 1;

  try {
    // Check if the product is already in the cart for this customer
    const [existingItems] = await db.query(
      "SELECT id, quantity FROM carts WHERE customer_id = ? AND product_id = ?",
      [customer_id, product_id]
    );

    if (existingItems.length > 0) {
      // If it exists, update the quantity
      const newQuantity = existingItems[0].quantity + quantity;
      await db.query(
        "UPDATE carts SET quantity = ? WHERE id = ?",
        [newQuantity, existingItems[0].id]
      );
      return res.status(200).json({ message: "Cart updated (quantity increased)" });
    } else {
      // If it doesn't exist, insert a new row
      await db.query(
        "INSERT INTO carts (customer_id, product_id, quantity) VALUES (?, ?, ?)",
        [customer_id, product_id, quantity]
      );
      const message = `${user.name} Placed an order`;
      await db.query(
            "INSERT INTO messages (admin_id, type, title, message, created_at) VALUES (?, ?, ?, ?, ? )",
            ["AD001", "Order", "Order  placed", message, new Date()]
        );
      return res.status(200).json({ message: "Product added to cart successfully" });
    }
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
}
export const updateToCart = async (req, res) => {
  try {
    const user = req.user;
    const customer_id = user?.customer_id;
    const { id } = req.params;
    const { quantity } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Cart item ID is required" });
    }

    if (isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be a positive number" });
    }

    const [result] = await db.query(
      `UPDATE carts SET quantity = ? WHERE id = ? AND customer_id = ?`,
      [quantity, id, customer_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    res.status(200).json({ message: "Cart item updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error?.message || "Internal server error" });
  }
};

export const deleteToCart = async (req, res) => {
  const user = req.user;
  const customer_id = user.customer_id;
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: "Id required" });
  try {
    //customer to delete only their own product
    const [rows] = await db.query(`SELECT * FROM carts WHERE customer_id = ? AND id = ?`, [customer_id, id]);
    if (rows.length === 0) return res.status(400).json({ message: "Product not found in cart" });
    await db.query(`DELETE FROM carts WHERE customer_id = ? AND id = ?`, [customer_id, id]);
    res.status(200).json({ message: "Product deleted to cart successfully" });
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
}
export const getCartByCustomer = async (req, res) => {
  const user = req.user;
  const customer_id = user.customer_id;
  try {
    const [rows] = await db.query(`SELECT * FROM carts WHERE customer_id = ?`, [customer_id]);
    res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
}

export const getCartCount = async (req, res) => {
  try {
    const customer_id = req.user.customer_id;
    const [rows] = await db.query(
      "SELECT SUM(quantity) as count FROM carts WHERE customer_id = ?",
      [customer_id]
    );
    res.status(200).json({ count: rows[0].count || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    const customer_id = req.user.customer_id;
    await db.query("DELETE FROM carts WHERE customer_id = ?", [customer_id]);
    res.status(200).json({ message: "Cart cleared successfully" });
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
};