import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobs } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth-utils-flexible';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/jobs/draft - Get or create a draft job for the current user
 * Returns existing draft or creates a new one
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt((user as any).id);

    // Look for existing draft job for this user
    const existingDrafts = await db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.clientId, userId),
          eq(jobs.isDraft, true)
        )
      )
      .orderBy(jobs.updatedAt)
      .limit(1);

    if (existingDrafts.length > 0) {
      console.log('[Draft Job] Found existing draft:', existingDrafts[0].id);
      return NextResponse.json({ job: existingDrafts[0] });
    }

    // No existing draft, create a new one
    const [newDraft] = await db
      .insert(jobs)
      .values({
        clientId: userId,
        title: 'Untitled Job',
        description: '',
        status: 'Draft',
        priority: 'Medium',
        isDraft: true,
        archived: false,
      })
      .returning();

    console.log('[Draft Job] Created new draft:', newDraft.id);

    return NextResponse.json({ job: newDraft }, { status: 201 });
  } catch (error: any) {
    console.error('[Draft Job] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get or create draft job', details: error.message },
      { status: 500 }
    );
  }
}
