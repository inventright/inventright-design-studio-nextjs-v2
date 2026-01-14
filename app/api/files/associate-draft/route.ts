import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fileUploads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-utils-flexible';

/**
 * Associate draft files with a real job
 * Updates all files with draftJobId to use realJobId instead
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

    // Update all files with the draft job ID to use the real job ID
    const result = await db
      .update(fileUploads)
      .set({ jobId: realJobId.toString() })
      .where(eq(fileUploads.jobId, draftJobId));

    console.log(`[Associate Draft] Updated files successfully`);

    return NextResponse.json({
      success: true,
      message: 'Draft files associated with job'
    });
  } catch (error: any) {
    console.error('[Associate Draft] Error:', error);
    return NextResponse.json(
      { error: 'Failed to associate draft files', details: error.message },
      { status: 500 }
    );
  }
}
