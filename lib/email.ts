import { google } from 'googleapis';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using Gmail API with service account
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const emailFrom = process.env.EMAIL_FROM || 'support@inventright.com';

  if (!serviceAccountEmail || !privateKey) {
    console.error('[Email] Google service account credentials not configured');
    return false;
  }

  try {
    // Create JWT client for service account
    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: [
        'https://www.googleapis.com/auth/gmail.send',
      ],
      subject: emailFrom, // Impersonate this email (requires domain-wide delegation)
    });

    // Initialize Gmail API
    const gmail = google.gmail({ version: 'v1', auth });

    // Create email message in RFC 2822 format
    const messageParts = [
      `From: inventRight Design Studio <${emailFrom}>`,
      `To: ${options.to}`,
      `Subject: ${options.subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      options.html,
    ];
    
    const message = messageParts.join('\n');
    
    // Encode message in base64url format
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send email via Gmail API
    console.log('[Email] Attempting to send email to:', options.to);
    console.log('[Email] Using service account:', serviceAccountEmail);
    console.log('[Email] Impersonating:', emailFrom);
    
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log('[Email] Email sent successfully:', result.data.id);
    return true;
  } catch (error: any) {
    console.error('[Email] Error sending email:', error);
    console.error('[Email] Error details:', {
      message: error.message,
      code: error.code,
      errors: error.errors,
      response: error.response?.data,
    });
    
    // Provide helpful error messages
    if (error.message?.includes('delegation')) {
      console.error('[Email] Domain-wide delegation is not enabled for this service account');
      console.error('[Email] Please enable it in Google Workspace Admin Console');
    }
    
    return false;
  }
}

/**
 * Send password setup link email
 */
export async function sendPasswordSetupEmail(
  email: string,
  name: string,
  setupLink: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #007aff 0%, #0051d5 100%);
          color: white;
          padding: 30px;
          border-radius: 10px 10px 0 0;
          text-align: center;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .button {
          display: inline-block;
          background: #007aff;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 8px;
          margin: 20px 0;
          font-weight: 600;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Welcome to inventRight Design Studio!</h1>
      </div>
      <div class="content">
        <p>Hi ${name},</p>
        
        <p>Your account has been created for the inventRight Design Studio. To get started, you'll need to set up your password.</p>
        
        <p>Click the button below to create your password and access your account:</p>
        
        <div style="text-align: center;">
          <a href="${setupLink}" class="button">Set Up My Password</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #007aff;">${setupLink}</p>
        
        <p><strong>This link will expire in 24 hours</strong> for security reasons.</p>
        
        <p>If you didn't request this account, please ignore this email or contact us if you have concerns.</p>
        
        <p>Best regards,<br>The inventRight Design Studio Team</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} inventRight, LLC. All rights reserved.</p>
        <p>This is an automated message, please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Set Up Your Password - inventRight Design Studio',
    html,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetLink: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #007aff 0%, #0051d5 100%);
          color: white;
          padding: 30px;
          border-radius: 10px 10px 0 0;
          text-align: center;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .button {
          display: inline-block;
          background: #007aff;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 8px;
          margin: 20px 0;
          font-weight: 600;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Password Reset Request</h1>
      </div>
      <div class="content">
        <p>Hi ${name},</p>
        
        <p>We received a request to reset your password for your inventRight Design Studio account.</p>
        
        <p>Click the button below to reset your password:</p>
        
        <div style="text-align: center;">
          <a href="${resetLink}" class="button">Reset My Password</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #007aff;">${resetLink}</p>
        
        <p><strong>This link will expire in 1 hour</strong> for security reasons.</p>
        
        <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
        
        <p>Best regards,<br>The inventRight Design Studio Team</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} inventRight, LLC. All rights reserved.</p>
        <p>This is an automated message, please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset Your Password - inventRight Design Studio',
    html,
  });
}
