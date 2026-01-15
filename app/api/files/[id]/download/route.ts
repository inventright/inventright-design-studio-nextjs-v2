import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fileUploads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getFileUrl } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth-utils-flexible";

// GET /api/files/[id]/download - Get a signed URL for downloading a file
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const fileId = parseInt(params.id);

    if (isNaN(fileId)) {
      return NextResponse.json({ error: "Invalid file ID" }, { status: 400 });
    }

    // Get file from database
    const files = await db
      .select()
      .from(fileUploads)
      .where(eq(fileUploads.id, fileId))
      .limit(1);

    if (files.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const file = files[0];

    // Generate signed URL (expires in 1 hour)
    const signedUrl = await getFileUrl(file.fileKey, 3600);

    return NextResponse.json({
      url: signedUrl,
      fileName: file.fileName,
      mimeType: file.mimeType,
    });
  } catch (error) {
    console.error("[Download API] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 500 }
    );
  }
}
