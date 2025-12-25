//logout file
import { db } from "../config/connect_database.js";

export const adminLogout = async (req, res) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204); // No content

    const refreshToken = cookies.jwt;

    // MySQL2 returns [rows, fields]
    const [rows] = await db.query(
      `SELECT * FROM admins WHERE refresh_token = ?`,
      [refreshToken]
    );

    if (rows.length > 0) {
      await db.query(
        `UPDATE admins SET refresh_token = NULL WHERE refresh_token = ?`,
        [refreshToken]
      );

      res.clearCookie("jwt", { httpOnly: true, sameSite: "Strict" });
      res.json({ message: `${rows[0].name} Logout successfully` });
      console.log(`${rows[0].username} Logout successfully`);
    } else {
      // No matching admin found
      res.clearCookie("jwt", { httpOnly: true, sameSite: "Strict" });
      res.sendStatus(204);
    }
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Server error during logout" });
  }
};

export const customerLogout = async (req, res) => {
  try {
    const user = req.user;
    const customer_id = user.customer_id;
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204); // No content

    const refreshToken = cookies.jwt;

    // MySQL2 returns [rows, fields]
    const [rows] = await db.query(
      `SELECT * FROM customers WHERE refresh_token = ?`,
      [refreshToken]
    );

    if (rows.length > 0) {
      await db.query(
        `UPDATE customers SET refresh_token = NULL WHERE refresh_token = ?`,
        [refreshToken]
      );
      //change the theme to light
      await db.query(
        `UPDATE customers SET theme_preference = 'light' WHERE customer_id = ?`,
        [customer_id]
      );
      res.clearCookie("jwt", { httpOnly: true, sameSite: "Strict" });
      res.json({ message: `${rows[0].name} Logout successfully` });
      console.log(`${rows[0].username} Logout successfully`);
    } else {
      // No matching admin found
      res.clearCookie("jwt", { httpOnly: true, sameSite: "Strict" });
      res.sendStatus(204);
    }
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Server error during logout" });
  }
};