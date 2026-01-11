import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { voucherCodes } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-utils";
import { eq } from "drizzle-orm";

// GET /api/vouchers/[id] - Get single voucher
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const [voucher] = await db
      .select()
      .from(voucherCodes)
      .where(eq(voucherCodes.id, parseInt(id)));

    if (!voucher) {
      return NextResponse.json({ error: "Voucher not found" }, { status: 404 });
    }

    return NextResponse.json(voucher);
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json(
      { error: "Failed to fetch voucher" },
      { status: 500 }
    );
  }
}

// PUT /api/vouchers/[id] - Update voucher
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const updateData: any = {};
    if (body.code !== undefined) updateData.code = body.code;
    if (body.discountType !== undefined)
      updateData.discountType = body.discountType;
    if (body.discountValue !== undefined)
      updateData.discountValue = body.discountValue;
    if (body.maxUses !== undefined) updateData.maxUses = body.maxUses;
    if (body.validFrom !== undefined)
      updateData.validFrom = body.validFrom ? new Date(body.validFrom) : null;
    if (body.validUntil !== undefined)
      updateData.validUntil = body.validUntil
        ? new Date(body.validUntil)
        : null;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const [voucher] = await db
      .update(voucherCodes)
      .set(updateData)
      .where(eq(voucherCodes.id, parseInt(id)))
      .returning();

    if (!voucher) {
      return NextResponse.json({ error: "Voucher not found" }, { status: 404 });
    }

    return NextResponse.json(voucher);
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json(
      { error: "Failed to update voucher" },
      { status: 500 }
    );
  }
}

// DELETE /api/vouchers/[id] - Delete voucher
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    await db.delete(voucherCodes).where(eq(voucherCodes.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json(
      { error: "Failed to delete voucher" },
      { status: 500 }
    );
  }
}
