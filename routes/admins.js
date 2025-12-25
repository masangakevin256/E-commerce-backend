import express from "express";
import { addNewAdmin, deleteAdmin, getAdmin, getAllAdmins, getDashboardStats, updateAdmin, uploadProfilePic } from "../controllers/controlAdmins.js";
import { verifyRoles } from "../middleware/verifyRoles.js";
import { ROLE_LIST } from "../config/role_list.js";
export const adminsRouter = express.Router();
import { profileUpload } from "../uploads/profileUpload.js";

adminsRouter.get("/stats", verifyRoles(ROLE_LIST.admin), getDashboardStats);

adminsRouter.get("/", verifyRoles(ROLE_LIST.admin), getAdmin);
adminsRouter.get("/all", verifyRoles(ROLE_LIST.admin), getAllAdmins);
adminsRouter.post("/", verifyRoles(ROLE_LIST.admin), addNewAdmin);
adminsRouter.post("/upload-profile-pic", verifyRoles(ROLE_LIST.admin), profileUpload.single("profile_pic"), uploadProfilePic);
adminsRouter.put("/:id", verifyRoles(ROLE_LIST.admin), updateAdmin);
adminsRouter.delete("/:id", verifyRoles(ROLE_LIST.admin), deleteAdmin);
adminsRouter.get("/:id", verifyRoles(ROLE_LIST.admin), getAdmin);