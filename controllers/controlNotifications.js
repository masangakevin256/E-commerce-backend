import { db } from "../config/connect_database.js";

// Utility to create a notification (can be imported by other controllers)
export const createNotification = async (customer_id, type, title, message) => {
  try {
    await db.query(
      "INSERT INTO notifications (customer_id, type, title, message) VALUES ($1, $2, $3, $4)",
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
    const result = await db.query(
      "SELECT * FROM notifications WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 50",
      [customer_id]
    );
    res.status(200).json(result.rows);
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
        "UPDATE notifications SET is_read = TRUE WHERE id = $1 AND customer_id = $2",
        [id, customer_id]
      );
    } else {
      await db.query(
        "UPDATE notifications SET is_read = TRUE WHERE customer_id = $1",
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
      "DELETE FROM notifications WHERE id = $1 AND customer_id = $2",
      [id, customer_id]
    );
    res.status(200).json({ message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};