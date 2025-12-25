import { db } from "../config/connect_database.js";
import jwt from "jsonwebtoken";

export const adminRefreshToken = async (req, res) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.jwt) {
      return res.status(401).json({ message: "No refresh token" });
    }

    const refreshToken = cookies.jwt;

    // MySQL2 returns [rows, fields]
    const [rows] = await db.query(
      `SELECT * FROM admins WHERE refresh_token = ?`,
      [refreshToken]
    );

    if (rows.length === 0) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const admin = rows[0];

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err || admin.name !== decoded?.userInfo?.name) {
        return res.status(403).json({ message: "Token verification failed" });
      }

      const accessToken = jwt.sign(
        {
          userInfo: {
            name: admin.name,
            roles: admin.role,
          },
        },
        process.env.ACCESS_TOKEN_SECRET, 
        { expiresIn: "10m" }
      );

      res.json({ accessToken });
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ message: "Server error during token refresh" });
  }
};

export const customerRefreshToken = async (req, res) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.jwt) {
      return res.status(401).json({ message: "No refresh token" });
    }

    const refreshToken = cookies.jwt;

    // MySQL2 returns [rows, fields]
    const [rows] = await db.query(
      `SELECT * FROM customers WHERE refresh_token = ?`,
      [refreshToken]
    );

    if (rows.length === 0) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const customer = rows[0];

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err || customer.name !== decoded?.userInfo?.name) {
        return res.status(403).json({ message: "Token verification failed" });
      }

      const accessToken = jwt.sign(
        {
          userInfo: {
            name: customer.name,
            roles: customer.role,
          },
        },
        process.env.ACCESS_TOKEN_SECRET, 
        { expiresIn: "10m" }
      );

      res.json({ accessToken });
    });  
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ message: "Server error during token refresh" });
  }
};  
    