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

dotenv.config({
	path: "./.env",
});
const app = express();

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static("public"));

app.use(
	cors({
		origin: process.env.CORS_ORIGIN,
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
		credentials: true,
		optionsSuccessStatus: 200,
	})
);

// Respond to preflight requests
app.options("*", cors());

// app.get("/", (req, res) => {
// 	res.json({
// 		message: "Xplore",
// 	});
// });

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/posts", postRoute);
app.use("/api/v1/notifications", notificationRoute);

// app.on("error", (err) => {
// 	console.log("ERROR:", err);
// 	throw err;
// });

app.listen(process.env.PORT, async () => {
	try {
		console.log(`\nServer is running at port : ${process.env.PORT}`);
		await connectDB();
	} catch (error) {
		console.log(error);
		throw error;
	}
});
