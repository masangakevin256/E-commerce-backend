import dotenv from "dotenv/config";
import express from "express";
import { logger } from "./middleware/logEvents.js";
import { errorLog } from "./middleware/errorLog.js";
import { adminsRouter } from "./routes/admins.js"
import { customersRouter } from "./routes/customers.js"
import { loginRouter } from "./routes/login.js"
import { emailRouter } from "./routes/verifyEmail.js";
import { resetPasswordRouter } from "./routes/resetPassword.js";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser"; // EDITED: Imported cookie-parser
import { fileURLToPath } from "url";
import { verifyJwt } from "./middleware/verifyJwt.js";
import { errorRouter } from "./routes/error.js";
import { addCustomerRouter } from "./routes/register.js";
import { logoutRouter } from "./routes/logout.js";
import { refreshRouter } from "./routes/refresh.js";
import { categoriesRouter } from "./routes/categories.js";
import { productRouter } from "./routes/products.js";
import { cartRouter } from "./routes/cart.js";
import { orderRouter } from "./routes/orders.js";
import { checkoutRouter } from "./routes/checkout.js";
import { corsOptions } from "./controllers/controlCorsOption.js";
import { mpesaRouter, publicMpesaRouter } from "./routes/mpesa.js";
import { wishlistRouter } from "./routes/wishlist.js";
import { voucherRouter } from "./routes/vouchers.js";
import { notificationRouter } from "./routes/notifications.js";
import reviewRouter from "./routes/reviews.js";
import addressRouter from "./routes/addresses.js";
import { messageRouter } from "./routes/messages.js";
import { aiRouter } from "./routes/aiRouter.js";

const app = express();
// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
//custom middleware
app.use(express.json())
app.use(cookieParser()); // EDITED: Added cookie-parser middleware
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, "/public")));


const PORT = process.env.PORT || 3500;
//inbuilt middleware
app.use(logger);
app.use(cors(corsOptions))
//routes
//register new customer 
app.use("/register", addCustomerRouter);
app.use("/verifyEmail", emailRouter);
app.use("/resetPassword", resetPasswordRouter);
app.use("/login", loginRouter);
app.use("/logout", logoutRouter);

app.use("/uploads", express.static(path.join("uploads")));
//error file
app.use("/error", errorRouter);

// Public M-Pesa Callback
app.use("/api/mpesa", publicMpesaRouter);
app.use("/refresh", refreshRouter);
// verify jwt

app.use(verifyJwt);

// Protected routes
app.use("/api/mpesa", mpesaRouter);
app.use("/admins", adminsRouter);
app.use("/customers", customersRouter);
app.use("/categories", categoriesRouter);
app.use("/products", productRouter);
app.use("/cart", cartRouter);
app.use("/order", orderRouter);
app.use("/wishlist", wishlistRouter);
app.use("/vouchers", voucherRouter);
app.use("/notifications", notificationRouter);
app.use("/messages", messageRouter);
app.use("/checkout", checkoutRouter);
app.use("/reviews", reviewRouter);
app.use("/addresses", addressRouter);
app.use("/api/ai", aiRouter);


// sending error file
app.all(/.*/, (req, res) => {
    res.status(404);
    if (req.accepts("html")) {
        res.sendFile(path.join(__dirname, "views", "404.html"));
    } else if (req.accepts("json")) {
        res.json({ message: "404 Not Found" })
    } else {
        res.type("txt").send("404 Not Found");
    }
});

app.listen(PORT, () => console.log(`Server listening on Port ${PORT}`));
app.use(errorLog);
process.on("unhandledRejection", (error) => console.error(error));

