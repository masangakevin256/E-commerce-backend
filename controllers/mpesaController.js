import axios from "axios";
import moment from "moment";
import { db } from "../config/connect_database.js";
import { createNotification } from "./controlNotifications.js";

//Generate Access Token
const getAccessToken = async () => {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString("base64");

  const response = await axios.get(
    `${process.env.MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` } }
  );

  return response.data.access_token;
};

// Initiate STK Push
export const stkPush = async (req, res) => {
  try {
    const { phone, amount, orderId } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({ message: "Phone and amount required" });
    }

    // Validate environment variables
    const requiredEnvVars = {
      MPESA_BASE_URL: process.env.MPESA_BASE_URL,
      MPESA_CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY,
      MPESA_CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET,
      MPESA_SHORTCODE: process.env.MPESA_SHORTCODE,
      MPESA_PASSKEY: process.env.MPESA_PASSKEY,
      MPESA_CALLBACK_URL: process.env.MPESA_CALLBACK_URL,
    };

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      console.error("Missing M-Pesa environment variables:", missingVars);
      return res.status(500).json({
        message: `Server configuration error: Missing ${missingVars.join(", ")}`,
        missingVars
      });
    }

    console.log("M-Pesa Config Check:");
    console.log("- Base URL:", process.env.MPESA_BASE_URL);
    console.log("- Shortcode:", process.env.MPESA_SHORTCODE);
    console.log("- Callback URL:", process.env.MPESA_CALLBACK_URL);

    const accessToken = await getAccessToken();
    const timestamp = moment().format("YYYYMMDDHHmmss");

    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString("base64");

    const payload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone.replace("+", ""), // ensure format 2547XXXXXXXX
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: phone.replace("+", ""),
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: `Order${orderId}`,
      TransactionDesc: "E-commerce Checkout",
    };

    const response = await axios.post(
      `${process.env.MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const checkoutRequestID = response.data.CheckoutRequestID;

    // Store the checkoutRequestID in the order record
    // We should ensure the `orders` table has this column.
    try {
      await db.query(`UPDATE orders SET checkout_request_id = ? WHERE id = ?`, [checkoutRequestID, orderId]);
    } catch (dbErr) {
      console.error("Failed to store CheckoutRequestID:", dbErr.message);
      // If column doesn't exist, we might need to add it:
      // ALTER TABLE orders ADD COLUMN checkout_request_id VARCHAR(255);
    }

    res.json({ message: "STK Push initiated", data: response.data });
  } catch (error) {
    console.error("STK Push Error:", error.response?.data || error.message);
    console.error("Full error details:", JSON.stringify(error.response?.data, null, 2));
    console.error("Error type:", error.code);
    console.error("Request URL:", error.config?.url);
    
    res.status(500).json({
      message: error.response?.data?.errorMessage || error.response?.data?.message || error.message,
      errorCode: error.code,
      ...error.response?.data
    });
  }
};

//  Handle Callback
export const mpesaCallback = async (req, res) => {
  try {
    const { Body } = req.body;
    const resultCode = Body?.stkCallback?.ResultCode;
    const metadata = Body?.stkCallback?.CallbackMetadata?.Item;

    const accountRef = metadata?.find((i) => i.Name === "AccountReference")?.Value;
    const orderId = accountRef?.replace("Order", "");

    if (resultCode === 0) {
      // Payment successful
      await db.query(`UPDATE orders SET status = 'paid' WHERE id = ?`, [orderId]);

      // Notify the customer
      const [[order]] = await db.query(`SELECT customer_id FROM orders WHERE id = ?`, [orderId]);
      if (order) {
        await createNotification(
          order.customer_id,
          'payment',
          'Payment Confirmed!',
          `Payment for Order #${orderId} was successful. We are now processing your shipment.`
        );
      }
    } else {
      // Payment failed
      await db.query(`UPDATE orders SET status = 'pending' WHERE id = ?`, [orderId]);
    }

    res.json({ message: "Callback processed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};