import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-utils-flexible";
import { eq, like, or, desc } from "drizzle-orm";

// GET /api/admin/users - List all users (admin only)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const loginMethod = searchParams.get("loginMethod") || "";

    let query = db.select().from(users);

    // Apply filters
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          like(users.name, `%${search}%`),
          like(users.email, `%${search}%`)
        )
      );
    }
    
    if (role) {
      conditions.push(eq(users.role, role as any));
    }
    
    if (loginMethod) {
      conditions.push(eq(users.loginMethod, loginMethod));
    }

    if (conditions.length > 0) {
      query = query.where(conditions[0]) as any;
    }

    const allUsers = await query.orderBy(desc(users.createdAt));

    return NextResponse.json({
      success: true,
      users: allUsers,
      count: allUsers.length,
    });
  } catch (error: any) {
    console.error("[Admin Users API] Error:", error);
    
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "Unauthorized" ? 401 : 403 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
