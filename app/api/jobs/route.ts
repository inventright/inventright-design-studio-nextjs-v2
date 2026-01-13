import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-utils";
import { eq, and, or } from "drizzle-orm";
import { getAssignedDesignerForJobType, mapPackageTypeToJobType } from "@/lib/designer-assignment-helper";

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
    console.log('[Jobs API] Starting job creation...');
    
    // Check authentication
    let user;
    try {
      user = await requireAuth();
      console.log('[Jobs API] User authenticated:', user?.id);
    } catch (authError: any) {
      console.error('[Jobs API] Auth error:', authError.message);
      return NextResponse.json({ error: "Unauthorized", details: authError.message }, { status: 401 });
    }
    
    if (!user) {
      console.error('[Jobs API] No user returned from requireAuth');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('[Jobs API] Request body:', JSON.stringify(body));
    } catch (parseError: any) {
      console.error('[Jobs API] JSON parse error:', parseError.message);
      return NextResponse.json({ error: "Invalid JSON", details: parseError.message }, { status: 400 });
    }

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
      console.error('[Jobs API] Missing title');
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Automatically assign designer based on job type if not manually specified
    let assignedDesignerId = designerId || null;
    
    if (!assignedDesignerId && packageType) {
      try {
        const jobType = mapPackageTypeToJobType(packageType);
        if (jobType) {
          const autoAssignedDesigner = await getAssignedDesignerForJobType(jobType);
          if (autoAssignedDesigner) {
            assignedDesignerId = autoAssignedDesigner;
            console.log(`[Jobs API] Auto-assigned designer ${autoAssignedDesigner} for job type ${jobType}`);
          }
        }
      } catch (assignError: any) {
        console.error('[Jobs API] Designer assignment error:', assignError.message);
        // Continue without auto-assignment
      }
    }

    // Create job
    console.log('[Jobs API] Inserting job into database...');
    try {
      const [job] = await db
        .insert(jobs)
        .values({
          title,
          description: typeof description === 'object' ? JSON.stringify(description) : (description || null),
          clientId: parseInt((user as any).id),
          departmentId: departmentId || null,
          packageType: packageType || null,
          priority: priority || "Medium",
          isDraft: isDraft !== undefined ? isDraft : false,
          status: isDraft ? "Draft" : "Pending",
          designerId: assignedDesignerId || null,
          archived: false,
        })
        .returning();

      console.log('[Jobs API] Job created successfully:', job.id);
      return NextResponse.json(job, { status: 201 });
    } catch (dbError: any) {
      console.error('[Jobs API] Database error:', dbError);
      console.error('[Jobs API] Database error message:', dbError.message);
      console.error('[Jobs API] Database error stack:', dbError.stack);
      return NextResponse.json(
        { error: "Database error", details: dbError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error('[Jobs API] Unexpected error:', error);
    console.error('[Jobs API] Error stack:', error.stack);
    console.error('[Jobs API] Error message:', error.message);
    return NextResponse.json(
      { error: "Failed to create job", details: error.message },
      { status: 500 }
    );
  }
}
