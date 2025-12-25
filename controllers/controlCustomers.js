import { db } from "../config/connect_database.js";
import bcrypt from "bcrypt";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";
const verifyToken = crypto.randomBytes(32).toString("hex");

export const getAllCustomers = async (req, res) => {
  try {
    //admin get all customers and customer get himself only
    const user = req.user;
    const role = user.roles;
    let row;
    if (role === "admin") {
      [row] = await db.query("SELECT * FROM customers");
    } else {
      [row] = await db.query(`SELECT * FROM customers WHERE customer_id = ?`, [user.customer_id]);
    }
    res.status(200).json(row);


  } catch (error) {
    return res.status(500).json({ error: error?.message });
  }
}

export const addNewCustomer = async (req, res) => {


  const { name, email, password, phoneNumber, referralCode: referredByCode } = req.body;

  if (!email || !name || !password || !phoneNumber) {
    return res.status(400).json({ message: "All fields are required" });
  }
  try {
    // 1. Ensure referral columns exist
    try {
      await db.query(`SELECT referral_code FROM customers LIMIT 1`);
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        await db.query(`ALTER TABLE customers ADD COLUMN referral_code VARCHAR(20) UNIQUE DEFAULT NULL`);
        await db.query(`ALTER TABLE customers ADD COLUMN referred_by VARCHAR(20) DEFAULT NULL`);
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [rows] = await db.query("SELECT customer_id FROM customers ORDER BY created_at DESC LIMIT 1");

    let customer_id;
    if (rows.length === 0) {
      customer_id = "CU001";
    } else {
      const lastId = rows[0].customer_id;
      const num = parseInt(lastId.replace("CU", ""), 10) + 1;
      customer_id = `CU${String(num).padStart(3, "0")}`;
    }

    // Generate unique referral code (e.g., NAME123)
    const referral_code = `${name.substring(0, 3).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;

    // Handle being referred
    let referred_by_id = null;
    if (referredByCode) {
      const [referrer] = await db.query("SELECT customer_id FROM customers WHERE referral_code = ?", [referredByCode]);
      if (referrer.length > 0) {
        referred_by_id = referrer[0].customer_id;
        // Award 10 points to referrer
        await db.query("UPDATE customers SET loyalty_points = loyalty_points + 10 WHERE customer_id = ?", [referred_by_id]);
        await db.query("INSERT INTO points_history (customer_id, points_change, reason) VALUES (?, ?, ?)",
          [referred_by_id, 10, `Referral bonus from ${name}`]);
      }
    }

    await db.query(
      `
            INSERT INTO customers (customer_id, name, email, verify_email, password, phoneNumber, verify_token, refresh_token, referral_code, referred_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [customer_id, name, email, "pending", hashedPassword, phoneNumber, verifyToken, "", referral_code, referred_by_id]
    );
    const message = `Customer ${name} created account`;
    await db.query(
            "INSERT INTO messages (admin_id, type, title, message, created_at) VALUES (?, ?, ?, ?, ? )",
            ["AD001", "New customer", "New customer added", message, new Date()]
        );
    await sendEmail({
      to: email,
      subject: "🔐 Verify Your Email - Kisii University E‑Commerce",
      html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Verify Your Email</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                </style>
                </head>
                <body style="margin:0; padding:20px; background-color:#f8fafc; font-family:'Inter',Arial,sans-serif;">
                
                <!-- Main Container -->
                <div style="max-width:580px; margin:20px auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 25px rgba(0,0,0,0.05);">
                    
                    <!-- Header with Gradient -->
                    <div style="background: linear-gradient(135deg, #004080 0%, #0066cc 100%); padding:32px 20px; text-align:center;">
                    <div style="display:inline-block; background:rgba(255,255,255,0.15); padding:12px; border-radius:12px; margin-bottom:16px;">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </div>
                    <h1 style="margin:0; color:white; font-size:24px; font-weight:600;">Email Verification Required</h1>
                    <p style="margin:8px 0 0; color:rgba(255,255,255,0.9); font-size:14px; font-weight:300;">Kisii University E‑Commerce</p>
                    </div>
                    
                    <!-- Body Content -->
                    <div style="padding:32px;">
                    
                    <!-- Welcome Section -->
                    <div style="margin-bottom:28px;">
                        <h2 style="margin:0 0 16px; color:#1e293b; font-size:20px; font-weight:600;">
                        Welcome, ${name}! 👋
                        </h2>
                        <p style="margin:0 0 20px; color:#64748b; line-height:1.6; font-size:15px;">
                        Thank you for registering with <strong style="color:#004080;">Kisii University E‑Commerce</strong>. 
                        We're excited to have you join our campus marketplace community!
                        </p>
                    </div>
                    
                    <!-- Verification Card -->
                    <div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:12px; padding:24px; margin:24px 0; text-align:center;">
                        <div style="width:64px; height:64px; background:#004080; border-radius:50%; margin:0 auto 16px; display:flex; align-items:center; justify-content:center;">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                            <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                        </svg>
                        </div>
                        <h3 style="margin:0 0 12px; color:#004080; font-size:18px; font-weight:600;">
                        One Last Step
                        </h3>
                        <p style="margin:0 0 24px; color:#475569; line-height:1.6; font-size:14px;">
                        Please verify your email address to activate your account and start shopping
                        </p>
                        
                        <!-- Verification Button -->
                        <a href="http://localhost:3500/verifyEmail/customers?email=${encodeURIComponent(email)}&token=${verifyToken}"
                        style="display:inline-block; background:linear-gradient(135deg, #004080 0%, #0066cc 100%); color:white; padding:14px 32px; border-radius:10px; text-decoration:none; font-weight:600; font-size:15px; transition:all 0.3s ease; box-shadow:0 4px 12px rgba(0,100,204,0.2);">
                        Verify Email Address
                        </a>
                        
                        <!-- Token Info (for manual entry) -->
                        <div style="margin-top:24px; padding:16px; background:white; border-radius:8px; border:1px dashed #cbd5e1;">
                        <p style="margin:0 0 8px; color:#64748b; font-size:12px; font-weight:500;">
                            Verification Token (if button doesn't work):
                        </p>
                        <div style="background:#f8fafc; padding:10px; border-radius:6px; font-family:'Courier New',monospace; font-size:12px; color:#004080; word-break:break-all;">
                            ${verifyToken}
                        </div>
                        <p style="margin:8px 0 0; color:#94a3b8; font-size:11px;">
                            Or visit: http://localhost:3500/verifyEmail/customers
                        </p>
                        </div>
                    </div>
                    
                    <!-- Why Verify Section -->
                    <div style="margin:28px 0; padding:20px; background:#f8fafc; border-radius:12px;">
                        <h4 style="margin:0 0 16px; color:#1e293b; font-size:16px; font-weight:600;">Why Verify Your Email?</h4>
                        <div style="display:grid; gap:12px;">
                        <div style="display:flex; align-items:flex-start; gap:12px;">
                            <div style="min-width:24px; width:24px; height:24px; background:#004080; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                            <span style="color:white; font-size:12px; font-weight:600;">1</span>
                            </div>
                            <div>
                            <p style="margin:0; color:#475569; font-size:14px; font-weight:500;">Secure Your Account</p>
                            <p style="margin:4px 0 0; color:#64748b; font-size:13px;">Protect your personal information and orders</p>
                            </div>
                        </div>
                        <div style="display:flex; align-items:flex-start; gap:12px;">
                            <div style="min-width:24px; width:24px; height:24px; background:#004080; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                            <span style="color:white; font-size:12px; font-weight:600;">2</span>
                            </div>
                            <div>
                            <p style="margin:0; color:#475569; font-size:14px; font-weight:500;">Receive Order Updates</p>
                            <p style="margin:4px 0 0; color:#64748b; font-size:13px;">Get notifications about your purchases</p>
                            </div>
                        </div>
                        <div style="display:flex; align-items:flex-start; gap:12px;">
                            <div style="min-width:24px; width:24px; height:24px; background:#004080; border-radius:50%; display-flex; align-items:center; justify-content:center;">
                            <span style="color:white; font-size:12px; font-weight:600;">3</span>
                            </div>
                            <div>
                            <p style="margin:0; color:#475569; font-size:14px; font-weight:500;">Access All Features</p>
                            <p style="margin:4px 0 0; color:#64748b; font-size:13px;">Unlock complete shopping experience</p>
                            </div>
                        </div>
                        </div>
                    </div>
                    
                    <!-- Important Notes -->
                    <div style="margin:28px 0; padding:16px; background:#fef2f2; border-radius:8px; border-left:4px solid #dc2626;">
                        <h4 style="margin:0 0 8px; color:#dc2626; font-size:14px; font-weight:600; display:flex; align-items:center; gap:6px;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#dc2626">
                            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                        </svg>
                        Important Information
                        </h4>
                        <ul style="margin:8px 0 0; padding-left:20px; color:#7c2d12; font-size:13px; line-height:1.5;">
                        <li>This verification link expires in 24 hours</li>
                        <li>Keep your verification token confidential</li>
                        <li>If you didn't create this account, please ignore this email</li>
                        <li>For security, this is a localhost link for development</li>
                        </ul>
                    </div>
                    
                    <!-- Divider -->
                    <div style="height:1px; background:#e2e8f0; margin:32px 0;"></div>
                    
                    <!-- Support Info -->
                    <div style="text-align:center;">
                        <p style="margin:0 0 8px; color:#64748b; font-size:13px;">
                        Need help with verification?
                        </p>
                        <a href="mailto:verification-help@kisiiuniversity.ac.ke" 
                        style="color:#004080; text-decoration:none; font-size:13px; font-weight:500;">
                        verification-help@kisiiuniversity.ac.ke
                        </a>
                        <p style="margin:12px 0 0; color:#94a3b8; font-size:12px;">
                        Or contact: +254 XXX XXX XXX (University IT Support)
                        </p>
                    </div>
                    
                    </div>
                    
                    <!-- Footer -->
                    <div style="background:#1e293b; padding:24px; text-align:center;">
                    <div style="margin-bottom:16px;">
                        <span style="color:white; font-size:14px; font-weight:600;">Kisii University E‑Commerce</span>
                        <span style="color:#cbd5e1; font-size:14px; margin:0 8px;">•</span>
                        <span style="color:#cbd5e1; font-size:14px;">Development Environment</span>
                    </div>
                    
                    <!-- Localhost Notice -->
                    <div style="margin:16px 0; padding:12px; background:rgba(255,255,255,0.05); border-radius:8px;">
                        <p style="margin:0; color:#fbbf24; font-size:12px; display:flex; align-items:center; justify-content:center; gap:6px;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24">
                            <path d="M13 16h-1v-4h1m0-4h-1v2h1m5-6H9a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2z"/>
                        </svg>
                        This is a localhost development link (http://localhost:3500)
                        </p>
                    </div>
                    
                    <p style="margin:8px 0; color:#94a3b8; font-size:12px; line-height:1.5;">
                        This verification email is valid for development purposes only.
                    </p>
                    <p style="margin:16px 0 0; color:#64748b; font-size:11px;">
                        © ${new Date().getFullYear()} Kisii University E‑Commerce Platform (Development)<br>
                        P.O Box 408-40200, Kisii, Kenya
                    </p>
                    </div>
                    
                </div>
                
                <!-- Mobile Optimizations -->
                <style>
                    @media only screen and (max-width: 600px) {
                    div[style*="max-width:580px"] {
                        margin: 10px auto !important;
                        border-radius: 12px !important;
                    }
                    div[style*="padding:32px"] {
                        padding: 24px !important;
                    }
                    h1 {
                        font-size: 20px !important;
                    }
                    h2 {
                        font-size: 18px !important;
                    }
                    a[style*="padding:14px 32px"] {
                        padding: 12px 24px !important;
                        display: block !important;
                        margin: 0 20px !important;
                    }
                    div[style*="display:grid; gap:12px;"] {
                        grid-template-columns: 1fr !important;
                    }
                    }
                </style>
                
                </body>
                </html>
            `
    }).catch(err => console.log(err));

    res.status(200).json({ message: `Customer ${name} successfully.Check your email for verification!!` });

  } catch (error) {
    return res.status(500).json({ error: error?.message });
  }
}
export const updateCustomer = async (req, res) => {
  const user = req.user;
  const role = user.roles;
  const { id } = req.params;
  const { name, email, phoneNumber, address, password, newPassword } = req.body;

  if (!id) return res.status(404).json({ message: "Id required" });

  try {
    // Safeguard: Ensure columns exist
    try {
      await db.query(`SELECT address, phoneNumber FROM customers LIMIT 1`);
    } catch (schemaErr) {
      if (schemaErr.code === 'ER_BAD_FIELD_ERROR') {
        if (schemaErr.sqlMessage.includes('address')) {
          await db.query(`ALTER TABLE customers ADD COLUMN address TEXT DEFAULT NULL`);
        }
        if (schemaErr.sqlMessage.includes('phoneNumber')) {
          await db.query(`ALTER TABLE customers ADD COLUMN phoneNumber VARCHAR(20) DEFAULT NULL`);
        }
      }
    }

    // Fetch customer by ID
    const [rows] = await db.query(`SELECT * FROM customers WHERE customer_id = ?`, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Customer not found!" });
    }
    //customer can only update themselves
    if (role === "customer" && rows[0].customer_id !== user.customer_id) return res.status(400).json({ message: "Unauthorized" });
    const customer = rows[0];
    let hashedPassword = customer.password; // keep old password by default

    // If password change requested
    if (password && newPassword) {
      const isMatch = await bcrypt.compare(password, customer.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Incorrect current password" });
      }
      //check if the recent password is the same as the new password
      if (password === newPassword) {
        return res.status(400).json({ message: "New password cannot be the same as the current password" });
      }

      hashedPassword = await bcrypt.hash(newPassword, 10);
    }

    // Build dynamic update fields
    const fields = [];
    const values = [];

    if (name) {
      fields.push("name = ?");
      values.push(name);
    }
    if (email) {
      fields.push("email = ?");
      values.push(email);
    }
    if (phoneNumber) {
      fields.push("phoneNumber = ?");
      values.push(phoneNumber);
    }
    if (address) {
      fields.push("address = ?");
      values.push(address);
    }
    if (newPassword) {
      fields.push("password = ?");
      values.push(hashedPassword);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "No fields provided to update" });
    }

    values.push(id); // for WHERE clause

    await db.query(
      `UPDATE customers SET ${fields.join(", ")} WHERE customer_id = ?`,
      values
    );

    res.status(200).json({ message: "Customer updated successfully" });
  } catch (error) {
    return res.status(500).json({ error: error?.message });
  }
};

export const deleteCustomer = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(404).json({ message: "Id required" });

  try {
    const [rows] = await db.query(`SELECT * FROM customers WHERE customer_id = ?`, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Customer not found!" });
    }

    await db.query(`DELETE FROM customers WHERE customer_id = ?`, [id]);
    res.status(200).json({ message: "Customer deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: error?.message });
  }
};

export const getCustomer = async (req, res) => {
  const user = req.user;
  const role = user.roles;
  const { id } = req.params;
  if (!id) return res.status(404).json({ message: "Id required" });

  try {
    const [rows] = await db.query(`SELECT * FROM customers WHERE customer_id = ?`, [id]);
    //customers can oly get themselves
    if (role === "customer" && rows[0].customer_id !== user.customer_id) return res.status(400).json({ message: "Unauthorized" });
    if (rows.length === 0) {
      return res.status(404).json({ message: "Customer not found!" });
    }

    res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ error: error?.message });
  }
};

export const uploadProfilePic = async (req, res) => {
  const user = req.user;
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const filename = req.file.filename;

  try {
    // Try to update first
    try {
      await db.query(`UPDATE customers SET profile_pic = ? WHERE customer_id = ?`, [filename, user.customer_id]);
    } catch (updateErr) {
      // If it fails because column doesn't exist, try to add it
      if (updateErr.code === 'ER_BAD_FIELD_ERROR') {
        await db.query(`ALTER TABLE customers ADD COLUMN profile_pic VARCHAR(255) DEFAULT NULL`);
        await db.query(`UPDATE customers SET profile_pic = ? WHERE customer_id = ?`, [filename, user.customer_id]);
      } else {
        throw updateErr;
      }
    }
    res.status(200).json({ message: "Profile picture updated successfully", filename });
  } catch (error) {
    console.error("Upload Error:", error);
    return res.status(500).json({ error: error?.message });
  }
};
