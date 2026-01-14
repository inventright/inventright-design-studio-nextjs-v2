import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

/**
 * Migration endpoint to add contact fields to users table
 * Run once: GET /api/migrate-user-fields
 */
export async function GET() {
  try {
    console.log('[Migration] Starting user fields migration...');
    
    // Add all contact fields to users table
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS "firstName" text,
      ADD COLUMN IF NOT EXISTS "lastName" text,
      ADD COLUMN IF NOT EXISTS phone varchar(50),
      ADD COLUMN IF NOT EXISTS address1 text,
      ADD COLUMN IF NOT EXISTS address2 text,
      ADD COLUMN IF NOT EXISTS city varchar(100),
      ADD COLUMN IF NOT EXISTS state varchar(100),
      ADD COLUMN IF NOT EXISTS zip varchar(20),
      ADD COLUMN IF NOT EXISTS country varchar(100);
    `);
    
    console.log('[Migration] User fields migration completed successfully');
    
    return NextResponse.json({ 
      success: true, 
      message: 'User contact fields added successfully',
      fields: [
        'firstName',
        'lastName', 
        'phone',
        'address1',
        'address2',
        'city',
        'state',
        'zip',
        'country'
      ]
    });
  } catch (error: any) {
    console.error('[Migration] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        details: 'Failed to add user contact fields. They may already exist.'
      },
      { status: 500 }
    );
  }
}
