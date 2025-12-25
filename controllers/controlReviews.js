import { db } from "../config/connect_database.js";

export const getProductReviews = async (req, res) => {
    const { productId } = req.params;
    try {
        const [rows] = await db.query(
            `SELECT r.*, c.name as customer_name, c.profile_pic 
       FROM reviews r 
       JOIN customers c ON r.customer_id = c.customer_id 
       WHERE r.product_id = ? 
       ORDER BY r.created_at DESC`,
            [productId]
        );
        console.log(rows);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// Get all reviews for admin
export const getAllReviews = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT r.*, 
                    c.name as customer_name, 
                    c.profile_pic,
                    c.email as customer_email,
                    p.name as product_name,
                    p.price as product_price
             FROM reviews r 
             JOIN customers c ON r.customer_id = c.customer_id 
             JOIN products p ON r.product_id = p.id 
             ORDER BY r.created_at DESC`
        );
        console.log(`Fetched ${rows.length} reviews for admin`);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete review (admin only)
export const deleteReview = async (req, res) => {
    const { id } = req.params;
    
    try {
        const [result] = await db.query(
            "DELETE FROM reviews WHERE id = ?",
            [id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Review not found" });
        }
        
        res.status(200).json({ message: "Review deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const addReview = async (req, res) => {
    const { productId, rating, comment } = req.body;
    const customer_id = req.user?.customer_id;

    if (!productId || !rating) {
        return res.status(400).json({ message: "Product ID and rating are required" });
    }

    try {
        // Check if user already reviewed this product
        const [existing] = await db.query(
            "SELECT id FROM reviews WHERE product_id = ? AND customer_id = ?",
            [productId, customer_id]
        );

        if (existing.length > 0) {
            // Update existing review
            await db.query(
                "UPDATE reviews SET rating = ?, comment = ? WHERE product_id = ? AND customer_id = ?",
                [rating, comment, productId, customer_id]
            );
            return res.status(200).json({ message: "Review updated successfully" });
        }

        // Insert new review
        await db.query(
            "INSERT INTO reviews (product_id, customer_id, rating, comment) VALUES (?, ?, ?, ?)",
            [productId, customer_id, rating, comment]
        );
        const message = `${req.user.name} Placed a review`;

        await db.query(
            "INSERT INTO messages (admin_id, type, title, message, created_at) VALUES (?, ?, ?, ?, ? )",
            ["AD001", "Order", "Order has been placed", message, new Date()]
        );

        res.status(201).json({ message: "Review added successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
