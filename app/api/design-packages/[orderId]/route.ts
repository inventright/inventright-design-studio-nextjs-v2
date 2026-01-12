import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { designPackageOrders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET - Fetch design package by order ID
export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;

    const packages = await db
      .select()
      .from(designPackageOrders)
      .where(eq(designPackageOrders.orderId, orderId))
      .limit(1);

    if (packages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Design package not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      package: packages[0]
    });
  } catch (error) {
    console.error('[Design Package API] Error fetching package:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch design package' },
      { status: 500 }
    );
  }
}

// PATCH - Update design package status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;
    const body = await request.json();

    const updateData: any = {
      updatedAt: new Date()
    };

    // Update virtual prototype status
    if (body.virtualPrototypeStatus) {
      updateData.virtualPrototypeStatus = body.virtualPrototypeStatus;
      if (body.virtualPrototypeStatus === 'completed') {
        updateData.virtualPrototypeCompletedAt = new Date();
        updateData.sellSheetStatus = 'not_started'; // Unlock sell sheet
      }
    }

    if (body.virtualPrototypeJobId) {
      updateData.virtualPrototypeJobId = body.virtualPrototypeJobId;
    }

    // Update sell sheet status
    if (body.sellSheetStatus) {
      updateData.sellSheetStatus = body.sellSheetStatus;
      if (body.sellSheetStatus === 'completed') {
        updateData.sellSheetCompletedAt = new Date();
        updateData.packageStatus = 'completed'; // Mark package as completed
      }
    }

    if (body.sellSheetJobId) {
      updateData.sellSheetJobId = body.sellSheetJobId;
    }

    const [updatedPackage] = await db
      .update(designPackageOrders)
      .set(updateData)
      .where(eq(designPackageOrders.orderId, orderId))
      .returning();

    return NextResponse.json({
      success: true,
      package: updatedPackage
    });
  } catch (error) {
    console.error('[Design Package API] Error updating package:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update design package' },
      { status: 500 }
    );
  }
}
