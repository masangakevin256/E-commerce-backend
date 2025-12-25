import { db } from "../config/connect_database.js";


export const getAllProducts = async (req, res) => {
  try {
    const [row] = await db.query(`
          SELECT p.id, p.name, p.price, p.stock, p.image, p.description, p.category_id,
              c.name AS category_name
        FROM products AS p
        LEFT JOIN categories AS c ON c.id = p.category_id
         ORDER BY p.id DESC
        ;
          `);

    res.status(200).json(row);
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
}

export const addNewProduct = async (req, res) => {
  const { name, description, price, stock, category_id } = req.body;

  // Only require essential fields
  if (!name || !price || !stock || !category_id) {
    return res.status(400).json({ message: "Name, price, stock, and category are required" });
  }

  let image;
  if (req.file) {
    image = req.file.filename;
  } else if (req.body.image) {
    image = req.body.image; // URL case
  }

  if (!image) {
    return res.status(400).json({ message: "Product image or URL is required" });
  }

  try {
    await db.query(
      `INSERT INTO products (name, description, price, stock, image, category_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, description || '', price, stock, image, category_id]
    );
    res.status(200).json({ message: "Product added successfully" });
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
}

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, category_id, image: bodyImage } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Product ID is required" });
  }

  // Build dynamic update fields
  const fields = [];
  const values = [];

  if (name) {
    fields.push("name = ?");
    values.push(name);
  }
  if (description) {
    fields.push("description = ?");
    values.push(description);
  }
  if (price !== undefined) {
    if (isNaN(price) || price < 0) {
      return res.status(400).json({ message: "Price must be a non-negative number" });
    }
    fields.push("price = ?");
    values.push(price);
  }
  if (stock !== undefined) {
    if (isNaN(stock) || stock < 0) {
      return res.status(400).json({ message: "Stock must be a non-negative number" });
    }
    fields.push("stock = ?");
    values.push(stock);
  }
  if (category_id) {
    fields.push("category_id = ?");
    values.push(category_id);
  }

  if (req.file) {
    fields.push("image = ?");
    values.push(req.file.filename);
  } else if (bodyImage) {
    fields.push("image = ?");
    values.push(bodyImage);
  }

  if (fields.length === 0) {
    return res.status(400).json({ message: "No valid fields provided for update" });
  }

  try {
    const [result] = await db.query(
      `UPDATE products SET ${fields.join(", ")} WHERE id = ?`,
      [...values, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error?.message || "Internal server error" });
  }
};
export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: "Id required" });
  try {
    await db.query(`DELETE FROM products WHERE id = ?`, [id]);
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
}

export const getProduct = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: "Id required" });
  try {
    const [row] = await db.query(`SELECT *FROM products WHERE id = ?`, [id]);
    if (row.length === 0) return res.status(404).json({ message: "Product not found!" });
    res.status(200).json(row);
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
}