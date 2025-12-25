import express from "express";
import { addToCart, deleteToCart, getCart, getCartByCustomer, updateToCart, getCartCount, clearCart } from "../controllers/controlCart.js";
import { verifyRoles } from "../middleware/verifyRoles.js";
import { ROLE_LIST } from "../config/role_list.js";
export const cartRouter = express.Router();

cartRouter.get("/", verifyRoles(ROLE_LIST.customer), getCart);
cartRouter.get("/count", verifyRoles(ROLE_LIST.customer), getCartCount);
cartRouter.post("/", verifyRoles(ROLE_LIST.customer), addToCart);
cartRouter.put("/:id", verifyRoles(ROLE_LIST.customer), updateToCart);
cartRouter.delete("/clear", verifyRoles(ROLE_LIST.customer), clearCart);
cartRouter.delete("/:id", verifyRoles(ROLE_LIST.customer), deleteToCart);
cartRouter.get("/:id", verifyRoles(ROLE_LIST.customer), getCartByCustomer);