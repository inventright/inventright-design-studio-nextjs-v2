import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils-flexible";
import { uploadFile, generateFileKey } from "@/lib/storage";

// POST /api/files/upload-draft - Upload a file immediately (before job creation)
// Returns the file key for later association with a job
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse FormData instead of JSON
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: "Missing file in request" },
        { status: 400 }
      );
    }

    const userId = (user as any).id;

    // Generate unique file key in a temp location
    const fileKey = generateFileKey(`temp/${userId}`, file.name);

    // Convert File to Buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Wasabi S3
    const { url } = await uploadFile(fileKey, buffer, file.type);

    // Return the file key (not the public URL) for storage in form
    // The key will be used to generate presigned URLs when needed
    return NextResponse.json(
      {
        fileKey,
        fileName: file.name,
        mimeType: file.type,
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
