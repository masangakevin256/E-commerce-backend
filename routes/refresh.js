import express from "express";
import { handleRefreshToken } from "../controllers/controlRefreshToken.js"; // EDITED: Import unified handler

export const refreshRouter = express.Router();

// EDITED: Unified route for all users
refreshRouter.get("/", handleRefreshToken);
// Kept for backward compatibility if needed, but pointing to same handler
refreshRouter.get("/admins", handleRefreshToken);
refreshRouter.get("/customers", handleRefreshToken);