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
		origin: [process.env.CORS_ORIGIN, "http://localhost:5173"],
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
		credentials: true,
		optionsSuccessStatus: 200,
	})
);

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

app.listen(process.env.PORT, async () => {
	try {
		console.log(`\nServer is running at port : ${process.env.PORT}`);

		await connectDB();
		await User.updateMany({}, { $set: { isOnline: false } });

		// await User.updateMany(
		// 	{ profileImg: { $ne: "" } }, // Condition: profileImg is not an empty string
		// 	{
		// 		$set: {
		// 			profileImg:
		// 				"https://res.cloudinary.com/dvsutdpx2/image/upload/v1724682953/yrf9d7ejdiv3wqmntkic.png",
		// 		},
		// 	} // Update action: set the profileImg to the new URL
		// );
		// await User.updateMany(
		// 	{ coverImg: { $ne: "" } }, // Condition: profileImg is not an empty string
		// 	{
		// 		$set: {
		// 			coverImg:
		// 				"https://res.cloudinary.com/dvsutdpx2/image/upload/v1724683454/sbp5weeswadkfozrsdxo.png",
		// 		},
		// 	} // Update action: set the profileImg to the new URL
		// );
		console.log("Done updateMany");
	} catch (error) {
		console.log(error);
		throw error;
	}
});
