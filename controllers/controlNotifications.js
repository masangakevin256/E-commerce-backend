import { db } from "../config/connect_database.js";

// Utility to create a notification (can be imported by other controllers)
export const createNotification = async (customer_id, type, title, message) => {
    try {
        await db.query(
            "INSERT INTO notifications (customer_id, type, title, message) VALUES (?, ?, ?, ?)",
            [customer_id, type, title, message]
        );
        return true;
    } catch (error) {
        console.error("Error creating notification:", error.message);
        return false;
    }
};

export const getNotifications = async (req, res) => {
    const customer_id = req.user?.customer_id;
    try {
        const [rows] = await db.query(
            "SELECT * FROM notifications WHERE customer_id = ? ORDER BY created_at DESC LIMIT 50",
            [customer_id]
        );
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const markRead = async (req, res) => {
    const customer_id = req.user?.customer_id;
    const { id } = req.body; // If id is provided, mark that one, else mark all

    try {
        if (id) {
            await db.query(
                "UPDATE notifications SET is_read = 1 WHERE id = ? AND customer_id = ?",
                [id, customer_id]
            );
        } else {
            await db.query(
                "UPDATE notifications SET is_read = 1 WHERE customer_id = ?",
                [customer_id]
            );
        }
        res.status(200).json({ message: "Notifications updated" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteNotification = async (req, res) => {
    const customer_id = req.user?.customer_id;
    const { id } = req.params;

    try {
        await db.query(
            "DELETE FROM notifications WHERE id = ? AND customer_id = ?",
            [id, customer_id]
        );
        res.status(200).json({ message: "Notification deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
