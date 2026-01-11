# inventRight Design Studio - Next.js v2

Modern Next.js application with Neon Auth, PostgreSQL, and full serverless architecture.

## 🚀 Features

- **Neon Auth** - Native authentication with Google OAuth
- **Email Template Manager** - Full CRUD with WYSIWYG editor
- **Voucher Management** - Discount codes with usage tracking
- **File Uploads** - Wasabi S3 integration
- **Role-Based Access** - Admin, Manager, Designer, Client roles
- **Shadcn UI** - Beautiful, accessible components
- **TypeScript** - Full type safety
- **Drizzle ORM** - Type-safe database queries

## 📦 Tech Stack

- **Framework**: Next.js 16.1.1 with App Router
- **Database**: Neon PostgreSQL
- **Authentication**: Neon Auth with Google OAuth
- **ORM**: Drizzle
- **UI**: Shadcn UI + TailwindCSS 4
- **Storage**: Wasabi S3
- **Deployment**: Vercel

## 🛠️ Setup

### Prerequisites

- Node.js 18+
- pnpm
- Neon account
- Vercel account (for deployment)
- Google OAuth credentials

### Environment Variables

Create `.env.local`:

```bash
# Database
DATABASE_URL="postgresql://..."

# Neon Auth
NEON_AUTH_BASE_URL="https://ep-xxx.neonauth.region.aws.neon.tech/dbname/auth"

# Wasabi S3 (optional)
WASABI_ACCESS_KEY_ID="..."
WASABI_SECRET_ACCESS_KEY="..."
WASABI_BUCKET="..."
WASABI_REGION="us-east-1"
WASABI_ENDPOINT="https://s3.wasabisys.com"
```

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
```

## 🔐 Authentication Setup

### 1. Enable Neon Auth

1. Go to [Neon Console](https://console.neon.tech)
2. Select your project
3. Navigate to: **Branch → Auth → Configuration**
4. Copy your **Auth URL**
5. Add to `.env.local` as `NEON_AUTH_BASE_URL`

### 2. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add redirect URI:
   ```
   https://ep-xxx.neonauth.region.aws.neon.tech/dbname/auth/callback/google
   ```
4. Copy Client ID and Secret
5. Add to **Neon Console** → **Auth** → **OAuth Providers** → **Google**

### 3. Test Authentication

Visit `/auth/sign-in` and click "Sign in with Google"

## 📄 API Documentation

### Email Templates

```bash
# List all templates
GET /api/email-templates

# Create template
POST /api/email-templates
{
  "name": "Welcome Email",
  "subject": "Welcome!",
  "body": "Hello {name}!",
  "triggerEvent": "user_signup",
  "isActive": true
}
```

### Vouchers

```bash
# List all vouchers
GET /api/vouchers

# Validate voucher code
GET /api/vouchers?code=SAVE20

# Create voucher
POST /api/vouchers
{
  "code": "SAVE20",
  "discountType": "percentage",
  "discountValue": "20",
  "maxUses": 1,
  "isActive": true
}
```

## 🚀 Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import repository in Vercel
3. Add environment variables
4. Deploy

### Post-Deployment

1. Add Vercel domain to **Trusted Domains** in Neon Console
2. Update Google OAuth redirect URIs
3. Test authentication flow

## 📚 Documentation

- [Neon Auth Deployment Guide](./NEON_AUTH_DEPLOYMENT.md) - Complete auth setup
- [Deployment Guide](./DEPLOYMENT.md) - Full deployment instructions

## 🔗 Links

- **GitHub**: https://github.com/inventright/inventright-design-studio-nextjs-v2
- **Neon Project**: mute-surf-42090266
- **Neon Console**: https://console.neon.tech

---

**Status**: ✅ Ready for deployment  
**Last Updated**: January 11, 2026
