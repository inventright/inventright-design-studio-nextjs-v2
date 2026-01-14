# Draft Job System Documentation

## Overview

The draft job system allows users to create jobs that are saved immediately to the database with `isDraft: true`. This enables:
- Immediate file uploads with real job IDs (no string-based draft IDs)
- Persistent drafts across sessions
- Automatic cleanup of abandoned drafts after 60 days

## Architecture

### Database Schema

**jobs table:**
- `isDraft` (boolean): Marks job as draft (default: true)
- `status` (varchar): Job status - "Draft" for drafts, "Pending" when submitted
- `lastActivityDate` (timestamp): Updated on any job modification, used for cleanup

**fileUploads table:**
- `jobId` (integer): References jobs.id with CASCADE delete
- Files are immediately associated with real job IDs

### API Endpoints

#### GET /api/jobs/draft
- Gets or creates a draft job for the current user
- Returns existing draft or creates new one with minimal fields
- Used on job intake page load

#### POST /api/jobs/draft/create
- Creates a new draft job with `isDraft: true`
- Returns real job ID (integer) for file uploads
- Alternative to GET endpoint for explicit creation

#### PUT /api/jobs/draft/update
- Updates draft job fields
- Can convert draft to active with `makeActive: true`
- Auto-assigns designer based on package type when activating

#### PATCH /api/jobs/[id]
- Updates any job field including `isDraft`, `title`, `departmentId`, `packageType`
- Used by job intake form on submission
- Updates `lastActivityDate` to track activity

#### DELETE /api/jobs/cleanup-drafts
- Deletes draft jobs older than 60 days
- Also deletes associated files from Wasabi S3
- Called by Vercel cron job daily at 2 AM

#### GET /api/jobs/draft/cleanup
- Dry run - shows which drafts would be deleted
- Returns count and details of old drafts

### Frontend Components

#### /app/job-intake/page.tsx
- On load: Calls `/api/jobs/draft` to get/create draft job
- Stores `draftJobId` in state and localStorage
- File uploads use real job ID immediately
- On submit: PATCH `/api/jobs/[id]` to update draft with full data and set `isDraft: false`

#### /components/ui/FileUploadInput.tsx
- Accepts `draftJobId` prop (number | string | null)
- Uploads files immediately using FormData
- Calls `/api/files/upload` with real job ID

#### /lib/uploadDraftFile.ts
- Helper function for file uploads
- Accepts `draftJobId` (number | string | null)
- Converts to string for FormData
- Returns file key for storage

### Dashboard Features

#### Draft Expiration Warnings
- Yellow banner shown when user has draft jobs
- Shows draft age in days for each draft
- Shows "⚠️ Expires in X days" for drafts older than 45 days
- Located in `/app/dashboard/client/page.tsx`

## Workflow

### Creating a Job

1. User visits `/job-intake`
2. Page calls `/api/jobs/draft` to get/create draft job
3. Draft job ID stored in state and localStorage
4. User fills form and uploads files
5. Files upload immediately to Wasabi with real job ID
6. User submits form
7. PATCH `/api/jobs/[id]` updates draft with full data and sets `isDraft: false`, `status: "Pending"`
8. Draft becomes active job, all files remain associated

### Draft Cleanup

1. Vercel cron runs daily at 2 AM UTC
2. Calls `/api/jobs/cleanup-drafts`
3. Finds drafts where `isDraft: true` AND `lastActivityDate < 60 days ago`
4. Deletes associated files from Wasabi S3
5. Deletes file records from database (CASCADE)
6. Deletes draft job records

## Configuration

### Vercel Cron Job

Located in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/jobs/cleanup-drafts",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Schedule: Daily at 2:00 AM UTC

### Draft Expiration Period

Hardcoded to 60 days in:
- `/app/api/jobs/cleanup-drafts/route.ts`
- `/app/api/jobs/draft/cleanup/route.ts`
- `/app/dashboard/client/page.tsx` (warning threshold: 45 days)

To change expiration period, update these files.

## Type Safety

All components and functions accept both `string` and `number` types for job IDs to maintain backward compatibility, but the system uses integer job IDs internally.

## Benefits Over Previous System

**Before:**
- String-based draft IDs ("draft_2_123")
- Files uploaded with `jobId: null`
- Complex draft-to-job conversion logic
- Type conflicts between string draft IDs and integer job IDs

**After:**
- Real integer job IDs from the start
- Files immediately associated with job
- Simple status update on submission (isDraft: false)
- No type conflicts
- Cleaner architecture
