import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { uploadBase64File, generateFileKey } from "@/lib/storage";

// POST /api/email-templates/upload-image - Upload an image for email templates
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

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
    await uploadBase64File(fileKey, base64Data, file.type);

    // Return proxy URL instead of direct S3 URL
    // Extract just the filename from the key (remove email-templates/ prefix)
    const filename = fileKey.replace("email-templates/", "");
    const proxyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://ds.inventright.com"}/api/email-templates/images/${filename}`;

    return NextResponse.json({ url: proxyUrl }, { status: 200 });
  } catch (error: any) {
    console.error("Image upload error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error message:", error.message);
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json(
      { error: "Failed to upload image", details: error.message },
      { status: 500 }
    );
  }
}
