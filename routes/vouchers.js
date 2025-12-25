import express from "express";
import { getAvailableVouchers, validateVoucher, getAllVouchers, createVoucher, deleteVoucher, toggleVoucherStatus } from "../controllers/controlVouchers.js";
import { verifyRoles } from "../middleware/verifyRoles.js";
import { ROLE_LIST } from "../config/role_list.js";

export const voucherRouter = express.Router();

// Admin routes
voucherRouter.get("/admin", verifyRoles(ROLE_LIST.admin), getAllVouchers);
voucherRouter.post("/", verifyRoles(ROLE_LIST.admin), createVoucher);
voucherRouter.patch("/:id/status", verifyRoles(ROLE_LIST.admin), toggleVoucherStatus);
voucherRouter.delete("/:id", verifyRoles(ROLE_LIST.admin), deleteVoucher);

// Customer routes
voucherRouter.get("/", verifyRoles(ROLE_LIST.customer, ROLE_LIST.admin), getAvailableVouchers);
voucherRouter.post("/validate", verifyRoles(ROLE_LIST.customer, ROLE_LIST.admin), validateVoucher);
