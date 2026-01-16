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

    // Generate unique file key using existing utility
    const fileKey = generateFileKey('email-media', file.name);

    // Upload to Wasabi S3 using existing utility
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url: fileUrl } = await uploadFile(fileKey, buffer, file.type);

    console.log('[Email Media API] File uploaded successfully:', { fileKey, fileUrl });

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

    // Save to database
    const [mediaItem] = await db
      .insert(emailMediaLibrary)
      .values({
        fileName: file.name,
        fileUrl,
        fileKey,
        fileSize: file.size,
        mimeType: file.type,
        width,
        height,
        uploadedBy: uploadedBy ? parseInt(uploadedBy) : null,
      } as any)
      .returning();

    console.log('[Email Media API] Media item saved to database:', mediaItem.id);

    return NextResponse.json(mediaItem);
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

    // Get media item to delete from S3
    const [mediaItem] = await db
      .select()
      .from(emailMediaLibrary)
      .where(eq(emailMediaLibrary.id, parseInt(id)))
      .limit(1);

    if (!mediaItem) {
      return NextResponse.json(
        { error: 'Media item not found' },
        { status: 404 }
      );
    }

    // Delete from database first for fast response
    await db
      .delete(emailMediaLibrary)
      .where(eq(emailMediaLibrary.id, parseInt(id)));

    console.log('[Email Media API] Media item deleted from database:', id);

    // Delete from S3 asynchronously (don't wait for it)
    // This makes the response instant while still cleaning up S3
    deleteFile(mediaItem.fileKey)
      .then(() => {
        console.log('[Email Media API] File deleted from S3:', mediaItem.fileKey);
      })
      .catch((s3Error) => {
        console.error('[Email Media API] Error deleting from S3:', s3Error);
        // S3 deletion failed but database is already cleaned up
        // This is acceptable as orphaned S3 files can be cleaned up later
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Email Media API] Error deleting media:', error);
    return NextResponse.json(
      { error: 'Failed to delete media' },
      { status: 500 }
    );
  }
}
