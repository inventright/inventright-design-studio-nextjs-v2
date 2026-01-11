import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fileUploads, jobs } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-utils";
import { eq, desc } from "drizzle-orm";

// GET /api/files?jobId=123 - Get files for a job
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "jobId is required" },
        { status: 400 }
      );
    }

    // Verify job exists and user has access
    const [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, parseInt(jobId)));

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check access permissions
    const canAccess =
      job.clientId === parseInt(user.id) ||
      job.designerId === parseInt(user.id) ||
      user.role === "admin" ||
      user.role === "manager";

    if (!canAccess) {
      return NextResponse.json(
        { error: "You don't have permission to view files for this job" },
        { status: 403 }
      );
    }

    // Get files
    const files = await db
      .select()
      .from(fileUploads)
      .where(eq(fileUploads.jobId, parseInt(jobId)))
      .orderBy(desc(fileUploads.createdAt));

    return NextResponse.json(files);
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}
