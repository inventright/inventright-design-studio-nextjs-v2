import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fileUploads, users } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-utils-flexible";
import { eq, desc } from "drizzle-orm";

// GET /api/jobs/[id]/files - Get all files for a job
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const jobId = parseInt(id);

    if (isNaN(jobId)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }

    // Get files with uploader information
    const jobFiles = await db
      .select({
        id: fileUploads.id,
        jobId: fileUploads.jobId,
        uploadedBy: fileUploads.uploadedBy,
        fileName: fileUploads.fileName,
        fileUrl: fileUploads.fileUrl,
        fileKey: fileUploads.fileKey,
        fileSize: fileUploads.fileSize,
        mimeType: fileUploads.mimeType,
        fileType: fileUploads.fileType,
        createdAt: fileUploads.createdAt,
        uploaderName: users.name,
        uploaderEmail: users.email,
      })
      .from(fileUploads)
      .leftJoin(users, eq(fileUploads.uploadedBy, users.id))
      .where(eq(fileUploads.jobId, jobId))
      .orderBy(desc(fileUploads.createdAt));

    return NextResponse.json(jobFiles);
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("Error fetching files:", error);
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}
