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
			const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
				user._id
			);

			const cookieOption = {
				maxAge: 15 * 24 * 60 * 60 * 1000, //MS
				httpOnly: true,
				sameSite: "None",
				secure: true,
			};

			return res
				.header("Access-Control-Allow-Credentials", true)
				.cookie("accessToken", accessToken, cookieOption)
				.cookie("refreshToken", refreshToken, cookieOption)
				.json(new APIResponse(200, {}, "User successfully logged in"));
		}

		next();
	} catch (error) {
		console.log(error);
		next(error);
	}
};
