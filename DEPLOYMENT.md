# inventRight Design Studio - Next.js v2 Deployment Guide

## Overview

This is a complete migration of the inventRight Design Studio from Express/Vite to Next.js 14+ with App Router, fully compatible with Vercel serverless deployment.

## Infrastructure

### GitHub Repository
- **URL**: https://github.com/inventright/inventright-design-studio-nextjs-v2
- **Branch**: main

### Neon Database
- **Project ID**: mute-surf-42090266
- **Branch**: main (br-bitter-shape-af88rx4p)
- **Database**: neondb
- **Connection String**: `postgresql://neondb_owner:npg_RXhFTGi59LgW@ep-proud-snow-afdf9p4z-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require`

### Database Schema
All 13 tables have been created and migrated:
- users, departments, jobs, fileUploads, messages, jobStatusHistory
- emailTemplates, voucherCodes, voucherUsage
- designPackages, orders, surveys, settings

## Environment Variables

The following environment variables need to be configured in Vercel:

### Database
```
DATABASE_URL=postgresql://neondb_owner:npg_RXhFTGi59LgW@ep-proud-snow-afdf9p4z-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require
```

### NextAuth (Auth.js)
```
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
GOOGLE_CLIENT_ID=<your-google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<your-google-oauth-client-secret>
```

### Wasabi S3 Storage
```
WASABI_ACCESS_KEY_ID=<your-wasabi-access-key>
WASABI_SECRET_ACCESS_KEY=<your-wasabi-secret-key>
WASABI_BUCKET=<your-bucket-name>
WASABI_REGION=us-east-1
WASABI_ENDPOINT=https://s3.wasabisys.com
```

## Deployment Steps

### 1. Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
npm install -g vercel
cd inventright-design-studio-nextjs-v2
vercel --prod
```

#### Option B: Using Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Import from GitHub: `inventright/inventright-design-studio-nextjs-v2`
4. Configure environment variables (see above)
5. Deploy

### 2. Configure OAuth Callback URLs

After deployment, add the Vercel domain to Google OAuth:

**Authorized redirect URIs:**
```
https://your-vercel-domain.vercel.app/api/auth/callback/google
```

### 3. Test Deployment

Visit these URLs to verify:
- **Home**: `https://your-vercel-domain.vercel.app`
- **Email Templates**: `https://your-vercel-domain.vercel.app/admin/email-templates`
- **Vouchers**: `https://your-vercel-domain.vercel.app/admin/vouchers`

### 4. API Endpoints

All API routes are available at:
- `POST /api/email-templates` - Create email template
- `GET /api/email-templates` - List all email templates
- `GET /api/email-templates/[id]` - Get single template
- `PUT /api/email-templates/[id]` - Update template
- `DELETE /api/email-templates/[id]` - Delete template

- `POST /api/vouchers` - Create voucher
- `GET /api/vouchers` - List all vouchers or validate code
- `GET /api/vouchers/[id]` - Get single voucher
- `PUT /api/vouchers/[id]` - Update voucher
- `DELETE /api/vouchers/[id]` - Delete voucher

- `POST /api/files/upload` - Upload file to Wasabi S3
- `GET /api/files?jobId=123` - Get files for a job

- `GET /api/jobs` - List jobs (role-based)
- `POST /api/jobs` - Create new job

## Features Implemented

### ✅ Email Template Manager
- Full CRUD operations
- WYSIWYG textarea editor
- Template variables support
- Trigger event configuration
- Active/Inactive status toggle

### ✅ Voucher Management System
- Full CRUD operations
- Discount types: percentage or fixed amount
- **Usage Per User** field (maxUses)
- **Does Not Expire** option
- Date range validation (validFrom, validUntil)
- Usage tracking and display
- Active/Inactive status toggle
- Voucher code validation API

### ✅ Authentication System
- NextAuth v5 (Auth.js) with Google OAuth
- Role-based access control (client, designer, manager, admin)
- JWT session strategy
- Drizzle adapter for database integration

### ✅ Database Integration
- Drizzle ORM with Neon PostgreSQL
- 13 tables with full schema
- Migrations applied and verified

### ✅ Wasabi S3 Storage
- File upload API
- Unique file key generation
- Presigned URL support
- File metadata tracking in database

### ✅ UI Components
- Shadcn UI component library
- TailwindCSS styling
- Toast notifications (Sonner)
- Responsive design

## Architecture

- **Framework**: Next.js 16.1.1 with App Router
- **Language**: TypeScript
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth v5 (Auth.js)
- **Storage**: Wasabi S3-compatible storage
- **UI**: Shadcn UI + TailwindCSS
- **Deployment**: Vercel serverless

## Success Criteria

✅ All pages render correctly
✅ Email templates can be created, edited, and deleted
✅ Vouchers can be created with all fields (including Usage Per User and Does Not Expire)
✅ Database connectivity verified
✅ API routes respond correctly to POST/GET/PUT/DELETE requests
✅ Pure Next.js serverless (no external Express server)

## Next Steps

1. Deploy to Vercel
2. Configure environment variables
3. Set up Google OAuth credentials
4. Configure Wasabi S3 bucket
5. Test all features in production
6. Enable authentication middleware (currently disabled for testing)

## Notes

- Middleware is currently disabled (`middleware.ts.disabled`) for testing purposes
- Auth checks in API routes are temporarily bypassed for development
- Re-enable authentication after OAuth is properly configured in production
