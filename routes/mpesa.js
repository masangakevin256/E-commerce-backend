import express from "express";
import { stkPush, mpesaCallback } from "../controllers/mpesaController.js";

export const mpesaRouter = express.Router();
export const publicMpesaRouter = express.Router();

// Protected routes (require JWT)
mpesaRouter.post("/stkpush", stkPush);

// Public routes (no JWT)
publicMpesaRouter.post("/callback", mpesaCallback);

