import express from "express";
import {
	followAndUnfollow,
	getProfile,
	getUsers,
	updateUser,
} from "../controllers/user.controllers.js";
import { authenticateUser } from "../middlewares/authenticateUser.middleware.js";

import { ApiErrorResponseHandler } from "../middlewares/handleAPIErrorResponse.js";
const router = express.Router();

router.get(
	"/profile/:username",
	authenticateUser,
	getProfile,
	ApiErrorResponseHandler
);
router.post(
	"/follow/:id",
	authenticateUser,
	followAndUnfollow,
	ApiErrorResponseHandler
);
router.get(
	"/getusers/:type",
	authenticateUser,
	getUsers,
	ApiErrorResponseHandler
);
router.post("/update", authenticateUser, updateUser, ApiErrorResponseHandler);

export default router;
