import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-utils";
import { eq, and, or } from "drizzle-orm";

// GET /api/jobs - Get jobs based on user role
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
    const searchParams = request.nextUrl.searchParams;
    const archived = searchParams.get("archived") === "true";

    let jobsList;
    const userRole = (user as any).data?.role || "client";

    if (userRole === "admin" || userRole === "manager") {
      // Admin/Manager: See all jobs
      jobsList = await db
        .select()
        .from(jobs)
        .where(eq(jobs.archived, archived));
    } else if (userRole === "designer") {
      // Designer: See assigned jobs
      jobsList = await db
        .select()
        .from(jobs)
        .where(
          and(
            eq(jobs.designerId, parseInt((user as any).id)),
            eq(jobs.archived, archived)
          )
        );
    } else {
      // Client: See own jobs
      jobsList = await db
        .select()
        .from(jobs)
        .where(
          and(eq(jobs.clientId, parseInt((user as any).id)), eq(jobs.archived, archived))
        );
    }

    return NextResponse.json(jobsList);
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

// POST /api/jobs - Create new job
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
    const body = await request.json();

    const {
      title,
      description,
      departmentId,
      packageType,
      priority,
      isDraft,
      designerId,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const [job] = await db
      .insert(jobs)
      .values({
        title,
        description: description || null,
        clientId: parseInt((user as any).id),
        departmentId: departmentId || null,
        packageType: packageType || null,
        priority: priority || "Medium",
        isDraft: isDraft !== undefined ? isDraft : true,
        status: "Draft",
        designerId: designerId || null,
        archived: false,
      })
      .returning();

    return NextResponse.json(job, { status: 201 });
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
}
