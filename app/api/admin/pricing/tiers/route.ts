import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pricingTiers } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tiers = await db
      .select()
      .from(pricingTiers)
      .orderBy(pricingTiers.sortOrder, pricingTiers.id);

    return NextResponse.json({ tiers });
  } catch (error) {
    console.error('Error fetching pricing tiers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing tiers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, displayName, description, wordpressMembershipLevel, isActive, sortOrder } = body;

    if (!name || !displayName) {
      return NextResponse.json(
        { error: 'Name and display name are required' },
        { status: 400 }
      );
    }

    const [tier] = await db
      .insert(pricingTiers)
      .values({
        name,
        displayName,
        description: description || null,
        wordpressMembershipLevel: wordpressMembershipLevel || null,
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0
      })
      .returning();

    return NextResponse.json({ tier });
  } catch (error) {
    console.error('Error creating pricing tier:', error);
    return NextResponse.json(
      { error: 'Failed to create pricing tier' },
      { status: 500 }
    );
  }
}
