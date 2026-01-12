import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.WASABI_REGION || "us-east-1",
  endpoint: process.env.WASABI_ENDPOINT || "https://s3.wasabisys.com",
  credentials: {
    accessKeyId: process.env.WASABI_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.WASABI_BUCKET || "";

// GET /api/email-templates/images/[...path] - Proxy images from Wasabi S3
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Reconstruct the full path
    const imagePath = params.path.join("/");
    const key = `email-templates/${imagePath}`;

    // Get the object from S3
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Return the image with appropriate headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": response.ContentType || "image/png",
        "Cache-Control": "public, max-age=31536000, immutable", // Cache for 1 year
      },
    });
  } catch (error: any) {
    console.error("Error serving image:", error);
    return NextResponse.json(
      { error: "Image not found" },
      { status: 404 }
    );
  }
}
