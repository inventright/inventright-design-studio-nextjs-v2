import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fileUploads, jobs } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-utils-flexible";
import { eq, desc } from "drizzle-orm";

// GET /api/files?jobId=123 - Get files for a job
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
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
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const userRole = (user as any).data?.role || "client";
    const canAccess =
      job.clientId === parseInt((user as any).id) ||
      job.designerId === parseInt((user as any).id) ||
      userRole === "admin" ||
      userRole === "manager";

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
