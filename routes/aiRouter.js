import express from "express"
import { askAI } from "../controllers/aiController.js";
import { testAIConfig } from "../controllers/aiDiagnosticController.js";

export const aiRouter = express.Router();

aiRouter.post("/chat", askAI);
aiRouter.get("/test-config", testAIConfig);
