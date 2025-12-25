import express from "express";
import { adminRefreshToken, customerRefreshToken } from "../controllers/controlRefreshToken.js";

export const refreshRouter = express.Router();

refreshRouter.post("/admins", adminRefreshToken);
refreshRouter.post("/customers", customerRefreshToken);