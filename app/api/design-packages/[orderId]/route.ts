import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { designPackageOrders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET - Fetch design package by order ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    const packages = await db
      .select()
      .from(designPackageOrders)
      .where(eq(designPackageOrders.orderId, orderId))
      .limit(1);

    if (packages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Design package not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      package: packages[0]
    });
  } catch (error) {
    console.error('[Design Package API] Error fetching package:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch design package' },
      { status: 500 }
    );
  }
}

// PATCH - Update design package status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await request.json();

    const updateData: any = {
      updatedAt: new Date()
    };

    // Update virtual prototype status
    if (body.virtualPrototypeStatus) {
      updateData.virtualPrototypeStatus = body.virtualPrototypeStatus;
      if (body.virtualPrototypeStatus === 'completed') {
        updateData.virtualPrototypeCompletedAt = new Date();
        updateData.sellSheetStatus = 'not_started'; // Unlock sell sheet
        
        // Send email notification for Virtual Prototype completion
        try {
          const { sendTestEmail } = await import('@/lib/email');
          const { users } = await import('@/lib/db/schema');
          
          // Get client email
          const packageData = await db
            .select()
            .from(designPackageOrders)
            .where(eq(designPackageOrders.orderId, orderId))
            .limit(1);
          
          if (packageData.length > 0 && packageData[0].clientId) {
            const clientData = await db
              .select()
              .from(users)
              .where(eq(users.id, packageData[0].clientId))
              .limit(1);
            
            if (clientData.length > 0 && clientData[0].email) {
              const designPackageUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://ds.inventright.com'}/design-package/${orderId}`;
              const emailBody = `
                <p>Great news! Your Virtual Prototype is complete.</p>
                <p>You can now start your Sell Sheet:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${designPackageUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Start Sell Sheet</a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #2563eb;">${designPackageUrl}</p>
              `;
              
              await sendTestEmail(clientData[0].email, 'Virtual Prototype Complete - Start Your Sell Sheet', emailBody);
              console.log('[Design Package API] VP completion email sent to:', clientData[0].email);
            }
          }
        } catch (emailError) {
          console.error('[Design Package API] Failed to send VP completion email:', emailError);
        }
      }
    }

    if (body.virtualPrototypeJobId) {
      updateData.virtualPrototypeJobId = body.virtualPrototypeJobId;
    }

    // Update sell sheet status
    if (body.sellSheetStatus) {
      updateData.sellSheetStatus = body.sellSheetStatus;
      if (body.sellSheetStatus === 'completed') {
        updateData.sellSheetCompletedAt = new Date();
        updateData.packageStatus = 'completed'; // Mark package as completed
        
        // Send email notification for Design Package completion
        try {
          const { sendTestEmail } = await import('@/lib/email');
          const { users } = await import('@/lib/db/schema');
          
          // Get client email
          const packageData = await db
            .select()
            .from(designPackageOrders)
            .where(eq(designPackageOrders.orderId, orderId))
            .limit(1);
          
          if (packageData.length > 0 && packageData[0].clientId) {
            const clientData = await db
              .select()
              .from(users)
              .where(eq(users.id, packageData[0].clientId))
              .limit(1);
            
            if (clientData.length > 0 && clientData[0].email) {
              const designPackageUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://ds.inventright.com'}/design-package/${orderId}`;
              const emailBody = `
                <p>Congratulations! Your Design Package is complete.</p>
                <p>Both your Virtual Prototype and Sell Sheet are ready.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${designPackageUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">View Your Design Package</a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #2563eb;">${designPackageUrl}</p>
              `;
              
              await sendTestEmail(clientData[0].email, 'Design Package Complete!', emailBody);
              console.log('[Design Package API] Package completion email sent to:', clientData[0].email);
            }
          }
        } catch (emailError) {
          console.error('[Design Package API] Failed to send package completion email:', emailError);
        }
      }
    }

    if (body.sellSheetJobId) {
      updateData.sellSheetJobId = body.sellSheetJobId;
    }

    const [updatedPackage] = await db
      .update(designPackageOrders)
      .set(updateData)
      .where(eq(designPackageOrders.orderId, orderId))
      .returning();

    return NextResponse.json({
      success: true,
      package: updatedPackage
    });
  } catch (error) {
    console.error('[Design Package API] Error updating package:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update design package' },
      { status: 500 }
    );
  }
}
