CREATE TABLE "designPackageOrders" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderId" varchar(100) NOT NULL,
	"clientId" integer NOT NULL,
	"purchaseDate" timestamp DEFAULT now() NOT NULL,
	"virtualPrototypeStatus" varchar(50) DEFAULT 'not_started' NOT NULL,
	"virtualPrototypeJobId" integer,
	"virtualPrototypeCompletedAt" timestamp,
	"sellSheetStatus" varchar(50) DEFAULT 'locked' NOT NULL,
	"sellSheetJobId" integer,
	"sellSheetCompletedAt" timestamp,
	"packageStatus" varchar(50) DEFAULT 'active' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "designPackageOrders_orderId_unique" UNIQUE("orderId")
);
--> statement-breakpoint
CREATE TABLE "designerAssignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"jobType" varchar(100) NOT NULL,
	"designerId" integer NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emailTemplateImages" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" varchar(255) NOT NULL,
	"contentType" varchar(100) NOT NULL,
	"base64Data" text NOT NULL,
	"size" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "firstName" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lastName" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "address1" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "address2" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "city" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "state" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "zip" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "country" varchar(100);--> statement-breakpoint
ALTER TABLE "designPackageOrders" ADD CONSTRAINT "designPackageOrders_clientId_users_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "designPackageOrders" ADD CONSTRAINT "designPackageOrders_virtualPrototypeJobId_jobs_id_fk" FOREIGN KEY ("virtualPrototypeJobId") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "designPackageOrders" ADD CONSTRAINT "designPackageOrders_sellSheetJobId_jobs_id_fk" FOREIGN KEY ("sellSheetJobId") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "designerAssignments" ADD CONSTRAINT "designerAssignments_designerId_users_id_fk" FOREIGN KEY ("designerId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;