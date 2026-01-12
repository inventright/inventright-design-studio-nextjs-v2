import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { uploadBase64File, generateFileKey } from "@/lib/storage";

// POST /api/email-templates/upload-image - Upload an image for email templates
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const userRole = (user as any).data?.role || "client";
    if (userRole !== "admin" && userRole !== "manager") {
      return NextResponse.json(
        { error: "Only admins can upload email template images" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString("base64");

    // Generate unique file key
    const fileKey = generateFileKey("email-templates", file.name);

    // Upload to Wasabi S3
    const { url } = await uploadBase64File(fileKey, base64Data, file.type);

    return NextResponse.json({ url }, { status: 200 });
  } catch (error: any) {
    console.error("Image upload error:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
