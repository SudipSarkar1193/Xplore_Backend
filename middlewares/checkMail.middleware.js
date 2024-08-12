import { User } from "../models/user.model.js";
import { APIError } from "../utils/APIError.js";

export const checkMail = async (req, res, next) => {
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
			return next(new APIError(401, "User with this mail already exists..."));
		}

		next();
	} catch (error) {
		console.log(error);
		next(error);
	}
};
