import bcryptjs from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { connect } from "@/database/db";
import { HTTP_STATUS } from "@/enums/enums";
import { isEmailConfigured, sendEmail } from "@/helpers/Email";
import User from "@/models/users.model";
import { Error } from "@/types/ErrorTypes";

export async function POST(request: NextRequest) {
    try {
        await connect();

        const reqBody = await request.json();
        const username = String(reqBody.username ?? "").trim();
        const email = String(reqBody.email ?? "").trim().toLowerCase();
        const password = String(reqBody.password ?? "");
        const city = String(reqBody.city ?? "").trim();
        const state = String(reqBody.state ?? "").trim();

        // ---- validation ----
        if (!username) return NextResponse.json({ error: "Please provide a username", success: false }, { status: HTTP_STATUS.BAD_REQUEST });
        if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Please provide a valid email", success: false }, { status: HTTP_STATUS.BAD_REQUEST });
        if (password.length < 8) return NextResponse.json({ error: "Password should have at least 8 characters", success: false }, { status: HTTP_STATUS.BAD_REQUEST });
        if (!state || state === "Select State") return NextResponse.json({ error: "Please provide a valid state", success: false }, { status: HTTP_STATUS.BAD_REQUEST });
        if (!city || city === "select city") return NextResponse.json({ error: "Please provide a valid city", success: false }, { status: HTTP_STATUS.BAD_REQUEST });

        // ---- database reachable? ----
        const mongoose = (await import("mongoose")).default;
        if (mongoose.connection.readyState !== 1) {
            return NextResponse.json({ error: "Database is not reachable. Please start MongoDB (or set NEXT_PUBLIC_MONGODB_URI in .env.local).", success: false }, { status: HTTP_STATUS.SERVICE_UNAVAILABLE });
        }

        // ---- duplicates ----
        const existing = await User.findOne({ $or: [{ email }, { username }] });
        if (existing) {
            const field = existing.email === email ? "email" : "username";
            return NextResponse.json({ error: `A user with this ${field} already exists`, success: false }, { status: HTTP_STATUS.BAD_REQUEST });
        }

        const hashedPassword = await bcryptjs.hash(password, await bcryptjs.genSalt(10));
        const emailEnabled = isEmailConfigured();

        const savedUser = await new User({
            username,
            email,
            state,
            city,
            password: hashedPassword,
            // Demo mode: no SMTP credentials configured -> skip email verification so the account is usable immediately
            isVerified: !emailEnabled,
        }).save();

        if (!emailEnabled) {
            return NextResponse.json({ message: "Account created. You can log in now.", success: true, verified: true }, { status: HTTP_STATUS.CREATED });
        }

        try {
            await sendEmail({ email, emailType: "VERIFY_USER", userId: savedUser._id });
        } catch {
            // Email failed: remove the half-created user so they can simply try again
            await User.findByIdAndDelete(savedUser._id);
            return NextResponse.json({ error: "Could not send the verification email. Check NEXT_PUBLIC_EMAIL / NEXT_PUBLIC_EMAIL_PASSWORD (use a Gmail app password) and try again.", success: false }, { status: HTTP_STATUS.BAD_GATEWAY });
        }

        return NextResponse.json({ message: "Email sent. Please verify your registration.", success: true, verified: false }, { status: HTTP_STATUS.CREATED });
    } catch (error: unknown) {
        const Error = error as Error;
        return NextResponse.json({ error: Error.message || "Something went wrong", success: false }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
    }
}
