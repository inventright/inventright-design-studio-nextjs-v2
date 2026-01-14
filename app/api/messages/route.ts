import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages, users } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-utils-flexible";
import { eq, desc } from "drizzle-orm";

// GET /api/messages?jobId=123 - Get all messages for a job
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    // Get messages with user information
    const jobMessages = await db
      .select({
        id: messages.id,
        jobId: messages.jobId,
        userId: messages.userId,
        content: messages.content,
        isInternal: messages.isInternal,
        createdAt: messages.createdAt,
        updatedAt: messages.updatedAt,
        userName: users.name,
        userEmail: users.email,
        userRole: users.role,
      })
      .from(messages)
      .leftJoin(users, eq(messages.userId, users.id))
      .where(eq(messages.jobId, parseInt(jobId)))
      .orderBy(desc(messages.createdAt));

    return NextResponse.json(jobMessages);
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST /api/messages - Create a new message
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { jobId, content, isInternal = false } = body;

    if (!jobId || !content) {
      return NextResponse.json(
        { error: "Job ID and content required" },
        { status: 400 }
      );
    }

    const userId = parseInt((user as any).id);

    const [newMessage] = await db
      .insert(messages)
      .values({
        jobId: parseInt(jobId),
        userId,
        content,
        isInternal,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Get user info for the response
    const [userInfo] = await db
      .select({
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return NextResponse.json({
      ...newMessage,
      userName: userInfo?.name,
      userEmail: userInfo?.email,
      userRole: userInfo?.role,
    });
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}
