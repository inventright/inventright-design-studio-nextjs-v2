import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, body: emailBody } = body;

    if (!to || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, body' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Check environment variables
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
    const emailFrom = process.env.EMAIL_FROM;

    if (!serviceAccountEmail || !privateKey) {
      return NextResponse.json(
        { 
          error: 'Google service account not configured',
          details: 'GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY must be set in environment variables'
        },
        { status: 500 }
      );
    }

    console.log('[Email Test] Configuration:', {
      serviceAccount: serviceAccountEmail,
      from: emailFrom,
      to: to,
      hasPrivateKey: !!privateKey,
    });

    // Send the test email using service account
    try {
      const success = await sendEmail({
        to,
        subject: `[TEST] ${subject}`,
        html: emailBody,
      });

      if (success) {
        return NextResponse.json({
          success: true,
          message: `Test email sent to ${to}`,
        });
      } else {
        return NextResponse.json(
          { 
            error: 'Failed to send email',
            details: 'Check server logs for more information'
          },
          { status: 500 }
        );
      }
    } catch (sendError: any) {
      console.error('[Email Test] Failed to send email:', sendError);
      return NextResponse.json(
        { 
          error: 'Failed to send email',
          details: sendError.message,
          code: sendError.code,
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('[Email Test] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
