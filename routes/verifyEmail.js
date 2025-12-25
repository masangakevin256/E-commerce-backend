import express from "express";
import { customerVerifyEmail, verifyAdminEmail } from "../controllers/controlVerifyEmail.js";
export const emailRouter = express.Router();

emailRouter.get("/customers", customerVerifyEmail);
emailRouter.get("/admins",  verifyAdminEmail);