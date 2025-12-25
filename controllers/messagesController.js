import { db } from "../config/connect_database.js";

// Utility to create a notification (can be imported by other controllers)
export const createMessages = async (admin_id, type, title, message) => {
    try {
        await db.query(
            "INSERT INTO messages (admin_id, type, title, message, created_at) VALUES (?, ?, ?, ?, ? )",
            [admin_id, type, title, message, new Date()]
        );
        return true;
    } catch (error) {
        console.error("Error creating notification:", error.message);
        return false;
    }
};

export const getMessages = async (req, res) => {
    const admin_id = req.user?.admin_id;
    try {
        const [rows] = await db.query(
            "SELECT * FROM messages WHERE admin_id = ? ORDER BY created_at DESC LIMIT 50",
            [admin_id]
        );
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const markRead = async (req, res) => {
    const admin_id = req.user?.admin_id;
    const { id } = req.body; // If id is provided, mark that one, else mark all

    try {
        if (id) {
            await db.query(
                "UPDATE messages SET is_read = 1 WHERE id = ? AND admin_id = ?",
                [id, admin_id]
            );
        } else {
            await db.query(
                "UPDATE messages SET is_read = 1 WHERE admin_id = ?",
                [admin_id]
            );
        }
        res.status(200).json({ message: "messages updated" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteMessage = async (req, res) => {
    const admin_id = req.user?.admin_id;
    const { id } = req.params;

    try {
        await db.query(
            "DELETE FROM messages WHERE id = ? AND admin_id = ?",
            [id, admin_id]
        );
        res.status(200).json({ message: "Notification deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
