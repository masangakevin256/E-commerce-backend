import express from "express";
import { addNewCustomer } from "../controllers/controlCustomers.js";
import { addNewAdmin } from "../controllers/controlAdmins.js";
export const addCustomerRouter = express.Router();

addCustomerRouter.post("/customers", addNewCustomer);
addCustomerRouter.post("/admins", addNewAdmin);