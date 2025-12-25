import { allowedOrigins } from "../config/white_list.js";

export const corsOptions = {
  origin: (origin, callback) => {
    // If no origin (e.g., Postman or mobile app), allow it
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true); //  allow request
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, //  allows cookies, tokens, etc.
  optionsSuccessStatus: 200
};

