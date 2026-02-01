import {db} from "../config/connect_database.js";
import bcrypt from  "bcrypt";
import jwt from "jsonwebtoken";

export const adminsLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const result = await db.query("SELECT * FROM admins WHERE email = $1", [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Admin not found!" });
    }

    const admin = result.rows[0];

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    if (admin.verify_email === "pending") {
      return res.status(400).json({ message: "Please verify your email" });
    }
    console.log(process.env)

    const accessToken = jwt.sign(
      {
        userInfo: {
          admin_id: admin.admin_id,
          name: admin.name,
          email: admin.email,
          roles: admin.role,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    const refreshToken = jwt.sign(
      {
        userInfo: {
          admin_id: admin.admin_id,
          name: admin.name,
          email: admin.email,
          roles: admin.role,
        },
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    await db.query(
      "UPDATE admins SET refresh_token = $1 WHERE admin_id = $2",
      [refreshToken, admin.admin_id]
    );

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000, // match refresh token expiry
    });

    res.json({
      message: `Admin ${admin.name} logged in successfully!`,
      accessToken,
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message });
  }
};


export const customerLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const result = await db.query("SELECT * FROM customers WHERE email = $1", [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found!" });
    }

    const customer = result.rows[0];

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    if (customer.verify_email === "pending") {
      return res.status(400).json({ message: "Please verify your email" });
    }

    const accessToken = jwt.sign(
      {
        userInfo: {
          customer_id: customer.customer_id,
          name: customer.name,
          email: customer.email,
          roles: customer.role,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    const refreshToken = jwt.sign(
      {
        userInfo: {
          customer_id: customer.customer_id,
          name: customer.name,
          email: customer.email,
          roles: customer.role,
        },
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    // store refresh token in DB
    await db.query(
      "UPDATE customers SET refresh_token = $1 WHERE customer_id = $2",
      [refreshToken, customer.customer_id]
    );

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: `Customer ${customer.name} logged in successfully!`,
      accessToken,
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message });
  }
};
