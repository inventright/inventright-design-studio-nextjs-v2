import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fileUploads, jobs } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-utils";
import { uploadBase64File, generateFileKey } from "@/lib/storage";
import { eq } from "drizzle-orm";

// POST /api/files/upload - Upload a file to Wasabi S3
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const { jobId, fileName, fileData, mimeType, fileType } = body;

    if (!jobId || !fileName || !fileData || !mimeType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify job exists and user has access
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check access permissions
    const userRole = (user as any).data?.role || "client";
    const canUpload =
      job.clientId === parseInt(user.id) ||
      job.designerId === parseInt(user.id) ||
      userRole === "admin" ||
      userRole === "manager";

    if (!canUpload) {
      return NextResponse.json(
        { error: "You don't have permission to upload files to this job" },
        { status: 403 }
      );
    }

    // Generate unique file key
    const fileKey = generateFileKey(`jobs/${jobId}`, fileName);

    // Upload to Wasabi S3
    const { url } = await uploadBase64File(fileKey, fileData, mimeType);

    // Calculate file size from base64
    const buffer = Buffer.from(fileData, "base64");
    const fileSize = buffer.length;

    // Save file metadata to database
    const [uploadedFile] = await db
      .insert(fileUploads)
      .values({
        jobId,
        uploadedBy: parseInt(user.id),
        fileName,
        fileUrl: url,
        fileKey,
        fileSize,
        mimeType,
        fileType: fileType || "input",
      })
      .returning();

    return NextResponse.json(uploadedFile, { status: 201 });
  } catch (error: any) {
    console.error("File upload error:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
