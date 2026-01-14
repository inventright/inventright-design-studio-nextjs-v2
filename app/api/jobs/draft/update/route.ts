import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-utils-flexible";
import { eq, and } from "drizzle-orm";
import { getAssignedDesignerForJobType, mapPackageTypeToJobType } from "@/lib/designer-assignment-helper";

/**
 * PUT /api/jobs/draft/update
 * Updates a draft job and optionally converts it to active (isDraft: false)
 */
export async function PUT(request: NextRequest) {
  try {
    console.log('[Draft Update API] Starting draft update...');
    
    // Check authentication
    const user = await requireAuth();
    if (!user) {
      console.error('[Draft Update API] Unauthorized');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('[Draft Update API] User authenticated:', user.id);

    // Parse request body
    const body = await request.json();
    const {
      jobId,
      title,
      description,
      departmentId,
      packageType,
      priority,
      makeActive, // If true, convert draft to active job
      designerId,
    } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Verify the job exists and belongs to the user
    const [existingJob] = await db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.id, jobId),
          eq(jobs.clientId, parseInt((user as any).id))
        )
      );

    if (!existingJob) {
      return NextResponse.json(
        { error: "Job not found or access denied" },
        { status: 404 }
      );
    }

    // Prepare update values
    const updateValues: any = {
      updatedAt: new Date(),
      lastActivityDate: new Date(),
    };

    if (title !== undefined) updateValues.title = title;
    if (description !== undefined) {
      updateValues.description = typeof description === 'object' 
        ? JSON.stringify(description) 
        : description;
    }
    if (departmentId !== undefined) updateValues.departmentId = departmentId;
    if (packageType !== undefined) updateValues.packageType = packageType;
    if (priority !== undefined) updateValues.priority = priority;

    // Handle designer assignment
    let assignedDesignerId = designerId || existingJob.designerId;
    
    if (makeActive && !assignedDesignerId && packageType) {
      try {
        const jobType = mapPackageTypeToJobType(packageType);
        if (jobType) {
          const autoAssignedDesigner = await getAssignedDesignerForJobType(jobType);
          if (autoAssignedDesigner) {
            assignedDesignerId = autoAssignedDesigner;
            console.log(`[Draft Update API] Auto-assigned designer ${autoAssignedDesigner} for job type ${jobType}`);
          }
        }
      } catch (assignError: any) {
        console.error('[Draft Update API] Designer assignment error:', assignError.message);
      }
    }

    if (assignedDesignerId !== undefined) {
      updateValues.designerId = assignedDesignerId;
    }

    // If making active, update status and isDraft
    if (makeActive) {
      updateValues.isDraft = false;
      updateValues.status = "Pending";
      console.log('[Draft Update API] Converting draft to active job');
    }

    // Update the job
    const [updatedJob] = await db
      .update(jobs)
      .set(updateValues)
      .where(eq(jobs.id, jobId))
      .returning();

    console.log('[Draft Update API] Job updated successfully:', updatedJob.id);
    
    return NextResponse.json({ 
      success: true, 
      job: updatedJob 
    }, { status: 200 });

  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error('[Draft Update API] Error updating draft:', error);
    return NextResponse.json(
      { error: "Failed to update draft job", details: error.message },
      { status: 500 }
    );
  }
}
