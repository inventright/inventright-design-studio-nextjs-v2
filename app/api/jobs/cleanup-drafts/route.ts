import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobs, fileUploads } from '@/lib/db/schema';
import { and, eq, lt } from 'drizzle-orm';
import { deleteFile } from '@/lib/storage';

/**
 * DELETE /api/jobs/cleanup-drafts
 * Delete draft jobs older than 60 days and their associated files
 * This should be called by a cron job or scheduled task
 */
export async function DELETE(request: NextRequest) {
  try {
    // Calculate the cutoff date (60 days ago)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    console.log('[Cleanup Drafts] Finding drafts older than:', sixtyDaysAgo.toISOString());

    // Find all draft jobs older than 60 days
    const expiredDrafts = await db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.isDraft, true),
          lt(jobs.updatedAt, sixtyDaysAgo)
        )
      );

    if (expiredDrafts.length === 0) {
      console.log('[Cleanup Drafts] No expired drafts found');
      return NextResponse.json({
        success: true,
        message: 'No expired drafts to clean up',
        deletedCount: 0
      });
    }

    console.log(`[Cleanup Drafts] Found ${expiredDrafts.length} expired drafts`);

    let totalFilesDeleted = 0;

    // Delete files and jobs
    for (const draft of expiredDrafts) {
      // Get all files associated with this draft
      const draftFiles = await db
        .select()
        .from(fileUploads)
        .where(eq(fileUploads.jobId, draft.id));

      // Delete files from Wasabi
      for (const file of draftFiles) {
        try {
          await deleteFile(file.fileKey);
          console.log(`[Cleanup Drafts] Deleted file: ${file.fileKey}`);
          totalFilesDeleted++;
        } catch (error) {
          console.error(`[Cleanup Drafts] Failed to delete file ${file.fileKey}:`, error);
        }
      }

      // Delete file records from database (cascade should handle this, but being explicit)
      await db.delete(fileUploads).where(eq(fileUploads.jobId, draft.id));

      // Delete the draft job
      await db.delete(jobs).where(eq(jobs.id, draft.id));

      console.log(`[Cleanup Drafts] Deleted draft job ${draft.id} with ${draftFiles.length} files`);
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${expiredDrafts.length} expired drafts`,
      deletedDrafts: expiredDrafts.length,
      deletedFiles: totalFilesDeleted
    });
  } catch (error: any) {
    console.error('[Cleanup Drafts] Error:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup expired drafts', details: error.message },
      { status: 500 }
    );
  }
}
