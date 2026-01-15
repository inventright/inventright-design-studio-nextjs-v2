import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pricingTiers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUser } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tierId = parseInt(params.id);
    if (isNaN(tierId)) {
      return NextResponse.json({ error: 'Invalid tier ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, displayName, description, wordpressMembershipLevel, isActive, sortOrder } = body;

    const [tier] = await db
      .update(pricingTiers)
      .set({
        name,
        displayName,
        description: description || null,
        wordpressMembershipLevel: wordpressMembershipLevel || null,
        isActive,
        sortOrder,
        updatedAt: new Date()
      })
      .where(eq(pricingTiers.id, tierId))
      .returning();

    if (!tier) {
      return NextResponse.json({ error: 'Tier not found' }, { status: 404 });
    }

    return NextResponse.json({ tier });
  } catch (error) {
    console.error('Error updating pricing tier:', error);
    return NextResponse.json(
      { error: 'Failed to update pricing tier' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tierId = parseInt(params.id);
    if (isNaN(tierId)) {
      return NextResponse.json({ error: 'Invalid tier ID' }, { status: 400 });
    }

    await db
      .delete(pricingTiers)
      .where(eq(pricingTiers.id, tierId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pricing tier:', error);
    return NextResponse.json(
      { error: 'Failed to delete pricing tier' },
      { status: 500 }
    );
  }
}
