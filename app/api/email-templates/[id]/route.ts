import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailTemplates } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-utils-flexible";
import { eq } from "drizzle-orm";

// GET /api/email-templates/[id] - Get single email template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, parseInt(id)));

    if (!template) {
      return NextResponse.json(
        { error: "Email template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json(
      { error: "Failed to fetch email template" },
      { status: 500 }
    );
  }
}

// PUT /api/email-templates/[id] - Update email template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.subject !== undefined) updateData.subject = body.subject;
    if (body.body !== undefined) updateData.body = body.body;
    if (body.triggerEvent !== undefined)
      updateData.triggerEvent = body.triggerEvent;
    if (body.departmentId !== undefined)
      updateData.departmentId = body.departmentId && body.departmentId !== "0" ? parseInt(body.departmentId) : null;
    if (body.recipientType !== undefined) updateData.recipientType = body.recipientType;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const [template] = await db
      .update(emailTemplates)
      .set(updateData)
      .where(eq(emailTemplates.id, parseInt(id)))
      .returning();

    if (!template) {
      return NextResponse.json(
        { error: "Email template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json(
      { error: "Failed to update email template" },
      { status: 500 }
    );
  }
}

// DELETE /api/email-templates/[id] - Delete email template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    await db.delete(emailTemplates).where(eq(emailTemplates.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json(
      { error: "Failed to delete email template" },
      { status: 500 }
    );
  }
}
