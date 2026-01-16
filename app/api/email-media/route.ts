import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailMediaLibrary } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { uploadFile, deleteFile, generateFileKey } from '@/lib/storage';

// GET - Fetch all media library items
export async function GET(request: NextRequest) {
  try {
    const items = await db
      .select()
      .from(emailMediaLibrary)
      .orderBy(desc(emailMediaLibrary.createdAt));

    return NextResponse.json(items);
  } catch (error) {
    console.error('[Email Media API] Error fetching media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media library items' },
      { status: 500 }
    );
  }
}

// POST - Upload new media item
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadedBy = formData.get('uploadedBy') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Convert file to base64 for database storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString('base64');
    
    // Generate unique file key for reference (not used for S3 anymore)
    const fileKey = generateFileKey('email-media', file.name);

    console.log('[Email Media API] File converted to base64, size:', buffer.length);

    // Get image dimensions if possible (server-side, using sharp if available)
    let width: number | null = null;
    let height: number | null = null;
    
    try {
      // Try to use sharp for server-side image processing
      const sharp = require('sharp');
      const metadata = await sharp(buffer).metadata();
      width = metadata.width || null;
      height = metadata.height || null;
      console.log('[Email Media API] Image dimensions:', { width, height });
    } catch (error) {
      console.log('[Email Media API] Could not get image dimensions (sharp not available):', error);
      // Dimensions are optional, continue without them
    }

    // Save to database with temporary placeholder URL
    const [mediaItem] = await db
      .insert(emailMediaLibrary)
      .values({
        fileName: file.name,
        fileUrl: '', // Will be updated below with ID-based URL
        fileKey,
        base64Data,
        fileSize: file.size,
        mimeType: file.type,
        width,
        height,
        uploadedBy: uploadedBy ? parseInt(uploadedBy) : null,
      } as any)
      .returning();

    // Generate proxy URL using the media item ID
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ds.inventright.com';
    const proxyUrl = `${baseUrl}/api/email-media/${mediaItem.id}`;

    // Update the media item with the correct URL
    await db
      .update(emailMediaLibrary)
      .set({ fileUrl: proxyUrl })
      .where(eq(emailMediaLibrary.id, mediaItem.id));

    console.log('[Email Media API] Media item saved to database:', mediaItem.id);

    // Return the updated media item
    return NextResponse.json({ ...mediaItem, fileUrl: proxyUrl });
  } catch (error: any) {
    console.error('[Email Media API] Error uploading media:', error);
    console.error('[Email Media API] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      { 
        error: 'Failed to upload media',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove media item
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Media ID is required' },
        { status: 400 }
      );
    }

    // Delete from database (base64 data is stored in DB, no S3 cleanup needed)
    const result = await db
      .delete(emailMediaLibrary)
      .where(eq(emailMediaLibrary.id, parseInt(id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Media item not found' },
        { status: 404 }
      );
    }

    console.log('[Email Media API] Media item deleted from database:', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Email Media API] Error deleting media:', error);
    return NextResponse.json(
      { error: 'Failed to delete media' },
      { status: 500 }
    );
  }
}
