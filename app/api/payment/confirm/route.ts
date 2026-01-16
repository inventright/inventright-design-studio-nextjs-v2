import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { payments, paymentLineItems } from '@/lib/db/schema';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export async function POST(request: NextRequest) {
  let paymentIntentId = '';
  try {
    console.log('[Payment Confirm] Starting payment confirmation');
    const body = await request.json();
    const bodyData = body;
    paymentIntentId = bodyData.paymentIntentId;
    const jobId = bodyData.jobId;
    console.log('[Payment Confirm] Received:', { paymentIntentId, jobId });

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment Intent ID is required' },
        { status: 400 }
      );
    }

    // Retrieve payment intent from Stripe
    console.log('[Payment Confirm] Retrieving payment intent from Stripe...');
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log('[Payment Confirm] Payment intent retrieved:', paymentIntent.status);

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not completed', status: paymentIntent.status },
        { status: 400 }
      );
    }

    // Get line items from metadata - parse products string if lineItems not available
    console.log('[Payment Confirm] Parsing line items from metadata...');
    console.log('[Payment Confirm] Metadata:', paymentIntent.metadata);
    let lineItemsData = [];
    try {
      if (paymentIntent.metadata.lineItems) {
        lineItemsData = JSON.parse(paymentIntent.metadata.lineItems);
        console.log('[Payment Confirm] Parsed lineItems from metadata');
      } else if (paymentIntent.metadata.products) {
        console.log('[Payment Confirm] Parsing products string:', paymentIntent.metadata.products);
        // Parse products string like "Virtual Prototypes ($500), Rush Service ($100)"
        // This is a fallback - we'll create basic line items from the products string
        const productsStr = paymentIntent.metadata.products;
        const productItems = productsStr.split(', ');
        lineItemsData = productItems.map((item: string) => {
          const match = item.match(/^(.+?)\s*\(\$([\d.]+)\)$/);
          if (match) {
            return {
              productKey: paymentIntent.metadata.departmentKey || 'unknown',
              productName: match[1],
              price: parseFloat(match[2]),
              quantity: 1,
              type: 'product'
            };
          }
          return null;
        }).filter(Boolean);
      }
    } catch (e) {
      console.error('[Payment Confirm] Error parsing line items:', e);
      lineItemsData = [];
    }
    console.log('[Payment Confirm] Line items data:', lineItemsData);
    
    // Get receipt URL from charge
    console.log('[Payment Confirm] Retrieving receipt URL from charge...');
    let receiptUrl = null;
    if (paymentIntent.latest_charge) {
      try {
        const charge = await stripe.charges.retrieve(paymentIntent.latest_charge as string);
        receiptUrl = charge.receipt_url;
        console.log('[Payment Confirm] Receipt URL:', receiptUrl);
      } catch (error) {
        console.error('[Payment Confirm] Failed to retrieve receipt URL:', error);
      }
    }
    
    // Create payment transaction record
    console.log('[Payment Confirm] Creating payment transaction record...');
    const [transaction] = await db
      .insert(payments)
      .values({
        jobId: jobId || null,
        userId: parseInt(paymentIntent.metadata.userId) || null,
        stripePaymentIntentId: paymentIntent.id,
        stripeChargeId: paymentIntent.latest_charge as string || null,
        amount: (paymentIntent.amount / 100).toString(), // Convert from cents
        subtotal: (paymentIntent.amount / 100).toString(),
        discountAmount: '0',
        currency: paymentIntent.currency.toUpperCase(),
        status: 'succeeded',
        voucherCode: paymentIntent.metadata.voucherCode || null,
        metadata: {
          departmentKey: paymentIntent.metadata.departmentKey,
          addOns: paymentIntent.metadata.addOns,
          tierName: paymentIntent.metadata.tierName,
          receiptUrl: receiptUrl,
        },
        paidAt: new Date(),
      } as any)
      .returning();
    console.log('[Payment Confirm] Payment transaction created:', transaction?.id);

    // Create line item records
    if (lineItemsData.length > 0 && transaction) {
      console.log('[Payment Confirm] Creating line item records...');
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

    // Check if this is a Design Package purchase and create design package order
    if (paymentIntent.metadata.departmentKey === 'design_package' || paymentIntent.metadata.departmentName === 'Design Package') {
      console.log('[Payment Confirm] Creating design package order...');
      const { designPackageOrders } = await import('@/lib/db/schema');
      
      const [packageOrder] = await db
        .insert(designPackageOrders)
        .values({
          orderId: paymentIntent.id, // Use payment intent ID as order ID
          clientId: parseInt(paymentIntent.metadata.userId),
          purchaseDate: new Date(),
          virtualPrototypeStatus: 'not_started',
          sellSheetStatus: 'locked',
          packageStatus: 'active',
        } as any)
        .returning();
      
      console.log('[Payment Confirm] Design package order created:', packageOrder?.id);
      
      // Send email notification for Design Package purchase
      try {
        const { sendTestEmail } = await import('@/lib/email');
        const clientEmail = paymentIntent.metadata.customerEmail || paymentIntent.receipt_email;
        
        if (clientEmail) {
          const designPackageUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://ds.inventright.com'}/design-package/${paymentIntent.id}`;
          const emailBody = `
            <p>Thank you for purchasing the Design Package!</p>
            <p>Click the link below to get started with your Virtual Prototype:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${designPackageUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Access Your Design Package</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #2563eb;">${designPackageUrl}</p>
          `;
          
          await sendTestEmail(clientEmail, 'Your Design Package is Ready!', emailBody);
          console.log('[Payment Confirm] Design Package purchase email sent to:', clientEmail);
        }
      } catch (emailError) {
        console.error('[Payment Confirm] Failed to send Design Package email:', emailError);
        // Don't fail the payment confirmation if email fails
      }
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
    console.error('Error stack:', error.stack);
    console.error('Payment Intent ID:', paymentIntentId);
    return NextResponse.json(
      { 
        error: 'Failed to confirm payment', 
        details: error.message,
        stack: error.stack,
        paymentIntentId 
      },
      { status: 500 }
    );
  }
}
