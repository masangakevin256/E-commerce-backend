import express from "express";
import { addCategory, deleteCategory, getAllCategories, getCategory, updateCategory } from "../controllers/controlCategories.js";
import { verifyRoles } from "../middleware/verifyRoles.js";
import { ROLE_LIST } from "../config/role_list.js";
export const categoriesRouter = express.Router();

categoriesRouter.get("/", verifyRoles(ROLE_LIST.customer, ROLE_LIST.admin), getAllCategories);
categoriesRouter.post("/", verifyRoles(ROLE_LIST.admin), addCategory);
categoriesRouter.put("/:id", verifyRoles(ROLE_LIST.admin), updateCategory);
categoriesRouter.delete("/:id", verifyRoles(ROLE_LIST.admin), deleteCategory);
categoriesRouter.get("/:id", verifyRoles(ROLE_LIST.customer, ROLE_LIST.admin), getCategory);