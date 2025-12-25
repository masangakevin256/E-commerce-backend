import { db } from "../config/connect_database.js";

export const getWishlist = async (req, res) => {
  try {
    const customer_id = req.user?.customer_id;
    const result = await db.query(
      `SELECT w.id AS wishlist_item_id, p.* 
       FROM wishlist w 
       JOIN products p ON w.product_id = p.id 
       WHERE w.customer_id = $1`,
      [customer_id]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addToWishlist = async (req, res) => {
  try {
    const customer_id = req.user?.customer_id;
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    await db.query(
      `INSERT INTO wishlist (customer_id, product_id) 
       VALUES ($1, $2) 
       ON CONFLICT (customer_id, product_id) DO NOTHING`,
      [customer_id, product_id]
    );

    res.status(201).json({ message: "Added to wishlist" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const customer_id = req.user?.customer_id;
    const { product_id } = req.params;

    const result = await db.query(
      "DELETE FROM wishlist WHERE customer_id = $1 AND product_id = $2",
      [customer_id, product_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Item not found in wishlist" });
    }

    res.status(200).json({ message: "Removed from wishlist" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const checkWishlistStatus = async (req, res) => {
  try {
    const customer_id = req.user?.customer_id;
    const result = await db.query(
      "SELECT product_id FROM wishlist WHERE customer_id = $1",
      [customer_id]
    );
    const productIds = result.rows.map(row => row.product_id);
    res.status(200).json(productIds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getWishlistCount = async (req, res) => {
  try {
    const customer_id = req.user.customer_id;
    const result = await db.query(
      "SELECT COUNT(*) AS count FROM wishlist WHERE customer_id = $1",
      [customer_id]
    );
    res.status(200).json({ count: parseInt(result.rows[0].count, 10) || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};