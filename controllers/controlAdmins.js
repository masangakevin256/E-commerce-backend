import { db } from "../config/connect_database.js";
import bcrypt from "bcrypt";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";

export const getAdmin = async (req, res) => {
    try {
        const user = req.user;

        const id = user.admin_id
        console.log(id)
        const admins = await db.query(
            `SELECT *FROM admins
            WHERE admin_id = ?
            `, [id]
        )
       
        res.status(200).json(admins[0]);
    } catch (error) {
        return res.status(500).json({ error: error?.message })
    }
}
export const  getAllAdmins =async  (req, res) => {
    try {
        const user = req.user;
        console.log(user)
        const admins = await  db.query(
            `SELECT *FROM admins
            `
        )
         console.log(admins)
        res.status(200).json(admins[0]);
    } catch (error) {
        return res.status(500).json({ error: error?.message })
    }
}

export const addNewAdmin = async (req, res) => {


    try {
        const { name, email, password, phoneNumber, secretReg } = req.body;
        const verifyToken = crypto.randomBytes(32).toString("hex");

        if (!name || !email || !password || !phoneNumber || !secretReg) {
            return res.status(400).json({ message: "All field required" });
        }

        if (secretReg !== process.env.SECRET_REG) {
            return res.status(400).json({ message: "Failed to verify the registration code" });
        }
        //only two admins in the system
        const adminCount = await db.query(
            `
            SELECT COUNT(*) as count FROM admins
            `
        )
        if (adminCount[0][0].count >= 1) {
            return res.status(400).json({ message: "Maximum number of admins reached" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const [rows] = await db.query("SELECT admin_id FROM admins ORDER BY created_at DESC LIMIT 1");

        let admin_id;
        if (rows.length === 0) {
            admin_id = "AD001";
        } else {
            const lastId = rows[0].admin_id; // e.g. "AD007"
            const num = parseInt(lastId.replace("AD", ""), 10) + 1;
            admin_id = `AD${String(num).padStart(3, "0")}`;
        }


        await db.query(
            `
            INSERT INTO admins (admin_id, name, email, password, phoneNumber, verify_token)
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [admin_id, name, email, hashedPassword, phoneNumber, verifyToken]
        )
        await sendEmail({
            to: email,
            subject: "Welcome to Kisii University E‑Commerce - Account Setup", // Less "admin" in subject
            html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Account Verification - Kisii University E‑Commerce</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            </style>
            </head>
            <body style="margin:0; padding:20px; background-color:#f8fafc; font-family:'Inter',Arial,sans-serif;">
            
            <!-- Main Container -->
            <div style="max-width:580px; margin:20px auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 25px rgba(0,0,0,0.05);">
                
                <!-- Header with Logo (More Neutral) -->
                <div style="background: linear-gradient(135deg, #004080 0%, #0066cc 100%); padding:32px 20px; text-align:center;">
                <div style="margin-bottom:16px;">
                    <span style="color:white; font-size:24px; font-weight:700; letter-spacing:-0.5px;">Kisii University</span>
                    <div style="color:rgba(255,255,255,0.9); font-size:16px; margin-top:4px;">E‑Commerce Platform</div>
                </div>
                </div>
                
                <!-- Body Content -->
                <div style="padding:32px;">
                
                <!-- Greeting (Less Formal) -->
                <div style="margin-bottom:28px;">
                    <h2 style="margin:0 0 16px; color:#1e293b; font-size:20px; font-weight:600;">
                    Hi ${name},
                    </h2>
                    <p style="margin:0 0 20px; color:#64748b; line-height:1.6; font-size:15px;">
                    Welcome to the Kisii University E‑Commerce platform! We're excited to have you join our community.
                    </p>
                </div>
                
                <!-- Account Info (Less "Admin" Emphasis) -->
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; margin:24px 0;">
                    <h3 style="margin:0 0 16px; color:#1e293b; font-size:16px; font-weight:600; display:flex; align-items:center; gap:8px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#004080">
                        <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                    Account Information
                    </h3>
                    <div style="display:grid; gap:12px;">
                    <div>
                        <span style="display:block; color:#64748b; font-size:13px; margin-bottom:4px;">Account ID</span>
                        <div style="background:white; padding:12px; border-radius:8px; border:1px solid #e2e8f0;">
                        <span style="color:#004080; font-weight:500; font-family:'Courier New',monospace;">${admin_id}</span>
                        </div>
                    </div>
                    <div>
                        <span style="display:block; color:#64748b; font-size:13px; margin-bottom:4px;">Email Address</span>
                        <div style="background:white; padding:12px; border-radius:8px; border:1px solid #e2e8f0;">
                        <span style="color:#004080; font-weight:500;">${email}</span>
                        </div>
                    </div>
                    <div>
                        <span style="display:block; color:#64748b; font-size:13px; margin-bottom:4px;">Account Type</span>
                        <div style="background:white; padding:12px; border-radius:8px; border:1px solid #e2e8f0;">
                        <span style="color:#004080; font-weight:500;">Platform Access</span>
                        </div>
                    </div>
                    </div>
                </div>
                
                <!-- Verification Section (Like Customer Email) -->
                <div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:12px; padding:24px; margin:28px 0; text-align:center;">
                    <div style="width:64px; height:64px; background:#004080; border-radius:50%; margin:0 auto 16px; display:flex; align-items:center; justify-content:center;">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    </div>
                    <h3 style="margin:0 0 12px; color:#004080; font-size:18px; font-weight:600;">
                    Verify Your Email Address
                    </h3>
                    <p style="margin:0 0 24px; color:#475569; line-height:1.6; font-size:14px;">
                    Please verify your email to complete your account setup
                    </p>
                    
                    <!-- Verification Button -->
                    <a href="http://localhost:3500/verifyEmail/admins?email=${encodeURIComponent(email)}&token=${verifyToken}"
                    style="display:inline-block; background:linear-gradient(135deg, #004080 0%, #0066cc 100%); color:white; padding:14px 32px; border-radius:10px; text-decoration:none; font-weight:600; font-size:15px; box-shadow:0 4px 12px rgba(0,100,204,0.2); cursor:pointer;">
                    Complete Account Setup
                    </a>
                    
                    <p style="margin:16px 0 0; color:#64748b; font-size:13px;">
                    This link expires in 24 hours
                    </p>
                </div>
                
                <!-- Next Steps (Generic, Not Admin-Specific) -->
                <div style="margin:28px 0; padding:20px; background:#f0f9ff; border-radius:12px; border-left:4px solid #004080;">
                    <h4 style="margin:0 0 12px; color:#004080; font-size:16px; font-weight:600;">After Verification</h4>
                    <ul style="margin:0; padding-left:20px; color:#475569; line-height:1.6; font-size:14px;">
                    <li style="margin-bottom:8px;">Access your account dashboard</li>
                    <li style="margin-bottom:8px;">Explore platform features</li>
                    <li>Get started with your tasks</li>
                    </ul>
                </div>
                
                <!-- Trust Indicators -->
                <div style="margin:28px 0; padding:16px; background:#f8fafc; border-radius:8px; text-align:center;">
                    <p style="margin:0 0 8px; color:#64748b; font-size:13px; font-weight:500;">
                    This email is from:
                    </p>
                    <p style="margin:0; color:#004080; font-size:14px; font-weight:600;">
                    Kisii University Official E‑Commerce System
                    </p>
                    <p style="margin:8px 0 0; color:#94a3b8; font-size:12px;">
                    No-reply automated message • kisiiuniversity.ac.ke domain
                    </p>
                </div>
                
                <!-- Divider -->
                <div style="height:1px; background:#e2e8f0; margin:32px 0;"></div>
                
                <!-- Support Info (Like Customer Email) -->
                <div style="text-align:center;">
                    <p style="margin:0 0 8px; color:#64748b; font-size:13px;">
                    Need help?
                    </p>
                    <p style="margin:0; color:#004080; font-size:13px; font-weight:500;">
                    Contact: support@kisiiuniversity.ac.ke
                    </p>
                    <p style="margin:12px 0 0; color:#94a3b8; font-size:12px;">
                    University IT Support Team
                    </p>
                </div>
                
                </div>
                
                <!-- Standard Footer (Like Customer Email) -->
                <div style="background:#1e293b; padding:24px; text-align:center;">
                <div style="margin-bottom:16px;">
                    <span style="color:white; font-size:14px; font-weight:600;">Kisii University Marketplace</span>
                    <span style="color:#cbd5e1; font-size:14px; margin:0 8px;">•</span>
                    <span style="color:#cbd5e1; font-size:14px;">Connecting the University Community</span>
                </div>
                
                <p style="margin:8px 0; color:#94a3b8; font-size:12px; line-height:1.5;">
                    This is an automated account creation email.
                </p>
                <p style="margin:16px 0 0; color:#64748b; font-size:11px;">
                    © ${new Date().getFullYear()} Kisii University E‑Commerce Platform<br>
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
                }
            </style>
            
            </body>
            </html>
        `,
        }).catch((err) => console.error("Email failed:", err));

        res.status(201).json({ message: `Admin ${name} created successfully.Check your email for verification!!` })

    } catch (error) {
        return res.status(500).json({ error: error?.message })
    }


}

export const updateAdmin = async (req, res) => {
    const { id } = req.params;
    const { name, email, phoneNumber, password, newPassword } = req.body;

    if (!id) return res.status(404).json({ message: "Id required" });

    try {
        // Fetch admin by ID
        const [rows] = await db.query(`SELECT * FROM admins WHERE admin_id = ?`, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "Admin not found" });
        }

        const admin = rows[0];
        let hashedPassword = admin.password; // keep old password by default

        // If password change requested
        if (password && newPassword) {
            
            const isMatch = await bcrypt.compare(password, admin.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Incorrect recent password" });
            }
            //check is new password is the same as recent
            if (password === newPassword) {
                return res.status(400).json({ message: "New password cannot be the same as recent password" });
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
        if (newPassword) {
            fields.push("password = ?");
            values.push(hashedPassword);
        }

        if (fields.length === 0) {
            return res.status(400).json({ message: "No fields provided to update" });
        }

        values.push(id); // for WHERE clause

        const [results] = await db.query(
            `UPDATE admins SET ${fields.join(", ")} WHERE admin_id = ?`,
            values
        );

        res.status(200).json({ message: "Admin updated successfully" });
    } catch (error) {
        return res.status(500).json({ error: error?.message });
    }
};

export const deleteAdmin = async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(404).json({ message: "Id required" });

    const [row] = await db.query(`SELECT *FROM admins WHERE admin_id = ?`, [id]);

    if (row.length === 0) return res.status(404).json({ message: "Admin not found!" });

    await db.query(
        `
        DELETE FROM admins
        WHERE admin_id = ?
        `, [id]
    );
    res.status(200).json({ message: "Admin deleted successfully" });
    try {

    } catch (error) {
        return res.status(500).json({ error: error?.message });
    }

}
// export const getAdmin = async (req, res) => {
//     const { id } = req.params;
//     if (!id) return res.status(404).json({ message: "Id required" });

//     const [row] = await db.query(`SELECT *FROM admins WHERE admin_id = ?`, [id]);

//     if (row.length === 0) return res.status(404).json({ message: "Admin not found!" });

//     const [rows] = await db.query(
//         `
//         SELECT *FROM admins
//         WHERE admin_id = ?
//         `, [id]
//     );
//     res.status(200).json(rows);
//     try {

//     } catch (error) {
//         return res.status(500).json({ error: error?.message });
//     }

// }

export const getDashboardStats = async (req, res) => {
    try {
        const [revenue] = await db.query("SELECT SUM(total) as total_revenue FROM orders WHERE status = 'paid'");
        const [orders] = await db.query("SELECT COUNT(*) as total_orders FROM orders");
        const [admins] = await db.query("SELECT COUNT(*) as total_admins FROM admins");
        const [products] = await db.query("SELECT COUNT(*) as total_products FROM products");
        const [lowStock] = await db.query("SELECT COUNT(*) as low_stock FROM products WHERE stock <= 5");

        // Sales trend for last 7 days
        const [salesTrend] = await db.query(`
            SELECT DATE(created_at) as date, SUM(total) as revenue 
            FROM orders 
            WHERE status = 'paid' 
            AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at) ASC
        `);

        // Category distribution
        const [categoryStats] = await db.query(`
            SELECT c.name as name, COUNT(p.id) as value
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id
            GROUP BY c.id, c.name
        `);

        res.status(200).json({
            totalRevenue: revenue[0].total_revenue || 0,
            totalOrders: orders[0].total_orders || 0,
            totaladmins: admins[0].total_admins || 0,
            totalProducts: products[0].total_products || 0,
            lowStock: lowStock[0].low_stock || 0,
            salesTrend: salesTrend,
            categoryStats: categoryStats
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
export const uploadProfilePic = async (req, res) => {
  const user = req.user;
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const filename = req.file.filename;

  try {
    // Try to update first
    try {
      await db.query(`UPDATE admins SET profile_pic = ? WHERE admin_id = ?`, [filename, user.admin_id]);
    } catch (updateErr) {
      // If it fails because column doesn't exist, try to add it
      if (updateErr.code === 'ER_BAD_FIELD_ERROR') {
        await db.query(`ALTER TABLE admins ADD COLUMN profile_pic VARCHAR(255) DEFAULT NULL`);
        await db.query(`UPDATE admins SET profile_pic = ? WHERE admin_id = ?`, [filename, user.admin_id]);
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