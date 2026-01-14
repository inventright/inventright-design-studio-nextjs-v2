import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { and, eq, lt, sql } from "drizzle-orm";

/**
 * DELETE /api/jobs/draft/cleanup
 * Deletes draft jobs older than 60 days
 * This endpoint can be called manually or via a cron job
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log('[Draft Cleanup] Starting cleanup of old drafts...');
    
    // Calculate date 60 days ago
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    console.log('[Draft Cleanup] Deleting drafts older than:', sixtyDaysAgo.toISOString());

    // Delete draft jobs older than 60 days
    const deletedJobs = await db
      .delete(jobs)
      .where(
        and(
          eq(jobs.isDraft, true),
          lt(jobs.lastActivityDate, sixtyDaysAgo)
        )
      )
      .returning();

    console.log('[Draft Cleanup] Deleted', deletedJobs.length, 'old draft jobs');
    
    return NextResponse.json({ 
      success: true, 
      deletedCount: deletedJobs.length,
      deletedJobs: deletedJobs.map(j => ({ id: j.id, title: j.title, lastActivityDate: j.lastActivityDate }))
    }, { status: 200 });

  } catch (error: any) {
    console.error('[Draft Cleanup] Error cleaning up drafts:', error);
    return NextResponse.json(
      { error: "Failed to cleanup draft jobs", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/jobs/draft/cleanup
 * Returns information about drafts that will be deleted (dry run)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Draft Cleanup] Checking for old drafts...');
    
    // Calculate date 60 days ago
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Find draft jobs older than 60 days
    const oldDrafts = await db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.isDraft, true),
          lt(jobs.lastActivityDate, sixtyDaysAgo)
        )
      );

    console.log('[Draft Cleanup] Found', oldDrafts.length, 'old draft jobs');
    
    return NextResponse.json({ 
      success: true, 
      count: oldDrafts.length,
      drafts: oldDrafts.map(j => ({ 
        id: j.id, 
        title: j.title, 
        lastActivityDate: j.lastActivityDate,
        daysOld: Math.floor((Date.now() - new Date(j.lastActivityDate).getTime()) / (1000 * 60 * 60 * 24))
      }))
    }, { status: 200 });

  } catch (error: any) {
    console.error('[Draft Cleanup] Error checking drafts:', error);
    return NextResponse.json(
      { error: "Failed to check draft jobs", details: error.message },
      { status: 500 }
    );
  }
}
