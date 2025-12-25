import express from "express";
import { verifyRoles } from "../middleware/verifyRoles.js";
import { ROLE_LIST } from "../config/role_list.js";
import { getMessages, markRead, deleteMessage } from "../controllers/messagesController.js";

export const messageRouter = express.Router();

messageRouter.get("/", verifyRoles(ROLE_LIST.admin), getMessages);
messageRouter.put("/mark-read", verifyRoles(ROLE_LIST.admin), markRead);
messageRouter.delete("/:id", verifyRoles(ROLE_LIST.admin), deleteMessage);
