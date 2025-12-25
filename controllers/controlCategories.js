import { db } from "../config/connect_database.js";

export const getAllCategories = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM categories ORDER BY id ASC");
    res.status(200).json(result.rows);
  } catch (error) {
    return res.status(500).json({ error: error?.message });
  }
};

export const addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }
    await db.query("INSERT INTO categories (name) VALUES ($1)", [name]);
    res.status(200).json({ message: "Category added successfully" });
  } catch (error) {
    return res.status(500).json({ error: error?.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) return res.status(400).json({ message: "Name is required" });

    // check if id is valid
    const result = await db.query("SELECT * FROM categories WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Category not found!" });
    }

    await db.query("UPDATE categories SET name = $1 WHERE id = $2", [name, id]);
    res.status(200).json({ message: "Category updated successfully" });
  } catch (error) {
    return res.status(500).json({ error: error?.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query("DELETE FROM categories WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Category not found!" });
    }

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: error?.message });
  }
};

export const getCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query("SELECT * FROM categories WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Category not found!" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error?.message });
  }
};