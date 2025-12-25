import { db } from "../config/connect_database.js";

export const getAddresses = async (req, res) => {
  const customer_id = req.user.customer_id;
  try {
    const result = await db.query(
      "SELECT * FROM addresses WHERE customer_id = $1 ORDER BY is_default DESC, created_at DESC",
      [customer_id]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addAddress = async (req, res) => {
  const { label, full_address, is_default } = req.body;
  const customer_id = req.user.customer_id;

  if (!full_address) {
    return res.status(400).json({ message: "Address is required" });
  }

  try {
    if (is_default) {
      await db.query(
        "UPDATE addresses SET is_default = FALSE WHERE customer_id = $1",
        [customer_id]
      );
    }

    await db.query(
      "INSERT INTO addresses (customer_id, label, full_address, is_default) VALUES ($1, $2, $3, $4)",
      [customer_id, label || "Home", full_address, is_default || false]
    );

    res.status(201).json({ message: "Address added successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAddress = async (req, res) => {
  const { id } = req.params;
  const customer_id = req.user.customer_id;
  try {
    await db.query(
      "DELETE FROM addresses WHERE id = $1 AND customer_id = $2",
      [id, customer_id]
    );
    res.status(200).json({ message: "Address deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};