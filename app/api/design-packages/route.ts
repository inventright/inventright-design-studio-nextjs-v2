import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { designPackageOrders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET - Get all design packages for current user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const packages = await db
      .select()
      .from(designPackageOrders)
      .where(eq(designPackageOrders.clientId, parseInt(clientId)))
      .orderBy(designPackageOrders.purchaseDate);

    return NextResponse.json({
      success: true,
      packages
    });
  } catch (error) {
    console.error('[Design Packages API] Error fetching packages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch design packages' },
      { status: 500 }
    );
  }
}

// POST - Create new design package order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, clientId } = body;

    if (!orderId || !clientId) {
      return NextResponse.json(
        { success: false, error: 'Order ID and Client ID are required' },
        { status: 400 }
      );
    }

    // Check if order already exists
    const existing = await db
      .select()
      .from(designPackageOrders)
      .where(eq(designPackageOrders.orderId, orderId))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Design package order already exists' },
        { status: 409 }
      );
    }

    const [newPackage] = await db
      .insert(designPackageOrders)
      .values({
        orderId,
        clientId: parseInt(clientId),
        virtualPrototypeStatus: 'not_started',
        sellSheetStatus: 'locked',
        packageStatus: 'active',
      })
      .returning();

    return NextResponse.json({
      success: true,
      package: newPackage
    }, { status: 201 });
  } catch (error) {
    console.error('[Design Packages API] Error creating package:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create design package' },
      { status: 500 }
    );
  }
}
