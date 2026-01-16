import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payments, paymentLineItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobId = parseInt(id);

    if (isNaN(jobId)) {
      return NextResponse.json(
        { error: 'Invalid job ID' },
        { status: 400 }
      );
    }

    // Get payment for this job
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.jobId, jobId))
      .limit(1);

    if (!payment) {
      return NextResponse.json(
        { error: 'No payment found for this job' },
        { status: 404 }
      );
    }

    // Get line items for this payment
    const lineItems = await db
      .select()
      .from(paymentLineItems)
      .where(eq(paymentLineItems.paymentId, payment.id));

    return NextResponse.json({
      payment,
      lineItems,
    });
  } catch (error: any) {
    console.error('Error fetching payment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment', details: error.message },
      { status: 500 }
    );
  }
}
