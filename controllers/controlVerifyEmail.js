import { db } from "../config/connect_database.js";
import path from "path";
import { fileURLToPath } from "url";
import { BASE_URL } from "../config/BASE_URL.js";

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const customerVerifyEmail = async (req, res) => {
  const { email, token } = req.query;
  if (!email || !token) {
    return res.status(400).json({ message: "Invalid link" });
  }

  try {
    const result = await db.query(
      "SELECT * FROM customers WHERE email = $1 AND verify_token = $2",
      [email, token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Invalid or expired token" });
    }

    await db.query(
      "UPDATE customers SET verify_email = 'active', verify_token = NULL WHERE email = $1",
      [email]
    );

    res.status(200).sendFile(path.join(__dirname, "../views/email.html"));
  } catch (error) {
    return res.status(500).json({ error: error?.message });
  }
};

export const verifyAdminEmail = async (req, res) => {
  const { email, token } = req.query;
  if (!email || !token) {
    return res.status(400).json({ message: "Invalid link" });
  }

  try {
    const result = await db.query(
      "SELECT * FROM admins WHERE email = $1 AND verify_token = $2",
      [email, token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Invalid or expired token" });
    }

    await db.query(
      "UPDATE admins SET verify_email = 'active', verify_token = NULL WHERE email = $1",
      [email]
    );

    res.status(200).sendFile(path.join(__dirname, "../views/email.html"));
  } catch (error) {
    return res.status(500).json({ error: error?.message });
  }
};

   