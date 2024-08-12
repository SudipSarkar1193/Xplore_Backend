import express from "express";
import {
	checkMail,
	getCurrentUser,
	googleSignIn,
	login,
	logout,
	signup,
	verifyEmail,
} from "../controllers/auth.controllers.js";

import { authenticateUser } from "../middlewares/authenticateUser.middleware.js";
import { ApiErrorResponseHandler } from "../middlewares/handleAPIErrorResponse.js";

const router = express.Router();

router.post("/signup", signup, ApiErrorResponseHandler);
router.post("/google", authenticateUser, googleSignIn, ApiErrorResponseHandler);
router.post("/login", login, ApiErrorResponseHandler);
router.post("/checkmail", checkMail, ApiErrorResponseHandler);

router.get("/:id/verify/:token", verifyEmail, ApiErrorResponseHandler);

//SECURE routes

router.post("/logout", authenticateUser, logout, ApiErrorResponseHandler);

router.get("/me", authenticateUser, getCurrentUser, ApiErrorResponseHandler);

export default router;
