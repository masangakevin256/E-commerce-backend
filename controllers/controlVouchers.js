import { db } from "../config/connect_database.js";

// ADMIN: Get all vouchers
export const getAllVouchers = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM vouchers ORDER BY created_at DESC");
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ADMIN: Create new voucher
export const createVoucher = async (req, res) => {
  const { code, description, discount_type, discount_value, min_spend, max_discount, expiry_date, usage_limit } = req.body;

  if (!code || !discount_type || !discount_value || !expiry_date) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  try {
    await db.query(
      `INSERT INTO vouchers (code, description, discount_type, discount_value, min_spend, max_discount, expiry_date, usage_limit) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [code.toUpperCase(), description, discount_type, discount_value, min_spend || 0, max_discount || null, expiry_date, usage_limit || null]
    );
    res.status(201).json({ message: "Voucher created successfully" });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: "Voucher code already exists" });
    }
    res.status(500).json({ error: error.message });
  }
};

// ADMIN: Update voucher status
export const toggleVoucherStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await db.query("UPDATE vouchers SET status = ? WHERE id = ?", [status, id]);
    res.status(200).json({ message: "Status updated" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ADMIN: Delete voucher
export const deleteVoucher = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM vouchers WHERE id = ?", [id]);
    res.status(200).json({ message: "Voucher deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CUSTOMER: Get available vouchers
export const getAvailableVouchers = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM vouchers WHERE status = 'active' AND expiry_date > NOW() AND (usage_limit IS NULL OR times_used < usage_limit)"
    );
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CUSTOMER: Validate and get discount amount
export const validateVoucher = async (req, res) => {
  const { code, cartTotal } = req.body;

  try {
    const [[voucher]] = await db.query(
      "SELECT * FROM vouchers WHERE code = ? AND status = 'active' AND expiry_date > NOW()",
      [code.toUpperCase()]
    );

    if (!voucher) {
      return res.status(404).json({ message: "Invalid or expired voucher" });
    }

    if (voucher.usage_limit !== null && voucher.times_used >= voucher.usage_limit) {
      return res.status(400).json({ message: "Voucher usage limit reached" });
    }

    if (cartTotal < voucher.min_spend) {
      return res.status(400).json({ message: `Minimum spend of KES ${voucher.min_spend} required` });
    }

    let discount = 0;
    if (voucher.discount_type === 'percentage') {
      discount = (voucher.discount_value / 100) * cartTotal;
      if (voucher.max_discount && discount > voucher.max_discount) {
        discount = voucher.max_discount;
      }
    } else {
      discount = Math.min(voucher.discount_value, cartTotal);
    }

    res.status(200).json({
      discount,
      code: voucher.code,
      type: voucher.discount_type,
      value: voucher.discount_value
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
