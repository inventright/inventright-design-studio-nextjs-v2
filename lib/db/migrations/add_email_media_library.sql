-- Migration: Add Email Media Library table
-- Description: Create table to store uploaded images for email templates

CREATE TABLE IF NOT EXISTS "emailMediaLibrary" (
  "id" SERIAL PRIMARY KEY,
  "fileName" VARCHAR(500) NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileKey" TEXT NOT NULL,
  "fileSize" INTEGER,
  "mimeType" VARCHAR(100),
  "width" INTEGER,
  "height" INTEGER,
  "uploadedBy" INTEGER REFERENCES "users"("id"),
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS "emailMediaLibrary_uploadedBy_idx" ON "emailMediaLibrary"("uploadedBy");
CREATE INDEX IF NOT EXISTS "emailMediaLibrary_createdAt_idx" ON "emailMediaLibrary"("createdAt" DESC);
