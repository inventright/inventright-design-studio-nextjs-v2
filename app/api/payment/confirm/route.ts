import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { payments, paymentLineItems } from '@/lib/db/schema';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentIntentId, jobId } = body;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment Intent ID is required' },
        { status: 400 }
      );
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not completed', status: paymentIntent.status },
        { status: 400 }
      );
    }

    // Get line items from metadata or calculate from payment intent
    const lineItemsData = JSON.parse(paymentIntent.metadata.lineItems || '[]');
    
    // Create payment transaction record
    const [transaction] = await db
      .insert(payments)
      .values({
        jobId: jobId || null,
        userId: parseInt(paymentIntent.metadata.userId) || null,
        stripePaymentIntentId: paymentIntent.id,
        stripeChargeId: paymentIntent.latest_charge as string || null,
        totalAmount: (paymentIntent.amount / 100).toString(), // Convert from cents
        subtotal: (paymentIntent.amount / 100).toString(),
        discountAmount: '0',
        currency: paymentIntent.currency.toUpperCase(),
        status: 'succeeded',
        voucherCode: paymentIntent.metadata.voucherCode || null,
        metadata: {
          departmentKey: paymentIntent.metadata.departmentKey,
          addOns: paymentIntent.metadata.addOns,
          tierName: paymentIntent.metadata.tierName,
        },
        paidAt: new Date(),
      } as any)
      .returning();

    // Create line item records
    if (lineItemsData.length > 0 && transaction) {
      const lineItemRecords = lineItemsData.map((item: any) => ({
        paymentId: transaction.id,
        productKey: item.productKey,
        productName: item.productName,
        quantity: item.quantity || 1,
        unitPrice: item.price.toString(),
        totalPrice: (item.price * (item.quantity || 1)).toString(),
        itemType: item.type,
      }));

      await db.insert(paymentLineItems).values(lineItemRecords as any);
    }

    return NextResponse.json({
      success: true,
      transaction,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
      },
    });
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    return NextResponse.json(
      { error: 'Failed to confirm payment', details: error.message },
      { status: 500 }
    );
  }
}
