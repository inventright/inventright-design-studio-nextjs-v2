import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-utils-flexible";

/**
 * POST /api/jobs/draft/create
 * Creates a draft job in the database with isDraft: true
 * Returns the real job ID (integer) for immediate file uploads
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Draft API] Creating draft job...');
    
    // Check authentication
    const user = await requireAuth();
    if (!user) {
      console.error('[Draft API] Unauthorized');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('[Draft API] User authenticated:', user.id);

    // Create draft job with minimal required fields
    const [draftJob] = await db
      .insert(jobs)
      .values({
        title: "Untitled Draft",
        description: null,
        clientId: parseInt((user as any).id),
        departmentId: null,
        packageType: null,
        priority: "Medium",
        isDraft: true,
        status: "Draft",
        designerId: null,
        archived: false,
      })
      .returning();

    console.log('[Draft API] Draft job created successfully:', draftJob.id);
    
    return NextResponse.json({ 
      success: true, 
      jobId: draftJob.id,
      job: draftJob 
    }, { status: 201 });

  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error('[Draft API] Error creating draft:', error);
    return NextResponse.json(
      { error: "Failed to create draft job", details: error.message },
      { status: 500 }
    );
  }
}
