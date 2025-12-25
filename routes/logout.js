import express from "express";
import { adminLogout, customerLogout } from "../controllers/controlLogout.js";

export const logoutRouter = express.Router();

logoutRouter.post("/customers", customerLogout);
logoutRouter.post("/admins", adminLogout);