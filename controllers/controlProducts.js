import { db } from "../config/connect_database.js";

export const getAllProducts = async (req, res) => {
  try {
    // Get query parameters with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100; // Changed from 12 to 100
    const search = req.query.search || '';
    const category_id = req.query.category_id || '';
    const sort_by = req.query.sort_by || 'p.created_at';
    const sort_order = req.query.sort_order || 'DESC';
    
    // Calculate offset
    const offset = (page - 1) * limit;
    
    // Build WHERE conditions dynamically
    const whereConditions = [];
    const queryParams = [];
    
    // Add search condition if provided
    if (search) {
      whereConditions.push(`(p.name ILIKE $${queryParams.length + 1} OR p.description ILIKE $${queryParams.length + 1})`);
      queryParams.push(`%${search}%`);
    }
    
    // Add category filter if provided
    if (category_id) {
      whereConditions.push(`p.category_id = $${queryParams.length + 1}`);
      queryParams.push(category_id);
    }
    
    // Combine WHERE conditions
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';
    
    // Build the main query
    const productsQuery = `
      SELECT p.id, p.name, p.price, p.stock, p.image, p.description, p.category_id,
             c.name AS category_name
      FROM products AS p
      LEFT JOIN categories AS c ON c.id = p.category_id
      ${whereClause}
      ORDER BY ${sort_by} ${sort_order}
      LIMIT $${queryParams.length + 1}
      OFFSET $${queryParams.length + 2}
    `;
    
    // Add limit and offset to query params
    queryParams.push(limit, offset);
    
    // Execute products query
    const result = await db.query(productsQuery, queryParams);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total_count
      FROM products AS p
      ${whereClause}
    `;
    
    // Remove limit and offset from params for count query
    const countParams = queryParams.slice(0, -2);
    const countResult = await db.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].total_count);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);
    
    // Send response with pagination info
    res.status(200).json({
      success: true,
      products: result.rows,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalProducts: totalCount,
        limit: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
    
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error fetching products',
      error: error?.message 
    });
  }
};

export const addNewProduct = async (req, res) => {
  const { name, description, price, stock, category_id } = req.body;

  if (!name || !price || !stock || !category_id) {
    return res.status(400).json({ message: "Name, price, stock, and category are required" });
  }

  let image;
  if (req.file) {
    image = req.file.filename;
  } else if (req.body.image) {
    image = req.body.image;
  }

  if (!image) {
    return res.status(400).json({ message: "Product image or URL is required" });
  }

  try {
    await db.query(
      `INSERT INTO products (name, description, price, stock, image, category_id) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [name, description || "", price, stock, image, category_id]
    );
    res.status(200).json({ message: "Product added successfully" });
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, category_id, image: bodyImage } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Product ID is required" });
  }

  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (name) {
    fields.push(`name = $${paramIndex++}`);
    values.push(name);
  }
  if (description) {
    fields.push(`description = $${paramIndex++}`);
    values.push(description);
  }
  if (price !== undefined) {
    if (isNaN(price) || price < 0) {
      return res.status(400).json({ message: "Price must be a non-negative number" });
    }
    fields.push(`price = $${paramIndex++}`);
    values.push(price);
  }
  if (stock !== undefined) {
    if (isNaN(stock) || stock < 0) {
      return res.status(400).json({ message: "Stock must be a non-negative number" });
    }
    fields.push(`stock = $${paramIndex++}`);
    values.push(stock);
  }
  if (category_id) {
    fields.push(`category_id = $${paramIndex++}`);
    values.push(category_id);
  }

  if (req.file) {
    fields.push(`image = $${paramIndex++}`);
    values.push(req.file.filename);
  } else if (bodyImage) {
    fields.push(`image = $${paramIndex++}`);
    values.push(bodyImage);
  }

  if (fields.length === 0) {
    return res.status(400).json({ message: "No valid fields provided for update" });
  }

  values.push(id);

  try {
    const result = await db.query(
      `UPDATE products SET ${fields.join(", ")} WHERE id = $${paramIndex}`,
      values
    );

    if (result.rowCount === 0) {
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
    const result = await db.query(`DELETE FROM products WHERE id = $1`, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
};

export const getProduct = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: "Id required" });
  try {
    const result = await db.query(`SELECT * FROM products WHERE id = $1`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Product not found!" });
    res.status(200).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
};