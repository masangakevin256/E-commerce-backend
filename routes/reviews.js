import express from "express";
import { getProductReviews, addReview, getAllReviews, deleteReview } from "../controllers/controlReviews.js";
import { verifyRoles } from "../middleware/verifyRoles.js";
import { ROLE_LIST } from "../config/role_list.js";

const router = express.Router();

router.get("/:productId", getProductReviews);
router.post("/", verifyRoles(ROLE_LIST.customer), addReview);

router.get("/admin/all", verifyRoles(ROLE_LIST.admin), getAllReviews);
router.delete("/admin/:id", verifyRoles(ROLE_LIST.admin,), deleteReview);

export default router;
