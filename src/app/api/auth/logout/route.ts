import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
try {
const token = request.cookies.get("token");


    if (!token) {
        const response = NextResponse.json(
            {
                message: "Already logged out",
                success: true,
            },
            { status: 200 }
        );

        response.cookies.set("token", "", {
            httpOnly: true,
            expires: new Date(0),
            path: "/",
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
        });

        return response;
    }

    const response = NextResponse.json(
        {
            message: "Logout successful",
            success: true,
        },
        { status: 200 }
    );

    response.cookies.set("token", "", {
        httpOnly: true,
        expires: new Date(0),
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
    });

    return response;
} catch (error: unknown) {
    console.error("Logout error:", error);

    return NextResponse.json(
        {
            error: "Logout failed. Please try again later.",
            success: false,
        },
        { status: 500 }
    );
}

}
