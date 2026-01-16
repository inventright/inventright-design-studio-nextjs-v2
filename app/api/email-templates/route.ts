import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailTemplates } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-utils-flexible";
import { eq, asc } from "drizzle-orm";

// GET /api/email-templates - Get all email templates
export async function GET() {
  try {
    await requireAdmin();

    const templates = await db.select().from(emailTemplates).orderBy(asc(emailTemplates.name));

    return NextResponse.json(templates);
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json(
      { error: "Failed to fetch email templates" },
      { status: 500 }
    );
  }
}

// POST /api/email-templates - Create new email template
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { name, subject, body: templateBody, triggerEvent, departmentId, isActive } = body;

    if (!name || !subject || !templateBody) {
      return NextResponse.json(
        { error: "Name, subject, and body are required" },
        { status: 400 }
      );
    }

    const [template] = await db
      .insert(emailTemplates)
      .values({
        name,
        subject,
        body: templateBody,
        triggerEvent: triggerEvent || null,
        departmentId: departmentId ? parseInt(departmentId) : null,
        isActive: isActive !== undefined ? isActive : true,
      })
      .returning();

    return NextResponse.json(template, { status: 201 });
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json(
      { error: "Failed to create email template" },
      { status: 500 }
    );
  }
}
