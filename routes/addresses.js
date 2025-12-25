import express from "express";
import { getAddresses, addAddress, deleteAddress } from "../controllers/controlAddresses.js";
import { verifyRoles } from "../middleware/verifyRoles.js";
import { ROLE_LIST } from "../config/role_list.js";

const router = express.Router();

router.get("/", verifyRoles(ROLE_LIST.customer), getAddresses);
router.post("/", verifyRoles(ROLE_LIST.customer), addAddress);
router.delete("/:id", verifyRoles(ROLE_LIST.customer), deleteAddress);

export default router;
