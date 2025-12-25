
import express from "express"
import { cancelOrder, createOrder, getOrderById, getOrdersByCustomer, updateOrderStatus, getOrderCount, getRecentOrders } from "../controllers/controlOrder.js";
import { verifyRoles } from "../middleware/verifyRoles.js";
import { ROLE_LIST } from "../config/role_list.js";
export const orderRouter = express.Router();

orderRouter.get("/", verifyRoles(ROLE_LIST.customer, ROLE_LIST.admin), getOrdersByCustomer);
orderRouter.get("/count", verifyRoles(ROLE_LIST.customer, ROLE_LIST.admin), getOrderCount);
orderRouter.get("/recent", verifyRoles(ROLE_LIST.admin), getRecentOrders);
orderRouter.post("/", verifyRoles(ROLE_LIST.customer), createOrder);
orderRouter.put("/update/:id", verifyRoles(ROLE_LIST.customer, ROLE_LIST.admin), updateOrderStatus);
orderRouter.patch("/cancel/:id", verifyRoles(ROLE_LIST.customer), cancelOrder);
orderRouter.get("/:id", verifyRoles(ROLE_LIST.customer, ROLE_LIST.admin), getOrderById);
