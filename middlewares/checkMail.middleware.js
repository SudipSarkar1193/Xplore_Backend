import { generateAccessAndRefreshToken } from "../controllers/auth.controllers.js";
import { User } from "../models/user.model.js";
import { APIError } from "../utils/APIError.js";
import { APIResponse } from "../utils/APIResponse.js";

export const checkMail = async (req, res, next) => {
	req.gUser = null;
	try {
		const { email } = req.body; // Access email from the request body

		if (!email) {
			return res
				.status(400)
				.json(new APIResponse(400, false, "Email is required"));
		}

		console.log(email);

		const user = await User.findOne({ email });

		if (user) {
			req.gUser = user;
			console.log(req.gUser);
			return next();
		}

		next();
	} catch (error) {
		console.log(error);
		next(error);
	}
};
