import express from "express";
import { verifyRoles } from "../middleware/verifyRoles.js";
import { ROLE_LIST } from "../config/role_list.js";
import { checkout } from "../controllers/controlCheckOut.js";

export const checkoutRouter = express.Router();

checkoutRouter.post("/", verifyRoles(ROLE_LIST.customer), checkout);