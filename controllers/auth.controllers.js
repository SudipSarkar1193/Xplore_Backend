import { User } from "../models/user.model.js";
import { APIError } from "../utils/APIError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { APIResponse } from "../utils/APIResponse.js";
import { sendMail } from "../utils/sendMail.js";
import { VerificationToken } from "../models/verificationToken.model.js";
import crypto from "crypto";

export const generateAccessAndRefreshToken = async (uid) => {
	const user = await User.findById(uid);
	const accessToken = await user.generateAccessToken();
	const refreshToken = await user.generateRefreshToken();
	user.refreshToken = refreshToken;
	await user.save();
	return { accessToken, refreshToken };
};

export const signup = asyncHandler(async (req, res) => {
	const { fullName, email, password } = req.body;
	let { username } = req.body;

	username = username?.toLowerCase();
	username = username?.trim();
	username = username?.replace(" ", "");
	username = username.replace(/[@#\/>\`$%^&*()+|]/g, "_");

	if (
		[fullName, username, email, password].some(
			(fld) => fld == null || fld.trim() === ""
		)
	) {
		throw new APIError(400, "All fields are required..");
	}

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	if (!emailRegex.test(email)) {
		throw new APIError(400, "Invalid Email format");
	}

	if (password.length < 6) {
		throw new APIError(400, "Password lenth must be six or greater");
	}

	const existedUser = await User.findOne({
		$or: [{ username }, { email }],
	});

	if (existedUser) {
		throw new APIError(409, "User with email / username already exists");
	}

	const newUser = await User.create({
		fullName,
		username,
		email,
		password,
		profileImg: null,
		coverImg: null,
	});

	const token = await VerificationToken?.create({
		userId: newUser._id,
		token: crypto.randomBytes(32).toString("hex"),
	});

	const url = `${process.env.FRONTEND_URL}/users/${newUser._id}/verify/${token?.token}`;

	await sendMail(
		newUser.email,
		"Email Verification for Xplore",
		`Please click on this link to get verfied :\n${url}`
	);

	const resUser = await User.findById(newUser._id).select(
		"-password -refreshToken"
	);

	return res
		.status(200)
		.json(
			new APIResponse(
				200,
				{ user: resUser },
				`Verification link sent to your email : \n${newUser.email}`
			)
		);
});

export const verifyEmail = asyncHandler(async (req, res) => {
	const { id: userId, token } = req.params;

	const user = await User.findById(userId.toString());

	if (!user) {
		throw new APIError(404, "Invalid link");
	}

	const verifiedToken = await VerificationToken.findOne({ userId, token });

	if (!verifiedToken) {
		throw new APIError(404, "Invalid link");
	}
	let isVerified = verifiedToken.token == token;

	let updatedUser = null;
	if (isVerified) {
		updatedUser = await User.findByIdAndUpdate(
			userId,
			{
				verified: true,
			},
			{
				new: true,
			}
		);
	}

	await VerificationToken.deleteOne({ _id: verifiedToken._id });

	return res
		.status(200)
		.json(
			new APIResponse(
				200,
				{ verifiedEmail: updatedUser?.email || null },
				"Verified Successfully"
			)
		);
});

export const login = asyncHandler(async (req, res) => {
	const { username, email, password } = req.body;

	const user = await User.findOne({
		$or: [{ username }, { email }],
	});
	if (!user) {
		throw new APIError(400, "User not found");
	}
	const isPasswordCorrect = await user.isPasswordCorrect(password);

	if (!isPasswordCorrect || !user) {
		throw new APIError(400, "Invalid credential");
	}

	if (!user.verified) {
		try {
			let token = await VerificationToken.findOne({ userId: user._id });

			if (!token) {
				token = await VerificationToken.create({
					userId: user._id,
					token: crypto.randomBytes(32).toString("hex"),
				});

				const url = `${process.env.FRONTEND_URL}/users/${user._id}/verify/${token.token}`;

				await sendMail(
					newUser.email,
					"Email Verification",
					`Please click on this link to get verfied :\n${url}`
				);
			}
			return res
				.status(200)
				.json(
					new APIResponse(
						200,
						{},
						`Verification link sent to your email : \n${user.email}`
					)
				);
		} catch (error) {
			console.log(error);
		}
	}

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
});

export const logout = asyncHandler(async (req, res) => {
	//Get the user
	const user = req.user;
	//Check if authorized
	if (!user) {
		throw new APIError(401, "User is not authorized");
	}
	//Find the user from the DB and set the accessToken to be a null value and isOnline to be false
	const loggedOutUser = await User.findByIdAndUpdate(
		user._id,
		{
			$set: {
				refreshToken: "",
				isOnline: false,
			},
		},
		{
			new: true,
		}
	);

	// Clear the response cookies
	const cookieOption = {
		maxAge: 15 * 24 * 60 * 60 * 1000, //MS
		httpOnly: true,
		sameSite: "None",
		secure: true,
	};

	res
		.header("Access-Control-Allow-Credentials", true)
		.status(200)
		.clearCookie("accessToken", cookieOption)
		.clearCookie("refreshToken", cookieOption)
		.json(
			new APIResponse(
				200,
				loggedOutUser,
				`${user.fullName} logged out successfully`
			)
		);
});

export const googleSignIn = asyncHandler(async (req, res) => {
	let user;

	if (req.gUser) {
		user = req.gUser;
	} else {
		const { name, email, profileImg, firebaseId } = req.body;

		user = await User.findOne({ email });
		if (user) {
			throw new APIError(409, "User with this email already exists");
		}
		let username = name?.trim();
		username = username?.toLowerCase();
		username = username?.replace(" ", "");

		let isUnique = false;

		do {
			const randInt = Math.floor(Math.random() * 900) + 10;
			const potentialUsername = username + randInt;
			if (!(await User.findOne({ username: potentialUsername }))) {
				username = potentialUsername;
				isUnique = true;
			}
		} while (!isUnique);

		user = await User.create({
			fullName: name,
			username,
			email,
			profileImg,
			firebaseId,
		});
	}
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
		.json(new APIResponse(200, {}, `Welcome 😄`));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
	if (!req.user) {
		throw new APIError(404, "No authenticated user found");
	}

	const user = await User.findById(req.user._id).select(
		"-password -refreshToken"
	);

	if (!user) {
		throw new APIError(404, "No authenticated user found");
	}
	return res.status(200).json(user);
});
