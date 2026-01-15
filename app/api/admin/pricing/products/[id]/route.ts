import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { productPricing } from '@/lib/db/schema';
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

    const productId = parseInt(params.id);
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      productKey,
      productName,
      productDescription,
      category,
      departmentId,
      pricingTierId,
      price,
      currency,
      isActive
    } = body;

    const [product] = await db
      .update(productPricing)
      .set({
        productKey,
        productName,
        productDescription: productDescription || null,
        category,
        departmentId: departmentId || null,
        pricingTierId: pricingTierId || null,
        price: price.toString(),
        currency: currency || 'USD',
        isActive,
        updatedAt: new Date()
      })
      .where(eq(productPricing.id, productId))
      .returning();

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
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

    const productId = parseInt(params.id);
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    await db
      .delete(productPricing)
      .where(eq(productPricing.id, productId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
