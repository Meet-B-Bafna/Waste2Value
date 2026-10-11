import mongoose from "mongoose";

const wasteReportSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: true,
        },
        imagePath: {
            type: String,
            required: true,
        },
        latitude: {
            type: Number,
            required: true,
        },
        longitude: {
            type: Number,
            required: true,
        },
        locality: {
            type: String,
            required: true,
        },
        municipalOfficeEmail: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["submitted", "email_sent", "failed"],
            default: "submitted",
        },
    },
    { timestamps: true }
);

const WasteReport =
    mongoose.models.WasteReport ||
    mongoose.model("WasteReport", wasteReportSchema);

export default WasteReport;