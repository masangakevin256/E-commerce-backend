import { db } from "../config/connect_database.js";

export const getWishlist = async (req, res) => {
    try {
        const customer_id = req.user?.customer_id;
        const [rows] = await db.query(
            `SELECT w.id as wishlist_item_id, p.* 
       FROM wishlist w 
       JOIN products p ON w.product_id = p.id 
       WHERE w.customer_id = ?`,
            [customer_id]
        );
        res.status(200).json(rows);
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
            "INSERT IGNORE INTO wishlist (customer_id, product_id) VALUES (?, ?)",
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

        await db.query(
            "DELETE FROM wishlist WHERE customer_id = ? AND product_id = ?",
            [customer_id, product_id]
        );

        res.status(200).json({ message: "Removed from wishlist" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const checkWishlistStatus = async (req, res) => {
    try {
        const customer_id = req.user?.customer_id;
        const [rows] = await db.query(
            "SELECT product_id FROM wishlist WHERE customer_id = ?",
            [customer_id]
        );
        const productIds = rows.map(row => row.product_id);
        res.status(200).json(productIds);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getWishlistCount = async (req, res) => {
    try {
        const customer_id = req.user.customer_id;
        const [rows] = await db.query(
            "SELECT COUNT(*) as count FROM wishlist WHERE customer_id = ?",
            [customer_id]
        );
        res.status(200).json({ count: rows[0].count || 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
