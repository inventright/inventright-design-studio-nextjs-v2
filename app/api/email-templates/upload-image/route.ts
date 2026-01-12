import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { emailTemplateImages } from "@/lib/db/schema";

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

    // Store in database
    const [image] = await db
      .insert(emailTemplateImages)
      .values({
        filename: file.name,
        contentType: file.type,
        base64Data,
        size: buffer.length,
      })
      .returning();

    // Return URL to access the image
    const imageUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://ds.inventright.com"}/api/email-templates/images/${image.id}`;

    return NextResponse.json({ url: imageUrl }, { status: 200 });
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
