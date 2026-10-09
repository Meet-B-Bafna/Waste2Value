import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/database/db";
import { getDataFromJwt } from "@/helpers/jwtData";
import User from "@/models/users.model";

export async function POST(request: NextRequest) {
    try {
        await connect();

        const reqBody = await request.json();

        const {
            wastepoints,
            wasteNameByAi,
            wasteType,
            isRecyleable,
            latitude,
            longitude,
            service,
            discount,
            CouponCode,
            imagePath,
            confidence,
            detections,
        } = reqBody;

        const userId = getDataFromJwt(request);

        if (!userId) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        if (
            typeof wasteNameByAi !== "string" ||
            !wasteNameByAi.trim() ||
            typeof wasteType !== "string" ||
            !wasteType.trim() ||
            typeof wastepoints !== "number" ||
            !Number.isFinite(wastepoints) ||
            typeof isRecyleable !== "boolean"
        ) {
            return NextResponse.json(
                { error: "Invalid waste details" },
                { status: 400 }
            );
        }

        if (
            (latitude != null &&
                (typeof latitude !== "number" ||
                    !Number.isFinite(latitude))) ||
            (longitude != null &&
                (typeof longitude !== "number" ||
                    !Number.isFinite(longitude)))
        ) {
            return NextResponse.json(
                { error: "Invalid location coordinates" },
                { status: 400 }
            );
        }

        // Validate the configured reward points.
        const expectedPoints = isRecyleable ? 12 : 5;

        if (wastepoints !== expectedPoints) {
            return NextResponse.json(
                { error: "Invalid reward points" },
                { status: 400 }
            );
        }

        if (
            imagePath !== undefined &&
            (typeof imagePath !== "string" ||
                !imagePath.startsWith("/uploads/"))
        ) {
            return NextResponse.json(
                { error: "Invalid image path" },
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

        // Record the disposal and its AI scan details.
        user.wasteDumped.push({
            wasteNameByAi: wasteNameByAi.trim(),
            wasteType: wasteType.trim(),
            wastePoints: expectedPoints,
            isRecyleable,
            imagePath: imagePath || "",
            scanStatus: "disposed",
            confidence:
                typeof confidence === "number" &&
                Number.isFinite(confidence)
                    ? confidence
                    : 0,
            detections: Array.isArray(detections) ? detections : [],
            ...(latitude != null ? { latitude } : {}),
            ...(longitude != null ? { longitude } : {}),
        });

        user.totalPointsEarned =
            (user.totalPointsEarned || 0) + expectedPoints;

        // Add a coupon only if all coupon details are supplied.
        if (
            typeof service === "string" &&
            service.trim() &&
            typeof discount === "string" &&
            discount.trim() &&
            typeof CouponCode === "string" &&
            CouponCode.trim()
        ) {
            user.coupons.push({
                service: service.trim(),
                discount: discount.trim(),
                code: CouponCode.trim(),
            });
        }

        await user.save();

        return NextResponse.json({
            message: "Waste disposal recorded successfully",
            success: true,
            pointsCredited: expectedPoints,
            totalPointsEarned: user.totalPointsEarned,
        });
    } catch (error) {
        console.error("Add points error:", error);

        return NextResponse.json(
            { error: "Unable to record waste disposal" },
            { status: 500 }
        );
    }
}