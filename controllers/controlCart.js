import { db } from "../config/connect_database.js";

export const getCart = async (req, res) => {
  try {
    const customer_id = req.user.customer_id;

    const result = await db.query(
      `SELECT
        c.id,
        c.product_id,
        c.quantity,
        p.name,
        p.price,
        p.image
      FROM carts c
      JOIN products p ON c.product_id = p.id
      WHERE c.customer_id = $1
      ORDER BY c.id DESC`,
      [customer_id]
    );

    res.json(result.rows);
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
    const existingResult = await db.query(
      "SELECT id, quantity FROM carts WHERE customer_id = $1 AND product_id = $2",
      [customer_id, product_id]
    );

    if (existingResult.rows.length > 0) {
      // If it exists, update the quantity
      const newQuantity = existingResult.rows[0].quantity + quantity;
      await db.query(
        "UPDATE carts SET quantity = $1 WHERE id = $2",
        [newQuantity, existingResult.rows[0].id]
      );
      return res.status(200).json({ message: "Cart updated (quantity increased)" });
    } else {
      // If it doesn't exist, insert a new row
      await db.query(
        "INSERT INTO carts (customer_id, product_id, quantity) VALUES ($1, $2, $3)",
        [customer_id, product_id, quantity]
      );

      const message = `${user.name} placed an order`;
      await db.query(
        "INSERT INTO messages (admin_id, type, title, message, created_at) VALUES ($1, $2, $3, $4, $5)",
        ["AD001", "Order", "Order placed", message, new Date()]
      );

      return res.status(200).json({ message: "Product added to cart successfully" });
    }
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
};

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

    const result = await db.query(
      "UPDATE carts SET quantity = $1 WHERE id = $2 AND customer_id = $3",
      [quantity, id, customer_id]
    );

    if (result.rowCount === 0) {
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
    // customer can only delete their own product
    const checkResult = await db.query(
      "SELECT * FROM carts WHERE customer_id = $1 AND id = $2",
      [customer_id, id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(400).json({ message: "Product not found in cart" });
    }

    await db.query("DELETE FROM carts WHERE customer_id = $1 AND id = $2", [customer_id, id]);

    res.status(200).json({ message: "Product deleted from cart successfully" });
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
};

export const getCartByCustomer = async (req, res) => {
  const user = req.user;
  const customer_id = user.customer_id;
  try {
    const result = await db.query("SELECT * FROM carts WHERE customer_id = $1", [customer_id]);
    res.status(200).json(result.rows);
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
};

export const getCartCount = async (req, res) => {
  try {
    const customer_id = req.user.customer_id;
    const result = await db.query(
      "SELECT COALESCE(SUM(quantity), 0) AS count FROM carts WHERE customer_id = $1",
      [customer_id]
    );
    res.status(200).json({ count: parseInt(result.rows[0].count, 10) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    const customer_id = req.user.customer_id;
    await db.query("DELETE FROM carts WHERE customer_id = $1", [customer_id]);
    res.status(200).json({ message: "Cart cleared successfully" });
  } catch (error) {
    res.status(500).json({ message: error?.message });
  }
};