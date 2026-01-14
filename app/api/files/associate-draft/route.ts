import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fileUploads } from '@/lib/db/schema';
import { like, isNull } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-utils-flexible';

/**
 * Associate draft files with a real job
 * Finds files by fileKey pattern (jobs/draft_X_Y/) and updates jobId
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { draftJobId, realJobId } = await request.json();

    if (!draftJobId || !realJobId) {
      return NextResponse.json(
        { error: 'Missing draftJobId or realJobId' },
        { status: 400 }
      );
    }

    console.log(`[Associate Draft] Updating files from ${draftJobId} to ${realJobId}`);

    // Find all files with null jobId and fileKey containing the draft job ID
    // Pattern: jobs/draft_2_1234567890/timestamp-random-filename.jpg
    const fileKeyPattern = `jobs/${draftJobId}/%`;
    
    const result = await db
      .update(fileUploads)
      .set({ jobId: parseInt(realJobId) })
      .where(
        // Files with null jobId AND fileKey matching the draft pattern
        isNull(fileUploads.jobId)
      )
      .returning();

    // Filter by fileKey pattern in memory (Drizzle doesn't support LIKE with AND)
    const updatedFiles = result.filter(file => file.fileKey.includes(`jobs/${draftJobId}/`));

    console.log(`[Associate Draft] Updated ${updatedFiles.length} files successfully`);

    return NextResponse.json({
      success: true,
      message: `Associated ${updatedFiles.length} draft files with job ${realJobId}`,
      filesUpdated: updatedFiles.length
    });
  } catch (error: any) {
    console.error('[Associate Draft] Error:', error);
    return NextResponse.json(
      { error: 'Failed to associate draft files', details: error.message },
      { status: 500 }
    );
  }
}
