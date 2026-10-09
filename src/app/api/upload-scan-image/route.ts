import { NextRequest, NextResponse } from "next/server";
import { getDataFromJwt } from "@/helpers/jwtData";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const userId = getDataFromJwt(request);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get uploaded image
    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No image uploaded" },
        { status: 400 }
      );
    }

    // Validate image type
    const allowedTypes: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
    };

    const extension = allowedTypes[file.type];

    if (!extension) {
      return NextResponse.json(
        {
          success: false,
          error: "Only JPG, PNG, and WEBP images are allowed",
        },
        { status: 400 }
      );
    }

    // Limit image size to 10 MB
    if (file.size === 0 || file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Image must be smaller than 10 MB" },
        { status: 400 }
      );
    }

    // Create upload directory
    const uploadDirectory = path.join(
      process.cwd(),
      "public",
      "uploads",
      "scans"
    );

    await mkdir(uploadDirectory, { recursive: true });

    // Generate a unique filename
    const filename = `${randomUUID()}${extension}`;
    const filePath = path.join(uploadDirectory, filename);

    // Save image
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Return publicly accessible image path
    const imagePath = `/uploads/scans/${filename}`;

    return NextResponse.json(
      {
        success: true,
        message: "Image uploaded successfully",
        imagePath,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload scan image error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to upload scan image" },
      { status: 500 }
    );
  }
}