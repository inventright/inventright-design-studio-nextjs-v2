import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { voucherCodes, voucherUsage } from "@/lib/db/schema";
import { requireAdmin, getCurrentUser } from "@/lib/auth-utils";
import { eq, and, count } from "drizzle-orm";

// GET /api/vouchers - Get all vouchers (admin) or validate voucher (public)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");

    // If code is provided, validate it (public endpoint)
    if (code) {
      const [voucher] = await db
        .select()
        .from(voucherCodes)
        .where(eq(voucherCodes.code, code));

      if (!voucher || !voucher.isActive) {
        return NextResponse.json(
          { valid: false, message: "Invalid voucher code" },
          { status: 404 }
        );
      }

      const now = new Date();
      if (voucher.validFrom && new Date(voucher.validFrom) > now) {
        return NextResponse.json(
          { valid: false, message: "Voucher not yet valid" },
          { status: 400 }
        );
      }

      if (voucher.validUntil && new Date(voucher.validUntil) < now) {
        return NextResponse.json(
          { valid: false, message: "Voucher has expired" },
          { status: 400 }
        );
      }

      if (voucher.maxUses && voucher.usedCount >= voucher.maxUses) {
        return NextResponse.json(
          { valid: false, message: "Voucher usage limit reached" },
          { status: 400 }
        );
      }

      // Check usage per user if authenticated
      const user = await getCurrentUser();
      if (user) {
        const [usageCount] = await db
          .select({ count: count() })
          .from(voucherUsage)
          .where(
            and(
              eq(voucherUsage.voucherId, voucher.id),
              eq(voucherUsage.userId, parseInt((user as any).id))
            )
          );

        // If voucher has maxUses, check if user has already used it
        if (voucher.maxUses && usageCount.count > 0) {
          return NextResponse.json(
            { valid: false, message: "You have already used this voucher" },
            { status: 400 }
          );
        }
      }

      return NextResponse.json({
        valid: true,
        voucher: {
          code: voucher.code,
          discountType: voucher.discountType,
          discountValue: voucher.discountValue,
        },
      });
    }

    // Admin: Get all vouchers
    await requireAdmin();

    const vouchers = await db.select().from(voucherCodes);

    return NextResponse.json(vouchers);
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json(
      { error: "Failed to fetch vouchers" },
      { status: 500 }
    );
  }
}

// POST /api/vouchers - Create new voucher
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const {
      code,
      discountType,
      discountValue,
      maxUses,
      validFrom,
      validUntil,
      isActive,
    } = body;

    if (!code || !discountType || !discountValue) {
      return NextResponse.json(
        { error: "Code, discount type, and discount value are required" },
        { status: 400 }
      );
    }

    const [voucher] = await db
      .insert(voucherCodes)
      .values({
        code,
        discountType,
        discountValue,
        maxUses: maxUses || null,
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        isActive: isActive !== undefined ? isActive : true,
        usedCount: 0,
      })
      .returning();

    return NextResponse.json(voucher, { status: 201 });
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json(
      { error: "Failed to create voucher" },
      { status: 500 }
    );
  }
}
