import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { productPricing, pricingTiers } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      departmentKey, 
      addOns = [],
      voucherCode,
      userId,
      tierName = 'Default Pricing',
      tierId = null
    } = body;

    if (!departmentKey) {
      return NextResponse.json(
        { error: 'Department is required' },
        { status: 400 }
      );
    }

    // Determine pricing tier ID
    let pricingTierId: number | null = tierId;
    
    // If tierName is provided and not "Default Pricing", look up the tier
    if (tierName && tierName !== 'Default Pricing' && !tierId) {
      const [tier] = await db
        .select()
        .from(pricingTiers)
        .where(eq(pricingTiers.name, tierName))
        .limit(1);
      
      if (tier) {
        pricingTierId = tier.id;
      }
    }

    // Get department pricing - handle both default (null) and specific tier pricing
    const departmentConditions = [
      eq(productPricing.productKey, departmentKey),
      eq(productPricing.isActive, true)
    ];

    if (pricingTierId === null) {
      departmentConditions.push(isNull(productPricing.pricingTierId));
    } else {
      departmentConditions.push(eq(productPricing.pricingTierId, pricingTierId));
    }

    const [departmentProduct] = await db
      .select()
      .from(productPricing)
      .where(and(...departmentConditions))
      .limit(1);

    if (!departmentProduct) {
      return NextResponse.json(
        { error: 'Department product not found for the selected pricing tier' },
        { status: 404 }
      );
    }

    // Calculate total amount
    let totalAmount = parseFloat(departmentProduct.price);
    const lineItems = [
      {
        productKey: departmentProduct.productKey,
        productName: departmentProduct.productName,
        price: parseFloat(departmentProduct.price),
        quantity: 1,
        type: 'department'
      }
    ];

    // Add add-ons
    if (addOns.length > 0) {
      const addOnConditions = [eq(productPricing.isActive, true)];
      
      if (pricingTierId === null) {
        addOnConditions.push(isNull(productPricing.pricingTierId));
      } else {
        addOnConditions.push(eq(productPricing.pricingTierId, pricingTierId));
      }

      const addOnProducts = await db
        .select()
        .from(productPricing)
        .where(and(...addOnConditions));

      for (const addOnKey of addOns) {
        const addOn = addOnProducts.find(p => p.productKey === addOnKey);
        if (addOn) {
          const price = parseFloat(addOn.price);
          totalAmount += price;
          lineItems.push({
            productKey: addOn.productKey,
            productName: addOn.productName,
            price,
            quantity: 1,
            type: addOn.category
          });
        }
      }
    }

    // Apply voucher discount if provided
    let discount = 0;
    let voucherDetails = null;
    if (voucherCode) {
      // TODO: Validate voucher and calculate discount
      // For now, we'll skip voucher validation
    }

    const finalAmount = Math.max(0, totalAmount - discount);

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalAmount * 100), // Convert to cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: userId?.toString() || '',
        departmentKey,
        addOns: JSON.stringify(addOns),
        voucherCode: voucherCode || '',
        tierName: tierName || 'Default Pricing',
        tierId: pricingTierId?.toString() || 'null',
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: finalAmount,
      lineItems,
      discount,
      voucherDetails,
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent', details: error.message },
      { status: 500 }
    );
  }
}
