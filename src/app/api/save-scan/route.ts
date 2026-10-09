import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/database/db";
import { getDataFromJwt } from "@/helpers/jwtData";
import User from "@/models/users.model";

export async function POST(request: NextRequest) {
    try {
        await connect();

        const userId = getDataFromJwt(request);

        if (!userId) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const body = await request.json();

        const {
            imagePath,
            wasteNameByAi,
            wasteType,
            confidence,
            detections,
            latitude,
            longitude,
        } = body;

        if (
            typeof wasteNameByAi !== "string" ||
            !wasteNameByAi.trim() ||
            typeof imagePath !== "string" ||
            !imagePath.trim()
        ) {
            return NextResponse.json(
                { error: "Image path and detected waste name are required" },
                { status: 400 }
            );
        }

        const user = await User.findById(userId);

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        user.wasteDumped.push({
            imagePath,
            wasteNameByAi: wasteNameByAi.trim(),
            wasteType: typeof wasteType === "string" ? wasteType : "",
            wastePoints: 0,
            isRecyleable: false,
            scanStatus: "scanned",
            confidence:
                typeof confidence === "number" ? confidence : 0,
            detections: Array.isArray(detections) ? detections : [],
            ...(typeof latitude === "number" ? { latitude } : {}),
            ...(typeof longitude === "number" ? { longitude } : {}),
        });

        await user.save();

        return NextResponse.json(
            {
                success: true,
                message: "Scan saved to history",
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Save scan error:", error);

        return NextResponse.json(
            { error: "Unable to save scan" },
            { status: 500 }
        );
    }
}