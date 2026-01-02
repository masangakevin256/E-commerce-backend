import { db } from "../config/connect_database.js";
import jwt from "jsonwebtoken";

// EDITED: Unified refresh token handler for both admins and customers
export const handleRefreshToken = async (req, res) => {
  try {
    const cookies = req.cookies;

    // EDITED: Check if jwt cookie exists
    if (!cookies?.jwt) {
      return res.status(401).json({ message: "No refresh token" });
    }

    const refreshToken = cookies.jwt;

    // EDITED: Verify the token FIRST to extract payload and know which table to query
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        if (err) {
          return res.status(403).json({ message: "Token verification failed" });
        }

        const userInfo = decoded?.userInfo;
        if (!userInfo) {
          return res.status(403).json({ message: "Invalid token structure" });
        }

        let foundUser;
        let isMatch = false;

        // EDITED: Check if it's an admin or customer based on ID presence
        if (userInfo.admin_id) {
          // It's an admin
          const result = await db.query(
            `SELECT * FROM admins WHERE refresh_token = $1`,
            [refreshToken]
          );
          if (result.rows.length > 0) {
            foundUser = result.rows[0];
            // EDITED: Verify name matches (security check)
            if (foundUser.name === userInfo.name) isMatch = true;
          }
        } else if (userInfo.customer_id) {
          // It's a customer
          const result = await db.query(
            `SELECT * FROM customers WHERE refresh_token = $1`,
            [refreshToken]
          );
          if (result.rows.length > 0) {
            foundUser = result.rows[0];
            // EDITED: Verify name matches
            if (foundUser.name === userInfo.name) isMatch = true;
          }
        }

        if (!isMatch || !foundUser) {
          return res.status(403).json({ message: "User not found or token reuse detected" });
        }

        // EDITED: Generate new Access Token
        // Construct payload ensuring we keep the same structure as login
        const roles = userInfo.roles;
        // Note: We use the data from the DB to be safe, or from the decoded token ensuring consistency

        const accessToken = jwt.sign(
          {
            userInfo: {
              // Determine IDs dynamically
              ...(userInfo.admin_id ? { admin_id: userInfo.admin_id } : {}),
              ...(userInfo.customer_id ? { customer_id: userInfo.customer_id } : {}),
              name: userInfo.name, // Use decoded name or db name
              email: userInfo.email, // Ensure email is passed if used
              roles: roles,
            },
          },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "15m" } // EDITED: 15 minutes expiry
        );

        res.json({ accessToken });
      }
    );

  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ message: "Server error during token refresh" });
  }
};