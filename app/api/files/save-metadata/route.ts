import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fileUploads, jobs } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth-utils-flexible";
import { eq } from "drizzle-orm";

// POST /api/files/save-metadata - Save file metadata after direct upload
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId, fileName, fileKey, fileSize, mimeType, fileType } = await request.json();

    if (!jobId || !fileName || !fileKey || !fileSize || !mimeType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify job exists and user has access
    const [job] = await db.select().from(jobs).where(eq(jobs.id, parseInt(jobId)));

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check access permissions
    const userRole = (user as any).data?.role || "client";
    const canUpload =
      job.clientId === parseInt((user as any).id) ||
      job.designerId === parseInt((user as any).id) ||
      userRole === "admin" ||
      userRole === "manager";

    if (!canUpload) {
      return NextResponse.json(
        { error: "You don't have permission to upload files to this job" },
        { status: 403 }
      );
    }

    // Construct file URL
    const fileUrl = `${process.env.WASABI_ENDPOINT}/${process.env.WASABI_BUCKET}/${fileKey}`;

    // Save file metadata to database
    const [uploadedFile] = await db
      .insert(fileUploads)
      .values({
        jobId: parseInt(jobId),
        uploadedBy: parseInt((user as any).id),
        fileName,
        fileUrl,
        fileKey,
        fileSize: parseInt(fileSize),
        mimeType,
        fileType: fileType || "input",
      })
      .returning();

    console.log('[Save Metadata API] File metadata saved:', fileName);

    return NextResponse.json({
      ...uploadedFile,
      fileKey,
    }, { status: 201 });
  } catch (error: any) {
    console.error("[Save Metadata API] Error:", error);
    return NextResponse.json(
      { error: "Failed to save file metadata", details: error.message },
      { status: 500 }
    );
  }
}
