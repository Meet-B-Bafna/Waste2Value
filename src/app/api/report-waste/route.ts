import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

import { connect } from "@/database/db";
import { getDataFromJwt } from "@/helpers/jwtData";
import WasteReport from "@/models/wasteReport.model";
import Municipality from "@/models/municipality.model";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
    let savedFilePath: string | null = null;

    try {
        // 1. Authenticate the user.
        let rawUserId: string;

        try {
            rawUserId = String(getDataFromJwt(request));
        } catch {
            return NextResponse.json(
                {
                    success: false,
                    error: "Authentication required. Please log in again.",
                },
                { status: 401 }
            );
        }

        // The waste-report model uses MongoDB ObjectId for userId.
        if (!mongoose.Types.ObjectId.isValid(rawUserId)) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "The user ID in your session is invalid. Please log in again.",
                },
                { status: 401 }
            );
        }

        // 2. Read and validate the request body.
        const body = await request.json();

        const { photo, latitude, longitude } = body;

        if (
            typeof latitude !== "number" ||
            typeof longitude !== "number" ||
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Valid GPS coordinates are required.",
                },
                { status: 400 }
            );
        }

        if (typeof photo !== "string") {
            return NextResponse.json(
                {
                    success: false,
                    error: "Please capture a waste photo first.",
                },
                { status: 400 }
            );
        }

        // Accept only base64 JPEG, PNG, and WEBP images.
        const imageMatch = photo.match(
            /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\r\n]+)$/i
        );

        if (!imageMatch) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid photo. Please capture the image again.",
                },
                { status: 400 }
            );
        }

        const mimeType = imageMatch[1].toLowerCase();
        const imageBuffer = Buffer.from(imageMatch[2], "base64");

        if (
            imageBuffer.length === 0 ||
            imageBuffer.length > MAX_IMAGE_SIZE
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: "The photo must be smaller than 10 MB.",
                },
                { status: 413 }
            );
        }

        // 3. Find the active municipality whose GeoJSON boundary contains this GPS point.
        await connect();

        const municipality = await Municipality.findOne({
            isActive: true,
            boundary: {
                $geoIntersects: {
                    $geometry: {
                        type: "Point",
                        // GeoJSON coordinates must be [longitude, latitude].
                        coordinates: [longitude, latitude],
                    },
                },
            },
        }).lean();

        if (!municipality) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "No active municipality boundary matches your current location. This area may not have been added yet.",
                },
                { status: 422 }
            );
        }

        const locality = municipality.name;
        const municipalOffice = {
            name: municipality.officeName,
            email: municipality.email,
        };

        // 4. Save the image to public/uploads/waste-reports.
        const extensionByMimeType: Record<string, string> = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
        };

        const filename = `${randomUUID()}${extensionByMimeType[mimeType]}`;

        const uploadDirectory = path.join(
            process.cwd(),
            "public",
            "uploads",
            "waste-reports"
        );

        await mkdir(uploadDirectory, { recursive: true });

        savedFilePath = path.join(uploadDirectory, filename);

        await writeFile(savedFilePath, imageBuffer);

        const imagePath = `/uploads/waste-reports/${filename}`;

        // 5. Save the report before attempting email delivery.
        // This ensures a temporary SMTP failure doesn't discard the report.
        const report = await WasteReport.create({
            userId: new mongoose.Types.ObjectId(rawUserId),
            imagePath,
            latitude,
            longitude,
            locality,
            municipalOfficeEmail: municipalOffice.email,
            status: "submitted",
        });

        // 6. Notify the matched municipality if SMTP is configured.
        // These variables must be server-only environment variables.
        const smtpHost = process.env.MAIL_HOST;
        const smtpPort = Number(process.env.MAIL_PORT || 465);
        const smtpUser = process.env.MAIL_USER;
        const smtpPassword = process.env.MAIL_PASSWORD;
        const fromEmail = process.env.MAIL_FROM || smtpUser;

        let emailSent = false;
        let emailFailureReason = "";

        if (
            smtpHost &&
            Number.isFinite(smtpPort) &&
            smtpPort > 0 &&
            smtpUser &&
            smtpPassword &&
            fromEmail
        ) {
            try {
                const transporter = nodemailer.createTransport({
                    host: smtpHost,
                    port: smtpPort,
                    secure: smtpPort === 465,
                    auth: {
                        user: smtpUser,
                        pass: smtpPassword,
                    },
                });

                await transporter.sendMail({
                    from: fromEmail,
                    to: municipalOffice.email,
                    subject: `Community Waste Report — ${locality}`,
                    text: [
                        `A new community waste report has been submitted for ${locality}.`,
                        "",
                        `Municipal office: ${municipalOffice.name}`,
                        `Report ID: ${report._id.toString()}`,
                        `Latitude: ${latitude}`,
                        `Longitude: ${longitude}`,
                        `Location: https://www.google.com/maps?q=${latitude},${longitude}`,
                        "",
                        "The captured waste photograph is attached.",
                    ].join("\n"),
                    attachments: [
                        {
                            filename,
                            content: imageBuffer,
                            contentType: mimeType,
                        },
                    ],
                });

                emailSent = true;
                report.status = "email_sent";
            } catch (emailError) {
                console.error(
                    "Municipal report email failed:",
                    emailError
                );

                emailFailureReason =
                    "The report was saved, but the municipal email could not be sent.";

                report.status = "failed";
            }
        } else {
            // Keep the report even if email configuration is incomplete.
            emailFailureReason =
                "The report was saved, but email delivery is not configured. Configure the MAIL_* environment variables.";
            report.status = "failed";
        }

        await report.save();

        // 7. Return JSON in both email-success and email-failure cases.
        return NextResponse.json(
            {
                success: true,
                reportId: report._id.toString(),
                locality,
                municipalOffice: municipalOffice.name,
                emailSent,
                message: emailSent
                    ? `Your report was saved and emailed to ${municipalOffice.name}.`
                    : emailFailureReason,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Community waste report error:", error);

        // If saving the report failed after the photo was written,
        // remove the unreferenced file.
        if (savedFilePath) {
            try {
                await unlink(savedFilePath);
            } catch (cleanupError) {
                console.error(
                    "Could not remove the unused report image:",
                    cleanupError
                );
            }
        }

        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unable to submit the community waste report.",
            },
            { status: 500 }
        );
    }
}