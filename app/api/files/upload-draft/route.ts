import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils-flexible";
import { uploadBase64File, generateFileKey } from "@/lib/storage";

// POST /api/files/upload-draft - Upload a file immediately (before job creation)
// Returns the file key for later association with a job
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { fileName, fileData, mimeType } = body;

    if (!fileName || !fileData || !mimeType) {
      return NextResponse.json(
        { error: "Missing required fields: fileName, fileData, mimeType" },
        { status: 400 }
      );
    }

    const userId = (user as any).id;

    // Generate unique file key in a temp location
    const fileKey = generateFileKey(`temp/${userId}`, fileName);

    // Upload to Wasabi S3
    const { url } = await uploadBase64File(fileKey, fileData, mimeType);

    // Return the file key (not the public URL) for storage in form
    // The key will be used to generate presigned URLs when needed
    return NextResponse.json(
      {
        fileKey,
        fileName,
        mimeType,
        // Don't return URL - it will be generated on-demand with presigned URLs
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[Upload Draft] Error:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
