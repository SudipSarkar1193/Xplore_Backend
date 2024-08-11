import { User } from "../models/user.model.js";
import { APIError } from "../utils/APIError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";


export const authenticateUser = asyncHandler(async (req, res, next) => {
	try {
		req.user = null;

		// Extract access token from cookies or Authorization header
		const accessToken =
			req.cookies?.accessToken ||
			req.header("Authorization")?.replace("Bearer ", "");

		if (!accessToken) {
			return next(new APIError(401, "Unauthorized Request"));
		}

		// Verify the JWT token
		const verifiedToken = jwt.verify(
			accessToken,
			process.env.ACCESS_TOKEN_SECRET
		);

		// Find the user associated with the token
		const user = await User.findById(verifiedToken._id).select(
			"_id username email profileImg fullName"
		);

		if (!user) {
			return next(new APIError(404, "User not found."));
		}

		// Attach the user to the request object
		req.user = user;

		next();
	} catch (error) {
		console.error("Authentication error:", error);
		next(new APIError(500, error.message));
	}
});