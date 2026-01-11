CREATE TYPE "public"."role" AS ENUM('client', 'designer', 'manager', 'admin');--> statement-breakpoint
CREATE TABLE "departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"color" varchar(7),
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "designPackages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"features" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emailTemplates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"body" text NOT NULL,
	"triggerEvent" varchar(100),
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "emailTemplates_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "fileUploads" (
	"id" serial PRIMARY KEY NOT NULL,
	"jobId" integer,
	"uploadedBy" integer,
	"fileName" varchar(500) NOT NULL,
	"fileUrl" text NOT NULL,
	"fileKey" text NOT NULL,
	"fileSize" integer,
	"mimeType" varchar(100),
	"fileType" varchar(50) DEFAULT 'input' NOT NULL,
	"googleDriveId" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobStatusHistory" (
	"id" serial PRIMARY KEY NOT NULL,
	"jobId" integer NOT NULL,
	"changedBy" integer,
	"oldStatus" varchar(50),
	"newStatus" varchar(50) NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"clientId" integer,
	"designerId" integer,
	"departmentId" integer,
	"title" varchar(500) NOT NULL,
	"description" text,
	"status" varchar(50) DEFAULT 'Draft' NOT NULL,
	"priority" varchar(50) DEFAULT 'Medium' NOT NULL,
	"packageType" varchar(100),
	"dueDate" timestamp,
	"completedDate" timestamp,
	"archived" boolean DEFAULT false NOT NULL,
	"isDraft" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastActivityDate" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"jobId" integer NOT NULL,
	"userId" integer,
	"content" text NOT NULL,
	"isInternal" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"packageId" integer,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"voucherCode" varchar(50),
	"discountAmount" numeric(10, 2),
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"stripeSessionId" varchar(255),
	"stripePaymentIntentId" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(255) NOT NULL,
	"value" text,
	"description" text,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "surveys" (
	"id" serial PRIMARY KEY NOT NULL,
	"jobId" integer,
	"clientId" integer,
	"overallSatisfaction" integer,
	"communicationRating" integer,
	"qualityRating" integer,
	"timelinessRating" integer,
	"feedback" text,
	"wouldRecommend" boolean,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'client' NOT NULL,
	"wordpressId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "voucherCodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"discountType" varchar(20) NOT NULL,
	"discountValue" numeric(10, 2) NOT NULL,
	"maxUses" integer,
	"usedCount" integer DEFAULT 0 NOT NULL,
	"validFrom" timestamp,
	"validUntil" timestamp,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "voucherCodes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "voucherUsage" (
	"id" serial PRIMARY KEY NOT NULL,
	"voucherId" integer,
	"userId" integer,
	"orderId" varchar(255),
	"usedDate" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fileUploads" ADD CONSTRAINT "fileUploads_jobId_jobs_id_fk" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fileUploads" ADD CONSTRAINT "fileUploads_uploadedBy_users_id_fk" FOREIGN KEY ("uploadedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobStatusHistory" ADD CONSTRAINT "jobStatusHistory_jobId_jobs_id_fk" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobStatusHistory" ADD CONSTRAINT "jobStatusHistory_changedBy_users_id_fk" FOREIGN KEY ("changedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_clientId_users_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_designerId_users_id_fk" FOREIGN KEY ("designerId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_departmentId_departments_id_fk" FOREIGN KEY ("departmentId") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_jobId_jobs_id_fk" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_packageId_designPackages_id_fk" FOREIGN KEY ("packageId") REFERENCES "public"."designPackages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_jobId_jobs_id_fk" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_clientId_users_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voucherUsage" ADD CONSTRAINT "voucherUsage_voucherId_voucherCodes_id_fk" FOREIGN KEY ("voucherId") REFERENCES "public"."voucherCodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voucherUsage" ADD CONSTRAINT "voucherUsage_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;