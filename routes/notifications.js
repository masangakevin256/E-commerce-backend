import express from "express";
import { getNotifications, markRead, deleteNotification } from "../controllers/controlNotifications.js";
import { verifyRoles } from "../middleware/verifyRoles.js";
import { ROLE_LIST } from "../config/role_list.js";

export const notificationRouter = express.Router();

notificationRouter.get("/", verifyRoles(ROLE_LIST.customer), getNotifications);
notificationRouter.put("/mark-read", verifyRoles(ROLE_LIST.customer), markRead);
notificationRouter.delete("/:id", verifyRoles(ROLE_LIST.customer), deleteNotification);
