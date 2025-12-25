import express from "express";
 export const resetPasswordRouter = express.Router();
 import { handlePasswordReset, requestPasswordReset, serveResetPasswordForm } from "../controllers/controlForgottenPassword.js";

 resetPasswordRouter.post('/forgot-password', requestPasswordReset);
 resetPasswordRouter.get("/customers", serveResetPasswordForm);
 resetPasswordRouter.post("/customers", handlePasswordReset);