import { db } from "../config/connect_database.js";

// Utility to create a message (can be imported by other controllers)
export const createMessages = async (admin_id, type, title, message) => {
  try {
    await db.query(
      "INSERT INTO messages (admin_id, type, title, message, created_at) VALUES ($1, $2, $3, $4, $5)",
      [admin_id, type, title, message, new Date()]
    );
    return true;
  } catch (error) {
    console.error("Error creating message:", error.message);
    return false;
  }
};

export const getMessages = async (req, res) => {
  const admin_id = req.user?.admin_id;
  try {
    const result = await db.query(
      "SELECT * FROM messages WHERE admin_id = $1 ORDER BY created_at DESC LIMIT 50",
      [admin_id]
    );
    res.status(200).json(result.rows);
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
        "UPDATE messages SET is_read = TRUE WHERE id = $1 AND admin_id = $2",
        [id, admin_id]
      );
    } else {
      await db.query(
        "UPDATE messages SET is_read = TRUE WHERE admin_id = $1",
        [admin_id]
      );
    }
    res.status(200).json({ message: "Messages updated" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteMessage = async (req, res) => {
  const admin_id = req.user?.admin_id;
  const { id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM messages WHERE id = $1 AND admin_id = $2",
      [id, admin_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.status(200).json({ message: "Message deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};