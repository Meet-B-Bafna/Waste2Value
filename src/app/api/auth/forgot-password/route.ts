import { NextRequest, NextResponse } from "next/server";

import { connect } from "@/database/db";
import { HTTP_STATUS } from "@/enums/enums";
import { isEmailConfigured, sendEmail } from "@/helpers/Email";
import User from "@/models/users.model";
import { Error } from "@/types/ErrorTypes";


export async function POST(request: NextRequest) {
    try {
        await connect();
        const reqbody = await request.json();
        const { email } = reqbody;

        const user = await User.findOne({ email: email });
        if (!user) return NextResponse.json({ error: "No user found" }, { status: HTTP_STATUS.BAD_REQUEST });

        if (!isEmailConfigured()) {
            return NextResponse.json({ error: "Email is not configured on this server, so reset emails can't be sent." }, { status: HTTP_STATUS.SERVICE_UNAVAILABLE });
        }
        try {
            await sendEmail({
                email,
                emailType: "RESET_PASSWORD_USER",
                userId: user._id,
            });
        } catch {
            return NextResponse.json({ error: "Could not send the reset email. Please try again later." }, { status: HTTP_STATUS.BAD_GATEWAY });
        }
        return NextResponse.json({ message: "Reset Password Email Sent.", success: true });
    } catch (error: unknown) {
        const Error = error as Error;
        return NextResponse.json({ error: Error.message }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
    }
}
