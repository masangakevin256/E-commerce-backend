import express from "express";
import { getWishlist, addToWishlist, removeFromWishlist, checkWishlistStatus, getWishlistCount } from "../controllers/controlWishlist.js";
import { verifyRoles } from "../middleware/verifyRoles.js";
import { ROLE_LIST } from "../config/role_list.js";

export const wishlistRouter = express.Router();

wishlistRouter.get("/", verifyRoles(ROLE_LIST.customer), getWishlist);
wishlistRouter.get("/status", verifyRoles(ROLE_LIST.customer), checkWishlistStatus);
wishlistRouter.get("/count", verifyRoles(ROLE_LIST.customer), getWishlistCount);
wishlistRouter.post("/", verifyRoles(ROLE_LIST.customer), addToWishlist);
wishlistRouter.delete("/:product_id", verifyRoles(ROLE_LIST.customer), removeFromWishlist);
