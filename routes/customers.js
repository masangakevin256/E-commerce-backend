import express from "express";
import { deleteCustomer, getAllCustomers, getCustomer, updateCustomer, uploadProfilePic } from "../controllers/controlCustomers.js";
export const customersRouter = express.Router();
import { verifyRoles } from "../middleware/verifyRoles.js";
import { ROLE_LIST } from "../config/role_list.js";
import { profileUpload } from "../uploads/profileUpload.js";

customersRouter.get("/", verifyRoles(ROLE_LIST.customer, ROLE_LIST.admin), getAllCustomers);
customersRouter.post("/upload-profile-pic", verifyRoles(ROLE_LIST.customer), profileUpload.single("profile_pic"), uploadProfilePic);
customersRouter.put("/:id", verifyRoles(ROLE_LIST.customer, ROLE_LIST.admin), updateCustomer);
customersRouter.delete("/:id", verifyRoles(ROLE_LIST.admin), deleteCustomer);
customersRouter.get("/:id", verifyRoles(ROLE_LIST.customer, ROLE_LIST.admin), getCustomer);