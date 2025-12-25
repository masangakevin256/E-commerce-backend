//for controlling categories
import { db } from "../config/connect_database.js";

export const getAllCategories = async (req, res) => {
    try {
        const categories = await db.query("SELECT * FROM categories");
        res.status(200).json(categories[0]);
    } catch (error) {
        return res.status(500).json({ error: error?.message });
    }
};

export const addCategory = async (req, res) => {
    try {
        const { name } = req.body;
        await db.query("INSERT INTO categories (name) VALUES (?)", [name]);
        res.status(200).json({ message: "Category added successfully" });
    } catch (error) {
        return res.status(500).json({ error: error?.message });
    }
};

export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if(!name) return res.status(400).json({ message: "Name is required" });
        // check if id is valid
        const [rows] = await db.query("SELECT * FROM categories WHERE id = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "Category not found!" });
        }
        await db.query("UPDATE categories SET name = ? WHERE id = ?", [
            name,
            id,
        ]);
        res.status(200).json({ message: "Category updated successfully" });
    } catch (error) {
        return res.status(500).json({ error: error?.message });
    }
}
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query("DELETE FROM categories WHERE id = ?", [id]);
        //check if its actually deleted
        
        
        res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
        return res.status(500).json({ error: error?.message });
    }
};

export const getCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query("SELECT * FROM categories WHERE id = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "Category not found!" });
        }
        res.status(200).json(rows);
    } catch (error) {
        return res.status(500).json({ error: error?.message });
    }
};