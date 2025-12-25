import express from "express";
import {adminsLogin, customerLogin } from "../controllers/controlLogin.js";

export const loginRouter = express.Router();

loginRouter.post("/admins", adminsLogin);
loginRouter.post("/customers", customerLogin);