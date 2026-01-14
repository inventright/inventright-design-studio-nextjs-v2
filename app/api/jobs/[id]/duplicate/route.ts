import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs, files } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-utils-flexible";
import { eq } from "drizzle-orm";

// POST /api/jobs/[id]/duplicate - Duplicate a job
export async function POST(
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

    // Get the original job
    const [originalJob] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!originalJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check authorization - users can only duplicate their own jobs unless they're admin/manager
    const userRole = (user as any).data?.role || "client";
    const userId = parseInt((user as any).id);

    if (
      userRole !== "admin" &&
      userRole !== "manager" &&
      originalJob.clientId !== userId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create a duplicate job with "(Copy)" appended to the title
    const [duplicatedJob] = await db
      .insert(jobs)
      .values({
        title: `${originalJob.title} (Copy)`,
        description: originalJob.description,
        status: "Draft", // Always start as draft
        priority: originalJob.priority,
        packageType: originalJob.packageType,
        clientId: originalJob.clientId,
        designerId: null, // Reset designer
        departmentId: originalJob.departmentId,
        isDraft: true, // Always start as draft
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivityDate: new Date(),
      })
      .returning();

    // Get files from the original job
    const originalFiles = await db
      .select()
      .from(files)
      .where(eq(files.jobId, jobId));

    // Duplicate files if any exist
    if (originalFiles.length > 0) {
      await db.insert(files).values(
        originalFiles.map((file) => ({
          jobId: duplicatedJob.id,
          fileName: file.fileName,
          fileUrl: file.fileUrl,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
          uploadedAt: new Date(),
        }))
      );
    }

    return NextResponse.json({
      success: true,
      job: duplicatedJob,
      message: "Job duplicated successfully",
    });
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("Error duplicating job:", error);
    return NextResponse.json(
      { error: "Failed to duplicate job" },
      { status: 500 }
    );
  }
}
