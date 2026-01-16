import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { productPricing, pricingTiers } from '@/lib/db/schema';
import { eq, and, isNull, or } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      departmentKey, 
      quantity = 1, // For Line Drawings
      addOns = [], // General add-ons (rush, extra revision, etc.)
      vpAddOns = {}, // Virtual Prototype specific add-ons
      voucherCode,
      userId,
      tierName = 'Default Pricing',
      tierId = null,
      customerName,
      customerEmail,
      customerPhone
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

    // Calculate department price (with quantity support for Line Drawings)
    let departmentPrice = parseFloat(departmentProduct.price);
    let actualQuantity = quantity;

    // Handle quantity-based pricing (e.g., Line Drawings)
    if (departmentProduct.minimumQuantity && quantity > 0) {
      const minQty = departmentProduct.minimumQuantity;
      const minPrice = departmentProduct.minimumPrice 
        ? parseFloat(departmentProduct.minimumPrice) 
        : parseFloat(departmentProduct.price);
      const perUnit = departmentProduct.perUnitPrice 
        ? parseFloat(departmentProduct.perUnitPrice) 
        : 0;
      const maxQty = departmentProduct.maximumQuantity || 999;

      actualQuantity = Math.min(quantity, maxQty);

      if (actualQuantity <= minQty) {
        departmentPrice = minPrice;
      } else {
        const additionalUnits = actualQuantity - minQty;
        departmentPrice = minPrice + (additionalUnits * perUnit);
      }
    }

    let totalAmount = departmentPrice;
    const lineItems = [
      {
        productKey: departmentProduct.productKey,
        productName: departmentProduct.productName,
        price: departmentPrice,
        quantity: actualQuantity,
        type: 'department'
      }
    ];

    // Get all products for this tier (for add-ons and VP add-ons)
    const productConditions = [eq(productPricing.isActive, true)];
    
    if (pricingTierId === null) {
      productConditions.push(isNull(productPricing.pricingTierId));
    } else {
      productConditions.push(eq(productPricing.pricingTierId, pricingTierId));
    }

    const allProducts = await db
      .select()
      .from(productPricing)
      .where(and(...productConditions));

    // Add general add-ons (rush, extra revision, source files, etc.)
    if (addOns.length > 0) {
      for (const addOnKey of addOns) {
        const addOn = allProducts.find(p => p.productKey === addOnKey);
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

    // Add Virtual Prototype specific add-ons
    if (vpAddOns && Object.keys(vpAddOns).length > 0) {
      // AR Upgrade
      if (vpAddOns.arUpgrade) {
        const arUpgrade = allProducts.find(p => p.productKey === 'vp_ar_upgrade');
        if (arUpgrade) {
          const price = parseFloat(arUpgrade.price);
          totalAmount += price;
          lineItems.push({
            productKey: arUpgrade.productKey,
            productName: arUpgrade.productName,
            price,
            quantity: 1,
            type: 'addon'
          });
        }
      }

      // AR Virtual Prototype
      if (vpAddOns.arVirtualPrototype) {
        const arVP = allProducts.find(p => p.productKey === 'vp_ar_virtual_prototype');
        if (arVP) {
          const price = parseFloat(arVP.price);
          totalAmount += price;
          lineItems.push({
            productKey: arVP.productKey,
            productName: arVP.productName,
            price,
            quantity: 1,
            type: 'addon'
          });
        }
      }

      // Animated Video
      if (vpAddOns.animatedVideo) {
        let animatedKey = '';
        if (vpAddOns.animatedVideo === 'rotation') {
          animatedKey = 'vp_animated_rotation';
        } else if (vpAddOns.animatedVideo === 'exploded') {
          animatedKey = 'vp_animated_exploded';
        } else if (vpAddOns.animatedVideo === 'both') {
          animatedKey = 'vp_animated_both';
        }

        if (animatedKey) {
          const animated = allProducts.find(p => p.productKey === animatedKey);
          if (animated) {
            const price = parseFloat(animated.price);
            totalAmount += price;
            lineItems.push({
              productKey: animated.productKey,
              productName: animated.productName,
              price,
              quantity: 1,
              type: 'addon'
            });
          }
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
      description: `${departmentProduct.productName} - ${customerName || 'Customer'}`,
      receipt_email: customerEmail || undefined,
      shipping: customerName ? {
        name: customerName,
        phone: customerPhone || undefined,
        address: {
          line1: 'N/A',
          city: 'N/A',
          state: 'N/A',
          postal_code: '00000',
          country: 'US',
        },
      } : undefined,
      metadata: {
        userId: userId?.toString() || '',
        customerName: customerName || '',
        customerEmail: customerEmail || '',
        customerPhone: customerPhone || '',
        departmentKey,
        departmentName: departmentProduct.productName,
        quantity: actualQuantity.toString(),
        products: lineItems.map(item => `${item.productName} ($${item.price})`).join(', '),
        addOns: JSON.stringify(addOns),
        vpAddOns: JSON.stringify(vpAddOns),
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
