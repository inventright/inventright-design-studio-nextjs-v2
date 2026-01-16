import { NextRequest, NextResponse } from 'next/server';
import { sendTestEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { error, errorInfo, url, userAgent, timestamp } = body;

    // Get user information if available
    const userEmail = request.headers.get('x-user-email') || 'Unknown';
    const userId = request.headers.get('x-user-id') || 'Unknown';

    // Format error details for email
    const errorDetails = `
      <h2>Error Report from InventRight Design Studio</h2>
      
      <h3>Error Information:</h3>
      <ul>
        <li><strong>Error Name:</strong> ${error.name}</li>
        <li><strong>Error Message:</strong> ${error.message}</li>
        <li><strong>Timestamp:</strong> ${new Date(timestamp).toLocaleString()}</li>
      </ul>

      <h3>Page Information:</h3>
      <ul>
        <li><strong>URL:</strong> ${url}</li>
        <li><strong>User Agent:</strong> ${userAgent}</li>
      </ul>

      <h3>User Information:</h3>
      <ul>
        <li><strong>User ID:</strong> ${userId}</li>
        <li><strong>User Email:</strong> ${userEmail}</li>
      </ul>

      <h3>Stack Trace:</h3>
      <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto;">
${error.stack || 'No stack trace available'}
      </pre>

      ${errorInfo ? `
      <h3>Component Stack:</h3>
      <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto;">
${errorInfo}
      </pre>
      ` : ''}

      <hr style="margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        This error was automatically reported by the InventRight Design Studio error handling system.
      </p>
    `;

    // Send email to support
    await sendTestEmail(
      'james@inventright.com',
      `[Error Report] ${error.name}: ${error.message.substring(0, 50)}...`,
      errorDetails
    );

    return NextResponse.json({
      success: true,
      message: 'Error report sent successfully',
    });
  } catch (err) {
    console.error('Failed to send error report:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send error report',
      },
      { status: 500 }
    );
  }
}
