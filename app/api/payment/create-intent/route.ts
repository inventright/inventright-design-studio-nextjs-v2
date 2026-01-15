import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { productPricing, pricingTiers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      departmentKey, 
      addOns = [],
      voucherCode,
      userId,
      tierName = 'Default Pricing'
    } = body;

    if (!departmentKey) {
      return NextResponse.json(
        { error: 'Department is required' },
        { status: 400 }
      );
    }

    // Get pricing tier
    const [tier] = await db
      .select()
      .from(pricingTiers)
      .where(eq(pricingTiers.name, tierName))
      .limit(1);

    if (!tier) {
      return NextResponse.json(
        { error: 'Pricing tier not found' },
        { status: 404 }
      );
    }

    // Get department pricing
    const [departmentProduct] = await db
      .select()
      .from(productPricing)
      .where(
        and(
          eq(productPricing.productKey, departmentKey),
          eq(productPricing.tierId, tier.id),
          eq(productPricing.isActive, true)
        )
      )
      .limit(1);

    if (!departmentProduct) {
      return NextResponse.json(
        { error: 'Department product not found' },
        { status: 404 }
      );
    }

    // Calculate total amount
    let totalAmount = parseFloat(departmentProduct.basePrice);
    const lineItems = [
      {
        productKey: departmentProduct.productKey,
        productName: departmentProduct.productName,
        price: parseFloat(departmentProduct.basePrice),
        quantity: 1,
        type: 'department'
      }
    ];

    // Add add-ons
    if (addOns.length > 0) {
      const addOnProducts = await db
        .select()
        .from(productPricing)
        .where(
          and(
            eq(productPricing.tierId, tier.id),
            eq(productPricing.isActive, true)
          )
        );

      for (const addOnKey of addOns) {
        const addOn = addOnProducts.find(p => p.productKey === addOnKey);
        if (addOn) {
          const price = parseFloat(addOn.basePrice);
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
        tierName,
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
