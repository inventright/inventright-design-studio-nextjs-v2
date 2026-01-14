import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fileUploads, jobs } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth-utils-flexible";
import { uploadFile, generateFileKey } from "@/lib/storage";
import { eq } from "drizzle-orm";

// POST /api/files/upload - Upload a file to Wasabi S3
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if request is FormData or JSON
    const contentType = request.headers.get('content-type') || '';
    const isFormData = contentType.includes('multipart/form-data');

    let jobId: string;
    let fileName: string;
    let fileBuffer: Buffer;
    let mimeType: string;
    let fileType: string = "input";

    if (isFormData) {
      // Handle FormData upload (for immediate draft uploads)
      const formData = await request.formData();
      const file = formData.get('file') as File;
      jobId = formData.get('jobId') as string;
      fileType = (formData.get('fileType') as string) || "input";

      if (!file || !jobId) {
        return NextResponse.json(
          { error: "Missing file or jobId" },
          { status: 400 }
        );
      }

      fileName = file.name;
      mimeType = file.type;
      
      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);

      console.log('[Upload API] FormData upload:', fileName, 'Job:', jobId, 'Size:', fileBuffer.length);
    } else {
      // Handle JSON upload (legacy base64 format)
      const body = await request.json();
      jobId = body.jobId;
      fileName = body.fileName;
      mimeType = body.mimeType;
      fileType = body.fileType || "input";
      
      if (!jobId || !fileName || !body.fileData || !mimeType) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }

      // Decode base64 to buffer
      fileBuffer = Buffer.from(body.fileData.split(',')[1] || body.fileData, 'base64');
      
      console.log('[Upload API] JSON upload:', fileName, 'Job:', jobId, 'Size:', fileBuffer.length);
    }

    // Check if this is a draft job ID (starts with "draft_")
    const isDraftJob = jobId.startsWith('draft_');

    if (!isDraftJob) {
      // For real jobs, verify job exists and user has access
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
    } else {
      console.log('[Upload API] Draft job upload, skipping job verification');
    }

    // Generate unique file key
    const fileKey = generateFileKey(`jobs/${jobId}`, fileName);

    // Upload to Wasabi S3
    console.log('[Upload API] Uploading to S3:', fileKey);
    const { url } = await uploadFile(fileKey, fileBuffer, mimeType);
    console.log('[Upload API] Upload successful:', url);

    // Save file metadata to database
    const [uploadedFile] = await db
      .insert(fileUploads)
      .values({
        jobId,
        uploadedBy: parseInt((user as any).id),
        fileName,
        fileUrl: url,
        fileKey,
        fileSize: fileBuffer.length,
        mimeType,
        fileType,
      })
      .returning();

    console.log('[Upload API] File metadata saved to database');

    return NextResponse.json({
      ...uploadedFile,
      fileKey, // Return file key for client to store
    }, { status: 201 });
  } catch (error: any) {
    console.error("[Upload API] Error:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json(
      { error: "Failed to upload file", details: error.message },
      { status: 500 }
    );
  }
}
