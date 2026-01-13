import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

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
    const emailFrom = process.env.EMAIL_FROM || 'support@inventright.com';
    const appPassword = process.env.GMAIL_APP_PASSWORD;

    if (!appPassword) {
      return NextResponse.json(
        { 
          error: 'GMAIL_APP_PASSWORD not configured in environment variables',
          details: 'Please add GMAIL_APP_PASSWORD to your Vercel environment variables'
        },
        { status: 500 }
      );
    }

    // Remove spaces from app password
    const cleanPassword = appPassword.replace(/\s/g, '');

    console.log('[Email Test] Configuration:', {
      from: emailFrom,
      to: to,
      hasPassword: !!cleanPassword,
      passwordLength: cleanPassword.length,
    });

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // use STARTTLS
      auth: {
        user: emailFrom,
        pass: cleanPassword,
      },
      logger: true,
      debug: true,
    });

    // Verify connection
    try {
      await transporter.verify();
      console.log('[Email Test] SMTP connection verified successfully');
    } catch (verifyError: any) {
      console.error('[Email Test] SMTP verification failed:', verifyError);
      return NextResponse.json(
        { 
          error: 'SMTP connection failed',
          details: verifyError.message,
          code: verifyError.code,
          command: verifyError.command,
        },
        { status: 500 }
      );
    }

    // Send email
    const mailOptions = {
      from: `inventRight Design Studio <${emailFrom}>`,
      to: to,
      subject: `[TEST] ${subject}`,
      html: emailBody,
      text: emailBody.replace(/<[^>]*>/g, ''),
    };

    try {
      const result = await transporter.sendMail(mailOptions);
      console.log('[Email Test] Email sent successfully:', result.messageId);
      
      return NextResponse.json({
        success: true,
        message: `Test email sent to ${to}`,
        messageId: result.messageId,
      });
    } catch (sendError: any) {
      console.error('[Email Test] Failed to send email:', sendError);
      return NextResponse.json(
        { 
          error: 'Failed to send email',
          details: sendError.message,
          code: sendError.code,
          command: sendError.command,
          response: sendError.response,
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
