import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { designerAssignments, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// GET - Fetch all designer assignments grouped by job type
export async function GET(request: NextRequest) {
  try {
    const assignments = await db
      .select({
        id: designerAssignments.id,
        jobType: designerAssignments.jobType,
        designerId: designerAssignments.designerId,
        isActive: designerAssignments.isActive,
        priority: designerAssignments.priority,
        designerName: users.name,
        designerEmail: users.email,
      })
      .from(designerAssignments)
      .leftJoin(users, eq(designerAssignments.designerId, users.id))
      .where(eq(designerAssignments.isActive, true))
      .orderBy(designerAssignments.jobType, designerAssignments.priority);

    // Group by job type
    const grouped = {
      sell_sheets: assignments.filter(a => a.jobType === 'sell_sheets'),
      virtual_prototypes: assignments.filter(a => a.jobType === 'virtual_prototypes'),
      line_drawings: assignments.filter(a => a.jobType === 'line_drawings'),
    };

    return NextResponse.json({
      success: true,
      assignments: grouped
    });
  } catch (error) {
    console.error('[Designer Assignments API] Error fetching assignments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch designer assignments' },
      { status: 500 }
    );
  }
}

// POST - Create or update designer assignments for a job type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobType, designerIds } = body;

    if (!jobType || !Array.isArray(designerIds)) {
      return NextResponse.json(
        { success: false, error: 'jobType and designerIds array are required' },
        { status: 400 }
      );
    }

    // Validate job type
    const validJobTypes = ['sell_sheets', 'virtual_prototypes', 'line_drawings'];
    if (!validJobTypes.includes(jobType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid job type' },
        { status: 400 }
      );
    }

    // Deactivate all existing assignments for this job type
    await db
      .update(designerAssignments)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(designerAssignments.jobType, jobType));

    // Create new assignments
    if (designerIds.length > 0) {
      const newAssignments = designerIds.map((designerId: number, index: number) => ({
        jobType,
        designerId,
        isActive: true,
        priority: index, // Priority based on order in array
      }));

      await db.insert(designerAssignments).values(newAssignments);
    }

    return NextResponse.json({
      success: true,
      message: `Designer assignments updated for ${jobType}`
    });
  } catch (error) {
    console.error('[Designer Assignments API] Error updating assignments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update designer assignments' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a specific designer assignment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Assignment ID is required' },
        { status: 400 }
      );
    }

    await db
      .update(designerAssignments)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(designerAssignments.id, parseInt(id)));

    return NextResponse.json({
      success: true,
      message: 'Designer assignment removed'
    });
  } catch (error) {
    console.error('[Designer Assignments API] Error deleting assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete designer assignment' },
      { status: 500 }
    );
  }
}
