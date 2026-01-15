import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getCurrentUser } from "@/lib/auth-utils-flexible";
import { generateFileKey } from "@/lib/storage";

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

// POST /api/files/presigned-url - Generate presigned URL for direct upload
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileName, mimeType, jobId } = await request.json();

    if (!fileName || !mimeType || !jobId) {
      return NextResponse.json(
        { error: "Missing required fields: fileName, mimeType, jobId" },
        { status: 400 }
      );
    }

    // Generate unique file key
    const fileKey = generateFileKey(`jobs/${jobId}`, fileName);

    // Create presigned URL for PUT operation (15 minute expiry)
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      ContentType: mimeType,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    console.log('[Presigned URL API] Generated URL for:', fileName, 'Key:', fileKey);

    return NextResponse.json({
      presignedUrl,
      fileKey,
      fileName,
    });
  } catch (error: any) {
    console.error("[Presigned URL API] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate presigned URL", details: error.message },
      { status: 500 }
    );
  }
}
