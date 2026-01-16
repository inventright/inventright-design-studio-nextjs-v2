import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

if (
  !process.env.WASABI_ACCESS_KEY_ID ||
  !process.env.WASABI_SECRET_ACCESS_KEY ||
  !process.env.WASABI_BUCKET ||
  !process.env.WASABI_REGION ||
  !process.env.WASABI_ENDPOINT
) {
  console.warn("Wasabi S3 configuration is incomplete");
}

const s3Client = new S3Client({
  region: process.env.WASABI_REGION || "us-east-1",
  endpoint: process.env.WASABI_ENDPOINT || "https://s3.wasabisys.com",
  credentials: {
    accessKeyId: process.env.WASABI_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true, // Required for Wasabi to avoid redirect issues
});

const BUCKET_NAME = process.env.WASABI_BUCKET || "";

/**
 * Upload a file to Wasabi S3
 */
export async function uploadFile(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<{ key: string; url: string }> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);

  // Construct public URL for Wasabi
  // Format: https://{bucket}.s3.{region}.wasabisys.com/{key}
  const region = process.env.WASABI_REGION || "us-east-1";
  const url = `https://${BUCKET_NAME}.s3.${region}.wasabisys.com/${key}`;

  return { key, url };
}

/**
 * Get a presigned URL for downloading a file
 */
export async function getFileUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return url;
}

/**
 * Delete a file from Wasabi S3
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Upload a base64 encoded file
 */
export async function uploadBase64File(
  key: string,
  base64Data: string,
  contentType: string
): Promise<{ key: string; url: string }> {
  const buffer = Buffer.from(base64Data, "base64");
  return uploadFile(key, buffer, contentType);
}

/**
 * Generate a unique file key for uploads
 */
export function generateFileKey(
  prefix: string,
  filename: string
): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${prefix}/${timestamp}-${randomString}-${sanitizedFilename}`;
}
