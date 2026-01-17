import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobExtraContacts, users } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-utils-flexible";
import { eq, and } from "drizzle-orm";

// GET /api/jobs/[jobId]/extra-contacts - Get all extra contacts for a job
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await requireAuth();
    const { jobId } = await params;

    // Get extra contacts with user details
    const contacts = await db
      .select({
        id: jobExtraContacts.id,
        jobId: jobExtraContacts.jobId,
        userId: jobExtraContacts.userId,
        userName: users.name,
        userEmail: users.email,
        userRole: users.role,
        createdAt: jobExtraContacts.createdAt,
      })
      .from(jobExtraContacts)
      .leftJoin(users, eq(jobExtraContacts.userId, users.id))
      .where(eq(jobExtraContacts.jobId, parseInt(jobId)));

    return NextResponse.json(contacts);
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("Error fetching extra contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch extra contacts" },
      { status: 500 }
    );
  }
}

// POST /api/jobs/[jobId]/extra-contacts - Add an extra contact to a job
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await requireAuth();
    const { jobId } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if user has permission (only managers, designers, and admins)
    if (!["manager", "designer", "admin"].includes(user.role)) {
      return NextResponse.json(
        { error: "You don't have permission to add extra contacts" },
        { status: 403 }
      );
    }

    // Check if contact already exists
    const existing = await db
      .select()
      .from(jobExtraContacts)
      .where(
        and(
          eq(jobExtraContacts.jobId, parseInt(jobId)),
          eq(jobExtraContacts.userId, parseInt(userId))
        )
      );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "This contact is already added to the job" },
        { status: 400 }
      );
    }

    // Add the extra contact
    const [contact] = await db
      .insert(jobExtraContacts)
      .values({
        jobId: parseInt(jobId),
        userId: parseInt(userId),
        addedBy: user.id,
      })
      .returning();

    // Get the full contact details
    const [fullContact] = await db
      .select({
        id: jobExtraContacts.id,
        jobId: jobExtraContacts.jobId,
        userId: jobExtraContacts.userId,
        userName: users.name,
        userEmail: users.email,
        userRole: users.role,
        createdAt: jobExtraContacts.createdAt,
      })
      .from(jobExtraContacts)
      .leftJoin(users, eq(jobExtraContacts.userId, users.id))
      .where(eq(jobExtraContacts.id, contact.id));

    return NextResponse.json(fullContact, { status: 201 });
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("Error adding extra contact:", error);
    return NextResponse.json(
      { error: "Failed to add extra contact" },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/[jobId]/extra-contacts/[contactId] - Remove an extra contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await requireAuth();
    const { jobId } = await params;
    const url = new URL(request.url);
    const contactId = url.searchParams.get("contactId");

    if (!contactId) {
      return NextResponse.json(
        { error: "Contact ID is required" },
        { status: 400 }
      );
    }

    // Check if user has permission (only managers, designers, and admins)
    if (!["manager", "designer", "admin"].includes(user.role)) {
      return NextResponse.json(
        { error: "You don't have permission to remove extra contacts" },
        { status: 403 }
      );
    }

    await db
      .delete(jobExtraContacts)
      .where(
        and(
          eq(jobExtraContacts.id, parseInt(contactId)),
          eq(jobExtraContacts.jobId, parseInt(jobId))
        )
      );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("Error removing extra contact:", error);
    return NextResponse.json(
      { error: "Failed to remove extra contact" },
      { status: 500 }
    );
  }
}
