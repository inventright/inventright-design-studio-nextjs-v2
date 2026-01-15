import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { productPricing } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Fetch all products
    const allProducts = await db
      .select()
      .from(productPricing)
      .orderBy(productPricing.category, productPricing.productName);

    // Create a map of productKey to productName for parent lookups
    const productMap = new Map(allProducts.map(p => [p.productKey, p.productName]));

    // Add parent product names to products that have a parent
    const productsWithParents = allProducts.map(product => ({
      ...product,
      parentProductName: product.parentProductKey 
        ? productMap.get(product.parentProductKey) || null
        : null
    }));

    return NextResponse.json({ products: productsWithParents });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
      isActive,
      parentProductKey
    } = body;

    if (!productKey || !productName || !category || price === undefined) {
      return NextResponse.json(
        { error: 'Product key, name, category, and price are required' },
        { status: 400 }
      );
    }

    const [product] = await db
      .insert(productPricing)
      .values({
        productKey,
        productName,
        productDescription: productDescription || null,
        category,
        departmentId: departmentId || null,
        pricingTierId: pricingTierId || null,
        price: price.toString(),
        currency: currency || 'USD',
        isActive: isActive ?? true,
        parentProductKey: parentProductKey || null
      })
      .returning();

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
