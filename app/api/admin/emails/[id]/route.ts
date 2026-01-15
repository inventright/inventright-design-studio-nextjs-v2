import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { google } from 'googleapis';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const emailId = parseInt(id);
    await db.delete(emailLogs).where(eq(emailLogs.id, emailId));
    return NextResponse.json({ success: true, message: 'Email log deleted successfully' });
  } catch (error) {
    console.error('[Email Logs API] Error deleting log:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete email log' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const emailId = parseInt(id);
    const [originalEmail] = await db.select().from(emailLogs).where(eq(emailLogs.id, emailId)).limit(1);
    if (!originalEmail) {
      return NextResponse.json({ success: false, error: 'Email log not found' }, { status: 404 });
    }
    const credentials = JSON.parse(Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64!, 'base64').toString('utf-8'));
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/gmail.send'],
      subject: 'support@inventright.com',
    });
    const gmail = google.gmail({ version: 'v1', auth });
    const messageParts = ['From: support@inventright.com', `To: ${originalEmail.recipient}`, `Subject: ${originalEmail.subject}`, 'MIME-Version: 1.0', 'Content-Type: text/html; charset=utf-8', '', originalEmail.body];
    const message = messageParts.join('\n');
    const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    await gmail.users.messages.send({ userId: 'me', requestBody: { raw: encodedMessage } });
    const newLogs = await db.insert(emailLogs).values({ recipient: originalEmail.recipient, subject: originalEmail.subject, body: originalEmail.body, status: 'sent', resentFrom: emailId, metadata: originalEmail.metadata } as any).returning() as any[];
    return NextResponse.json({ success: true, message: 'Email resent successfully', log: newLogs[0] });
  } catch (error) {
    console.error('[Email Logs API] Error resending email:', error);
    return NextResponse.json({ success: false, error: 'Failed to resend email' }, { status: 500 });
  }
}
