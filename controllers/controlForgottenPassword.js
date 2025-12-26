import {db} from "../config/connect_database.js";
import bcrypt from "bcrypt";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";
export const requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  
  console.log("🚨 === PASSWORD RESET REQUEST (FIXED) ===");
console.log("Request time:", new Date().toISOString());

if (!email) return res.status(400).json({ message: "Email required" });

// Check customer
const result = await db.query("SELECT * FROM customers WHERE email = $1", [email]);
if (result.rows.length === 0) {
  return res.status(404).json({ message: "No account found with that email" });
}

// Generate new token
const resetToken = crypto.randomBytes(32).toString("hex");
console.log("New token (first 10):", resetToken.substring(0, 10) + "...");

// Save token with expiry (Postgres style)
try {
  await db.query(
    "UPDATE customers SET reset_token = $1, reset_expires = NOW() + interval '15 minutes' WHERE email = $2",
    [resetToken, email]
  );
  console.log("✓ Token saved with TIMESTAMP expiry");
} catch (error) {
  console.error("Database error:", error.message);
  return res.status(500).json({ message: "Database error" });
}

// VERIFY with proper TIMESTAMP format
const verifyResult = await db.query(
  `SELECT 
      reset_token,
      reset_expires,
      reset_expires::date AS expiry_date_only,
      reset_expires::time AS expiry_time_only,
      NOW() AS db_now,
      EXTRACT(EPOCH FROM (reset_expires - NOW())) AS seconds_left
   FROM customers WHERE email = $1`,
  [email]
);

const verify = verifyResult.rows[0];

  
  console.log('📊 === VERIFICATION ===');
  console.log('Full expiry (DATETIME):', verify[0]?.reset_expires);
  console.log('Date part only:', verify[0]?.expiry_date_only);
  console.log('Time part only:', verify[0]?.expiry_time_only);
  console.log('Database NOW:', verify[0]?.db_now);
  console.log('Seconds until expiry:', verify[0]?.seconds_left);
  console.log('Minutes until expiry:', verify[0]?.seconds_left / 60);
  
  if (!verify[0]?.expiry_time_only) {
    console.error('❌ ERROR: No time part stored! Column is still DATE type?');
  }
  
  console.log('================================');

  // Send email
  const encodedEmail = encodeURIComponent(email);
  const resetUrl = `https://e-commerce-backend-0qbw.onrender.com/resetPassword/customers?email=${encodedEmail}&token=${resetToken}`;
  
 
  
  await sendEmail({
    to: email,
    subject: "🔒 Reset Your Password - Kisii University E‑Commerce",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        </style>
      </head>
      <body style="margin:0; padding:20px; background-color:#f8fafc; font-family:'Inter',Arial,sans-serif;">
        
        <div style="max-width:580px; margin:20px auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 25px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #004080 0%, #0066cc 100%); padding:32px 20px; text-align:center;">
            <div style="display:inline-block; background:rgba(255,255,255,0.15); padding:12px; border-radius:12px; margin-bottom:16px;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <h1 style="margin:0; color:white; font-size:24px; font-weight:600;">Password Reset</h1>
            <p style="margin:8px 0 0; color:rgba(255,255,255,0.9); font-size:14px; font-weight:300;">Kisii University E‑Commerce</p>
          </div>
          
          <!-- Content -->
          <div style="padding:32px;">
            
            <div style="margin-bottom:28px;">
              <h2 style="margin:0 0 16px; color:#1e293b; font-size:20px; font-weight:600;">
                Password Reset Requested
              </h2>
              <p style="margin:0 0 20px; color:#64748b; line-height:1.6; font-size:15px;">
                We received a request to reset your password. Click the button below to create a new password.
              </p>
            </div>
            
            <!-- Reset Card -->
            <div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:12px; padding:24px; margin:28px 0; text-align:center;">
              <div style="width:48px; height:48px; background:#004080; border-radius:50%; margin:0 auto 16px; display:flex; align-items:center; justify-content:center;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                </svg>
              </div>
              <h3 style="margin:0 0 12px; color:#004080; font-size:18px; font-weight:600;">
                Create New Password
              </h3>
              <p style="margin:0 0 24px; color:#475569; line-height:1.6; font-size:14px;">
                This link expires in <strong style="color:#dc2626;">15 minutes</strong>
              </p>
              
              <a href="${resetUrl}"
                 style="display:inline-block; background:linear-gradient(135deg, #004080 0%, #0066cc 100%); color:white; padding:14px 32px; border-radius:10px; text-decoration:none; font-weight:600; font-size:15px; box-shadow:0 4px 12px rgba(0,100,204,0.2); cursor:pointer;">
                Reset Password
              </a>
              
              <div style="margin-top:20px; padding:12px; background:#f8fafc; border-radius:8px; font-family:'Courier New',monospace; font-size:12px; word-break:break-all;">
                <p style="margin:0 0 4px; color:#64748b; font-size:11px;">Or copy this link:</p>
                <p style="margin:0; color:#004080;">${resetUrl}</p>
              </div>
            </div>
            
            <!-- Security Note -->
            <div style="margin:28px 0; padding:16px; background:#fef2f2; border-radius:8px; border-left:4px solid #dc2626;">
              <h4 style="margin:0 0 8px; color:#dc2626; font-size:14px; font-weight:600; display:flex; align-items:center; gap:6px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#dc2626">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
                Security Notice
              </h4>
              <ul style="margin:8px 0 0; padding-left:20px; color:#7c2d12; font-size:13px; line-height:1.5;">
                <li>If you didn't request this, please ignore this email</li>
                <li>Keep this link confidential</li>
                <li>Password must be at least 8 characters with letters and numbers</li>
              </ul>
            </div>
            
            <div style="height:1px; background:#e2e8f0; margin:32px 0;"></div>
            
            <!-- Support -->
            <div style="text-align:center;">
              <p style="margin:0 0 8px; color:#64748b; font-size:13px;">
                Need help?
              </p>
              <p style="margin:0; color:#004080; font-size:13px; font-weight:500;">
                support@kisiiuniversity.ac.ke
              </p>
            </div>
            
          </div>
          
          <!-- Footer -->
          <div style="background:#1e293b; padding:24px; text-align:center;">
            <div style="margin-bottom:16px;">
              <span style="color:white; font-size:14px; font-weight:600;">Kisii University E‑Commerce</span>
            </div>
            <p style="margin:8px 0; color:#94a3b8; font-size:12px; line-height:1.5;">
              This is an automated password reset request.
            </p>
            <p style="margin:16px 0 0; color:#64748b; font-size:11px;">
              © ${new Date().getFullYear()} Kisii University
            </p>
          </div>
          
        </div>
        
        <!-- Mobile -->
        <style>
          @media only screen and (max-width: 600px) {
            div[style*="max-width:580px"] {
              margin: 10px auto !important;
              border-radius: 12px !important;
            }
            div[style*="padding:32px"] {
              padding: 24px !important;
            }
            h1 { font-size: 20px !important; }
            h2 { font-size: 18px !important; }
            a[style*="padding:14px 32px"] {
              padding: 12px 24px !important;
              display: block !important;
              margin: 0 20px !important;
            }
          }
        </style>
        
      </body>
      </html>
    `
  });

  res.status(200).json({ 
    success: true,
    message: "Password reset link sent to your email",
    debug: {
      token_set: !!verify[0]?.reset_token,
      expiry_has_time: !!verify[0]?.expiry_time_only,
      minutes_valid: verify[0]?.seconds_left / 60
    }
  });
};
export const handlePasswordReset = async (req, res) => {
  // This should only handle POST requests
  const { email, token, newPassword, confirmPassword } = req.body;

  if (!email || !token || !newPassword || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  // Validate passwords match
  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "Passwords do not match",
    });
  }

  // Validate password strength
  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters",
    });
  }

  // Check token validity - email should already be decoded from the form
  const result = await db.query(
    "SELECT * FROM customers WHERE email = $1 AND reset_token = $2 AND reset_expires > NOW()",
    [email, token]
  );

  console.log("Token verification rows found:", result.rows.length);

  if (result.rows.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired reset link",
    });
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password and clear reset token
  await db.query(
    "UPDATE customers SET password = $1, reset_token = NULL, reset_expires = NULL WHERE email = $2",
    [hashedPassword, email]
  );

  console.log("Password updated successfully for:", email);

  res.status(200).json({
    success: true,
    message: "Password reset successful. You can now log in.",
  });
};

// Add this NEW function to serve the password reset form
export const serveResetPasswordForm = async (req, res) => {
  const { email, token } = req.query;
  
  
  
  if (!email || !token) {
    return res.status(400).send('Invalid link');
  }
  
  const decodedEmail = decodeURIComponent(email);
  
  try {
    // Get full datetime info
   const result = await db.query(
  `SELECT 
      reset_token,
      reset_expires,
      reset_expires::date AS expiry_date,
      reset_expires::time AS expiry_time,
      NOW() AS db_now
   FROM customers 
   WHERE email = $1 AND reset_token = $2`,
  [decodedEmail, token]
);

  const rows = result.rows;

  
    
    if (rows.length === 0) {
      
      return sendError(res, 'Invalid reset token');
    }
    
    
    
    // Check if expiry has time component
    if (!rows[0].expiry_time) {
      
      return sendError(res, 'System configuration error. Please contact support.');
    }
    
    // Check expiry
    const now = new Date();
    const expiryDate = new Date(rows[0].reset_expires);

    
    if (now > expiryDate) {
      console.log('Token expired');
      return sendError(res, `Reset link expired at ${expiryDate.toLocaleString()}`);
    }
    
    
    
    
      res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Password - Kisii University E‑Commerce</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', Arial, sans-serif;
            background-color: #f8fafc;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          
          .container {
            max-width: 480px;
            width: 100%;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
          }
          
          .header {
            background: linear-gradient(135deg, #004080 0%, #0066cc 100%);
            padding: 32px 20px;
            text-align: center;
          }
          
          .header h1 {
            color: white;
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 8px;
          }
          
          .header p {
            color: rgba(255,255,255,0.9);
            font-size: 14px;
            font-weight: 300;
          }
          
          .content {
            padding: 32px;
          }
          
          .form-group {
            margin-bottom: 24px;
          }
          
          .form-group label {
            display: block;
            color: #1e293b;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 8px;
          }
          
          .form-group input {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            font-size: 15px;
            font-family: 'Inter', sans-serif;
            transition: border-color 0.3s;
          }
          
          .form-group input:focus {
            outline: none;
            border-color: #004080;
            box-shadow: 0 0 0 3px rgba(0, 100, 204, 0.1);
          }
          
          .password-requirements {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
            font-size: 13px;
            color: #475569;
          }
          
          .password-requirements h4 {
            color: #004080;
            margin-bottom: 8px;
            font-size: 14px;
          }
          
          .password-requirements ul {
            padding-left: 20px;
          }
          
          .password-requirements li {
            margin-bottom: 4px;
          }
          
          .submit-btn {
            width: 100%;
            background: linear-gradient(135deg, #004080 0%, #0066cc 100%);
            color: white;
            padding: 14px;
            border: none;
            border-radius: 10px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 4px 12px rgba(0,100,204,0.2);
          }
          
          .submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0,100,204,0.3);
          }
          
          .submit-btn:active {
            transform: translateY(0);
          }
          
          .error-message {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 20px;
            color: #dc2626;
            font-size: 14px;
            display: none;
          }
          
          .success-message {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 20px;
            color: #16a34a;
            font-size: 14px;
            display: none;
          }
          
          .footer {
            text-align: center;
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 13px;
          }
          
          @media (max-width: 480px) {
            .container {
              max-width: 100%;
            }
            
            .content {
              padding: 24px;
            }
            
            .header {
              padding: 24px 20px;
            }
            
            .header h1 {
              font-size: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
            <p>Kisii University E‑Commerce</p>
          </div>
          
          <div class="content">
            <div class="success-message" id="successMessage">
              ✓ Token is valid! Expires at: ${expiryDate.toLocaleString()}
            </div>
            
            <div class="error-message" id="errorMessage"></div>
            
            <div class="password-requirements">
              <h4>Password Requirements:</h4>
              <ul>
                <li>At least 8 characters long</li>
                <li>Include both letters and numbers</li>
                <li>Should not be easily guessable</li>
              </ul>
            </div>
            
            <form id="resetForm">
              <input type="hidden" name="email" value="${decodedEmail}">
              <input type="hidden" name="token" value="${token}">
              
              <div class="form-group">
                <label for="newPassword">New Password</label>
                <input type="password" id="newPassword" name="newPassword" required>
              </div>
              
              <div class="form-group">
                <label for="confirmPassword">Confirm New Password</label>
                <input type="password" id="confirmPassword" name="confirmPassword" required>
              </div>
              
              <button type="submit" class="submit-btn">Reset Password</button>
            </form>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} Kisii University E‑Commerce</p>
              <p>This link expires at: ${expiryDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            </div>
          </div>
        </div>
        
        <script>
          document.getElementById('resetForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const data = {
              email: formData.get('email'),
              token: formData.get('token'),
              newPassword: formData.get('newPassword'),
              confirmPassword: formData.get('confirmPassword')
            };
            
            // Basic validation
            if (data.newPassword !== data.confirmPassword) {
              showError('Passwords do not match');
              return;
            }
            
            if (data.newPassword.length < 8) {
              showError('Password must be at least 8 characters long');
              return;
            }
            
            // Clear any previous messages
            hideMessages();
            
            // Show loading state
            const submitBtn = e.target.querySelector('.submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Resetting Password...';
            submitBtn.disabled = true;
            
            try {
              const response = await fetch('/resetPassword/customers', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
              });
              
              const result = await response.json();
              
              if (response.ok) {
                showSuccess('Password reset successfully! You can now log in with your new password.');
                document.getElementById('resetForm').reset();
                
                // Optionally redirect after 3 seconds
                setTimeout(() => {
                  window.location.href = "http://localhost:5173/;
                }, 3000);
              } else {
                showError(result.message || 'Failed to reset password');
              }
            } catch (error) {
              showError('Network error. Please try again.');
            } finally {
              submitBtn.textContent = originalText;
              submitBtn.disabled = false;
            }
          });
          
          function showError(message) {
            const errorEl = document.getElementById('errorMessage');
            errorEl.textContent = message;
            errorEl.style.display = 'block';
            
            // Hide after 5 seconds
            setTimeout(() => {
              errorEl.style.display = 'none';
            }, 5000);
          }
          
          function showSuccess(message) {
            const successEl = document.getElementById('successMessage');
            successEl.textContent = message;
            successEl.style.display = 'block';
          }
          
          function hideMessages() {
            document.getElementById('errorMessage').style.display = 'none';
            document.getElementById('successMessage').style.display = 'none';
          }
          
          // Real-time password validation
          const passwordInput = document.getElementById('newPassword');
          const confirmInput = document.getElementById('confirmPassword');
          
          confirmInput.addEventListener('input', () => {
            if (passwordInput.value !== confirmInput.value && confirmInput.value.length > 0) {
              confirmInput.style.borderColor = '#dc2626';
            } else {
              confirmInput.style.borderColor = '#e2e8f0';
            }
          });
        </script>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Error:', error);
    return sendError(res, 'System error');
  }
};

// Helper function for error responses
function sendError(res, message) {
  return res.status(400).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invalid Link</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .error { color: #dc2626; }
        .message { margin-top: 20px; }
        .debug { background: #f5f5f5; padding: 10px; margin: 10px; border-radius: 5px; font-family: monospace; }
      </style>
    </head>
    <body>
      <h1 class="error">Invalid or Expired Link</h1>
      <p class="message">${message}</p>
      <p>Please request a new password reset email.</p>
    </body>
    </html>
  `);
}