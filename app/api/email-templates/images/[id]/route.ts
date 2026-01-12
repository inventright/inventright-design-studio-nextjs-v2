import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailTemplateImages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/email-templates/images/[id] - Serve an email template image
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const imageId = parseInt(id);

    if (isNaN(imageId)) {
      return NextResponse.json(
        { error: "Invalid image ID" },
        { status: 400 }
      );
    }

    // Get image from database
    const [image] = await db
      .select()
      .from(emailTemplateImages)
      .where(eq(emailTemplateImages.id, imageId));

    if (!image) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      );
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(image.base64Data, "base64");

    // Return the image with appropriate headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": image.contentType,
        "Cache-Control": "public, max-age=31536000, immutable", // Cache for 1 year
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("Error serving image:", error);
    return NextResponse.json(
      { error: "Failed to serve image" },
      { status: 500 }
    );
  }
}
