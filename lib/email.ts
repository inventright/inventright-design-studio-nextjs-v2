import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Create email transporter using Gmail SMTP
 */
function createTransporter() {
  const emailFrom = process.env.EMAIL_FROM || 'support@inventright.com';
  const appPassword = process.env.GMAIL_APP_PASSWORD;

  if (!appPassword) {
    console.warn('[Email] GMAIL_APP_PASSWORD not configured, emails will be logged to console only');
  }

  // Remove spaces from app password (Google shows them with spaces but they should be removed)
  const cleanPassword = appPassword?.replace(/\s/g, '') || '';

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // use STARTTLS
    auth: {
      user: emailFrom,
      pass: cleanPassword,
    },
    logger: true,
    debug: true, // Enable debug output
  });

  return transporter;
}

/**
 * Send an email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const emailFrom = process.env.EMAIL_FROM || 'support@inventright.com';
  
  // If no SMTP password is configured, just log the email
  if (!process.env.GMAIL_APP_PASSWORD) {
    console.log('[Email] GMAIL_APP_PASSWORD not configured, logging email instead:');
    console.log('[Email] To:', options.to);
    console.log('[Email] Subject:', options.subject);
    console.log('[Email] HTML:', options.html.substring(0, 200) + '...');
    return true;
  }

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `inventRight Design Studio <${emailFrom}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    console.log('[Email] Attempting to send email to:', options.to);
    console.log('[Email] Using SMTP user:', emailFrom);
    
    const result = await transporter.sendMail(mailOptions);
    console.log('[Email] Email sent successfully:', result.messageId);
    return true;
  } catch (error: any) {
    console.error('[Email] Error sending email:', error);
    console.error('[Email] Error details:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
    });
    
    // Log the email content even if sending fails
    console.log('[Email] Failed to send to:', options.to);
    console.log('[Email] Subject:', options.subject);
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
