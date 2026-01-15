import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailLogs } from '@/lib/db/schema';
import { desc, eq, like, or } from 'drizzle-orm';

// GET - Fetch all email logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = db.select().from(emailLogs).orderBy(desc(emailLogs.sentAt)).limit(limit);

    // Apply filters if provided
    if (search) {
      query = query.where(
        or(
          like(emailLogs.recipient, `%${search}%`),
          like(emailLogs.subject, `%${search}%`)
        )
      ) as any;
    }

    if (status) {
      query = query.where(eq(emailLogs.status, status)) as any;
    }

    const logs = await query;

    return NextResponse.json({
      success: true,
      logs,
    });
  } catch (error) {
    console.error('[Email Logs API] Error fetching logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch email logs' },
      { status: 500 }
    );
  }
}
