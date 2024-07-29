import { User } from "../models/user.model.js";
import { APIError } from "../utils/APIError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { APIResponse } from "../utils/APIResponse.js";
import crypto from "crypto";

const generateAccessAndRefreshToken = async (uid) => {
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

	if (
		[fullName, username, email, password].some(
			(fld) => fld == null || fld.trim() === ""
		)
	) {
		throw new APIError(400, "All fields are required");
	}

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	const regex = /^[a-zA-Z0-9_]+$/;
	const trimmedUsername = username.trim();
	if (!regex.test(trimmedUsername)) {
		throw new APIError(
			400,
			" Only letters, numbers, and underscores are allowed"
		);
	}

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

	return res
		.status(200)
		.json(new APIResponse(200, {username:newUser?.username}, `Successfully Signed in`));
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

	const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
		user._id
	);

	const userResponse = user.toObject(); // Convert Mongoose document to plain JavaScript object
	delete userResponse.password;
	delete userResponse.refreshToken;

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
		.json(
			new APIResponse(
				200,
				{ user: userResponse, accessToken, refreshToken },
				"User successfully logged in"
			)
		);
});

export const logout = asyncHandler(async (req, res) => {
	//Get the user
	const user = req.user;
	//Check if authorized
	if (!user) {
		throw new APIError(401, "User is not authorized");
	}
	//Find the user from the DB and set the accessToken to be a null value
	const loggedOutUser = await User.findByIdAndUpdate(
		user._id,
		{
			$set: {
				refreshToken: "",
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

export const getCurrentUser = asyncHandler(async (req, res) => {
	const user = await User.findById(req.user._id).select(
		"-password -refreshToken"
	);

	if (!user) {
		throw new APIError("No authenticated user found");
	}
	return res.status(200).json(user);
});
