import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailMediaLibrary } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.WASABI_REGION || "us-east-1",
  endpoint: process.env.WASABI_ENDPOINT || "https://s3.wasabisys.com",
  credentials: {
    accessKeyId: process.env.WASABI_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.WASABI_BUCKET || "";

// GET /api/email-media/[id] - Serve a media library image from S3
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const mediaId = parseInt(id);

    if (isNaN(mediaId)) {
      return NextResponse.json(
        { error: "Invalid media ID" },
        { status: 400 }
      );
    }

    // Get media item from database
    const [mediaItem] = await db
      .select()
      .from(emailMediaLibrary)
      .where(eq(emailMediaLibrary.id, mediaId));

    if (!mediaItem) {
      return NextResponse.json(
        { error: "Media not found" },
        { status: 404 }
      );
    }

    if (!mediaItem.base64Data) {
      return NextResponse.json(
        { error: "Image data not found" },
        { status: 404 }
      );
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(mediaItem.base64Data, "base64");

    // Return the image with appropriate headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": mediaItem.mimeType || "image/png",
        "Cache-Control": "public, max-age=31536000, immutable", // Cache for 1 year
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("[Email Media API] Error serving image:", error);
    return NextResponse.json(
      { error: "Failed to serve image" },
      { status: 500 }
    );
  }
}
