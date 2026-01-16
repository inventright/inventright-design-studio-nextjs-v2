import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailMediaLibrary } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: 'us-east-1',
  endpoint: process.env.WASABI_ENDPOINT,
  credentials: {
    accessKeyId: process.env.WASABI_ACCESS_KEY_ID!,
    secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY!,
  },
});

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

    // Generate unique file key
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileKey = `email-media/${timestamp}-${sanitizedFileName}`;

    // Upload to Wasabi S3
    const buffer = Buffer.from(await file.arrayBuffer());
    
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.WASABI_BUCKET_NAME!,
        Key: fileKey,
        Body: buffer,
        ContentType: file.type,
        ACL: 'public-read',
      })
    );

    const fileUrl = `${process.env.WASABI_PUBLIC_URL}/${fileKey}`;

    // Get image dimensions if possible
    let width: number | null = null;
    let height: number | null = null;
    
    try {
      // Create image to get dimensions
      if (typeof Image !== 'undefined') {
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = () => {
            width = img.width;
            height = img.height;
            resolve(null);
          };
          img.onerror = reject;
          img.src = fileUrl;
        });
      }
    } catch (error) {
      console.log('[Email Media API] Could not get image dimensions:', error);
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

    return NextResponse.json(mediaItem);
  } catch (error) {
    console.error('[Email Media API] Error uploading media:', error);
    return NextResponse.json(
      { error: 'Failed to upload media' },
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

    // Delete from S3
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.WASABI_BUCKET_NAME!,
          Key: mediaItem.fileKey,
        })
      );
    } catch (s3Error) {
      console.error('[Email Media API] Error deleting from S3:', s3Error);
      // Continue with database deletion even if S3 deletion fails
    }

    // Delete from database
    await db
      .delete(emailMediaLibrary)
      .where(eq(emailMediaLibrary.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Email Media API] Error deleting media:', error);
    return NextResponse.json(
      { error: 'Failed to delete media' },
      { status: 500 }
    );
  }
}
