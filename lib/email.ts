import { google } from 'googleapis';
import { db } from '@/lib/db';
import { emailLogs } from '@/lib/db/schema';

const getGmailClient = () => {
  // Decode Base64 encoded service account credentials
  const credentials = JSON.parse(
    Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64!, 'base64').toString('utf-8')
  );

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
    subject: 'support@inventright.com', // Impersonate this user
  });

  return google.gmail({ version: 'v1', auth });
};

async function logEmail(
  recipient: string,
  subject: string,
  body: string,
  status: 'sent' | 'failed',
  errorMessage?: string,
  metadata?: any
) {
  try {
    await db.insert(emailLogs).values({
      recipient,
      subject,
      body,
      status,
      errorMessage,
      metadata: metadata ? JSON.stringify(metadata) : null,
    } as any);
  } catch (error) {
    console.error('[Email] Failed to log email:', error);
  }
}

export async function sendPasswordSetupEmail(to: string, token: string) {
  const setupUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://ds.inventright.com'}/setup-password?token=${token}&email=${encodeURIComponent(to)}`;
  const subject = 'Set Up Your inventRight Design Studio Password';
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 30px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to inventRight Design Studio</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>An account has been created for you on inventRight Design Studio. Please click the button below to set up your password and access your account.</p>
          <div style="text-align: center;">
            <a href="${setupUrl}" class="button">Set Up My Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2563eb;">${setupUrl}</p>
          <p><strong>This link will expire in 24 hours.</strong></p>
          <p>If you didn't expect this email, please ignore it.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} inventRight. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const messageParts = [
    'From: support@inventright.com',
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    htmlBody,
  ];

  const message = messageParts.join('\n');
  
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  try {
    const gmail = getGmailClient();
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log('[Email] Password setup email sent successfully:', response.data);
    
    // Log successful email
    await logEmail(to, subject, htmlBody, 'sent', undefined, { 
      type: 'password_setup',
      token: token.substring(0, 10) + '...',
      setupUrl 
    });
    
    return response.data;
  } catch (error) {
    console.error('[Email] Failed to send password setup email:', error);
    
    // Log failed email
    await logEmail(to, subject, htmlBody, 'failed', error instanceof Error ? error.message : 'Unknown error', {
      type: 'password_setup',
      token: token.substring(0, 10) + '...',
      setupUrl
    });
    
    throw error;
  }
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const gmail = getGmailClient();
  
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://ds.inventright.com'}/reset-password?token=${token}&email=${encodeURIComponent(to)}`;
  const subject = 'Reset Your inventRight Design Studio Password';
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 30px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reset Your Password</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>We received a request to reset your password for your inventRight Design Studio account. Click the button below to create a new password.</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset My Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
          <p><strong>This link will expire in 24 hours.</strong></p>
          <p>If you didn't request a password reset, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} inventRight. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const messageParts = [
    'From: support@inventright.com',
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    htmlBody,
  ];

  const message = messageParts.join('\n');
  
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  try {
    const gmail = getGmailClient();
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log('[Email] Password reset email sent successfully:', response.data);
    
    // Log successful email
    await logEmail(to, subject, htmlBody, 'sent', undefined, {
      type: 'password_reset',
      token: token.substring(0, 10) + '...',
      resetUrl
    });
    
    return response.data;
  } catch (error) {
    console.error('[Email] Failed to send password reset email:', error);
    
    // Log failed email
    await logEmail(to, subject, htmlBody, 'failed', error instanceof Error ? error.message : 'Unknown error', {
      type: 'password_reset',
      token: token.substring(0, 10) + '...',
      resetUrl
    });
    
    throw error;
  }
}

export async function sendTestEmail(to: string, subject: string, body: string) {
  const gmail = getGmailClient();
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 30px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>inventRight Design Studio</h1>
        </div>
        <div class="content">
          ${body}
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} inventRight. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const fullSubject = `[TEST] ${subject}`;
  
  const messageParts = [
    'From: support@inventright.com',
    `To: ${to}`,
    `Subject: ${fullSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    htmlBody,
  ];

  const message = messageParts.join('\n');
  
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  try {
    const gmail = getGmailClient();
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log('[Email] Test email sent successfully:', response.data);
    
    // Log successful email
    await logEmail(to, fullSubject, htmlBody, 'sent', undefined, {
      type: 'test',
      originalSubject: subject,
      originalBody: body
    });
    
    return response.data;
  } catch (error) {
    console.error('[Email] Failed to send test email:', error);
    
    // Log failed email
    await logEmail(to, fullSubject, htmlBody, 'failed', error instanceof Error ? error.message : 'Unknown error', {
      type: 'test',
      originalSubject: subject,
      originalBody: body
    });
    
    throw error;
  }
}
