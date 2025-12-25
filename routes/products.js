import express from "express";
import { addNewProduct, deleteProduct, getAllProducts, getProduct, updateProduct } from "../controllers/controlProducts.js";
import { verifyRoles } from "../middleware/verifyRoles.js";
import { ROLE_LIST } from "../config/role_list.js";
import { upload } from "../uploads/uploads.js"
export const productRouter = express.Router();

productRouter.get("/", verifyRoles(ROLE_LIST.admin, ROLE_LIST.customer), getAllProducts);
productRouter.post("/", upload.single("image"), verifyRoles(ROLE_LIST.admin), addNewProduct);
productRouter.put("/:id", upload.single("image"), verifyRoles(ROLE_LIST.admin), updateProduct);
productRouter.delete("/:id", verifyRoles(ROLE_LIST.admin), deleteProduct);
productRouter.get("/:id", verifyRoles(ROLE_LIST.admin, ROLE_LIST.customer), getProduct);