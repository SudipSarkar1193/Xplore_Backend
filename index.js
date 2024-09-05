import express from "express";
import dotenv from "dotenv";
import authRoute from "./routes/auth.routes.js";
import userRoute from "./routes/user.routes.js";
import postRoute from "./routes/post.routes.js";
import notificationRoute from "./routes/notification.routes.js";
import { connectDB } from "./db/connect.db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { APIError } from "./utils/APIError.js";
import { APIResponse } from "./utils/APIResponse.js";
import path from "path";
import { User } from "./models/user.model.js";

dotenv.config({
	path: "./.env",
});
const app = express();

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static("public"));
app.use((req, res, next) => {
	res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
	next();
});

app.use(
	cors({
		origin: [
			process.env.CORS_ORIGIN,
			"https://66cd82c6215411a7d5de09eb--xplore-com.netlify.app",
			"https://xplore-com.netlify.app",
			"https://xplore-frontend-brown.vercel.app",
		],
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
		credentials: true,
		optionsSuccessStatus: 200,
	})
);

app.use((req, res, next) => {
	console.log(`${req.method} request to ${req.url}`);
	next();
});

// Respond to preflight requests
app.options("*", cors());

app.get("/", (req, res) => {
	res.json({
		message: "Xplore",
	});
});

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/users", userRoute); //  /getusers/:type
app.use("/api/v1/posts", postRoute);
app.use("/api/v1/notifications", notificationRoute);

const cookieOption = {
	maxAge: 15 * 24 * 60 * 60 * 1000, //MS
	httpOnly: true,
	sameSite: "None",
	secure: true,
};

// app.on("error", (err) => {
// 	console.log("ERROR:", err);
// 	throw err;
// });
const port = process.env.PORT || 8000;
app.listen(port, async () => {
	try {
		console.log(`\nServer is running at port : ${port}`);

		await connectDB();
		await User.updateMany({}, { $set: { isOnline: false } });

		console.log("Done updateMany");
	} catch (error) {
		console.log(error);
		throw error;
	}
});
