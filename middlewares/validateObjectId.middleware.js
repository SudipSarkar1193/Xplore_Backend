import mongoose from "mongoose";
const { ObjectId } = mongoose.Types;

// Middleware to validate ObjectId
export function validateObjectId(req, res, next) {
	const id = req.params.id;

	if (!id || !ObjectId.isValid(id)) {
		return res.status(400).send({ error: "Invalid or missing ObjectId" });
	}

	next();
}
