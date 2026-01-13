import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

// One-time migration endpoint to make designerId nullable
export async function POST() {
  try {
    console.log('[Migration] Making designerId nullable in jobs table...');
    
    // Run raw SQL to alter the column
    await db.execute(sql`
      ALTER TABLE jobs 
      ALTER COLUMN "designerId" DROP NOT NULL
    `);
    
    console.log('[Migration] Successfully made designerId nullable');
    
    return NextResponse.json({ 
      success: true, 
      message: 'designerId column is now nullable' 
    });
  } catch (error: any) {
    console.error('[Migration] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        details: 'Failed to alter designerId column'
      },
      { status: 500 }
    );
  }
}
