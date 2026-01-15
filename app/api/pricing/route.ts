import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { productPricing } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tierName = searchParams.get('tierName') || 'Default Pricing';
    
    // For default pricing, get products with null pricingTierId
    const products = await db
      .select()
      .from(productPricing)
      .where(
        and(
          isNull(productPricing.pricingTierId),
          eq(productPricing.isActive, true)
        )
      );

    // Transform to a more usable format
    const pricing: Record<string, number> = {};
    products.forEach(product => {
      pricing[product.productKey] = parseFloat(product.price);
    });

    return NextResponse.json({ pricing, products });
  } catch (error: any) {
    console.error('Error fetching pricing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing', details: error.message },
      { status: 500 }
    );
  }
}
