import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { voucherCodes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const inputParam = searchParams.get('input');
    
    if (!inputParam) {
      return NextResponse.json({
        result: {
          data: {
            valid: false,
            message: 'Voucher code is required'
          }
        }
      });
    }

    const input = JSON.parse(inputParam);
    const code = input.code?.trim().toUpperCase();

    if (!code) {
      return NextResponse.json({
        result: {
          data: {
            valid: false,
            message: 'Voucher code is required'
          }
        }
      });
    }

    // Find voucher in database
    const vouchers = await db
      .select()
      .from(voucherCodes)
      .where(eq(voucherCodes.code, code))
      .limit(1);

    if (vouchers.length === 0) {
      return NextResponse.json({
        result: {
          data: {
            valid: false,
            message: 'Invalid voucher code'
          }
        }
      });
    }

    const voucher = vouchers[0];

    // Check if voucher is active
    if (!voucher.isActive) {
      return NextResponse.json({
        result: {
          data: {
            valid: false,
            message: 'This voucher is no longer active'
          }
        }
      });
    }

    // Check if voucher has expired
    const now = new Date();
    if (voucher.validFrom && new Date(voucher.validFrom) > now) {
      return NextResponse.json({
        result: {
          data: {
            valid: false,
            message: 'This voucher is not yet valid'
          }
        }
      });
    }

    if (voucher.validUntil && new Date(voucher.validUntil) < now) {
      return NextResponse.json({
        result: {
          data: {
            valid: false,
            message: 'This voucher has expired'
          }
        }
      });
    }

    // Check if voucher has reached max uses
    if (voucher.maxUses !== null && voucher.usedCount >= voucher.maxUses) {
      return NextResponse.json({
        result: {
          data: {
            valid: false,
            message: 'This voucher has reached its usage limit'
          }
        }
      });
    }

    // Voucher is valid
    return NextResponse.json({
      result: {
        data: {
          valid: true,
          voucher: {
            id: voucher.id,
            code: voucher.code,
            discountType: voucher.discountType,
            discountValue: voucher.discountValue
          },
          message: 'Voucher is valid'
        }
      }
    });

  } catch (error) {
    console.error('[Voucher Validation] Error:', error);
    return NextResponse.json({
      result: {
        data: {
          valid: false,
          message: 'Error validating voucher code'
        }
      }
    }, { status: 500 });
  }
}
