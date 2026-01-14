import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-utils-flexible";
import { eq } from "drizzle-orm";

// GET /api/jobs/[id] - Get a specific job by ID
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

    const [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check authorization - users can only see their own jobs unless they're admin/manager/designer
    const userRole = (user as any).data?.role || "client";
    const userId = parseInt((user as any).id);

    if (
      userRole !== "admin" &&
      userRole !== "manager" &&
      job.clientId !== userId &&
      (job.designerId !== userId || userRole !== "designer")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(job);
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("[Jobs API] Error fetching job:", error);
    return NextResponse.json(
      { error: "Failed to fetch job" },
      { status: 500 }
    );
  }
}

// PATCH /api/jobs/[id] - Update a specific job
export async function PATCH(
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

    const body = await request.json();
    const { status, priority, designerId, description, title, departmentId, packageType, isDraft } = body;

    // Get existing job to check permissions
    const [existingJob] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!existingJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check authorization
    const userRole = (user as any).data?.role || "client";
    const userId = parseInt((user as any).id);

    if (
      userRole !== "admin" &&
      userRole !== "manager" &&
      existingJob.clientId !== userId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build update object
    const updates: any = {};
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (designerId !== undefined) updates.designerId = designerId;
    if (description !== undefined) updates.description = description;
    if (title !== undefined) updates.title = title;
    if (departmentId !== undefined) updates.departmentId = departmentId;
    if (packageType !== undefined) updates.packageType = packageType;
    if (isDraft !== undefined) updates.isDraft = isDraft;
    updates.updatedAt = new Date();
    updates.lastActivityDate = new Date();

    const [updatedJob] = await db
      .update(jobs)
      .set(updates)
      .where(eq(jobs.id, jobId))
      .returning();

    return NextResponse.json(updatedJob);
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("[Jobs API] Error updating job:", error);
    return NextResponse.json(
      { error: "Failed to update job" },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/[id] - Delete a specific job
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (user as any).data?.role || "client";
    if (userRole !== "admin" && userRole !== "manager") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const jobId = parseInt(id);
    if (isNaN(jobId)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }

    await db.delete(jobs).where(eq(jobs.id, jobId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("[Jobs API] Error deleting job:", error);
    return NextResponse.json(
      { error: "Failed to delete job" },
      { status: 500 }
    );
  }
}
