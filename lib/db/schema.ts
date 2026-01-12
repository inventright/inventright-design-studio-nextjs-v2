import { pgTable, serial, varchar, text, timestamp, integer, boolean, decimal, pgEnum } from "drizzle-orm/pg-core";

/**
 * Role enum for PostgreSQL
 */
export const roleEnum = pgEnum("role", ["client", "designer", "manager", "admin"]);

/**
 * Core user table backing auth flow with WordPress integration.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("client").notNull(),
  wordpressId: integer("wordpressId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Departments for organizing design work
 */
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = typeof departments.$inferInsert;

/**
 * Jobs/Projects table for design requests
 */
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  clientId: integer("clientId").references(() => users.id),
  designerId: integer("designerId").references(() => users.id),
  departmentId: integer("departmentId").references(() => departments.id),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("Draft").notNull(),
  priority: varchar("priority", { length: 50 }).default("Medium").notNull(),
  packageType: varchar("packageType", { length: 100 }),
  dueDate: timestamp("dueDate"),
  completedDate: timestamp("completedDate"),
  archived: boolean("archived").default(false).notNull(),
  isDraft: boolean("isDraft").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastActivityDate: timestamp("lastActivityDate").defaultNow().notNull(),
});

export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;

/**
 * File uploads associated with jobs
 */
export const fileUploads = pgTable("fileUploads", {
  id: serial("id").primaryKey(),
  jobId: integer("jobId").references(() => jobs.id, { onDelete: "cascade" }),
  uploadedBy: integer("uploadedBy").references(() => users.id),
  fileName: varchar("fileName", { length: 500 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: text("fileKey").notNull(),
  fileSize: integer("fileSize"),
  mimeType: varchar("mimeType", { length: 100 }),
  fileType: varchar("fileType", { length: 50 }).default("input").notNull(),
  googleDriveId: varchar("googleDriveId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FileUpload = typeof fileUploads.$inferSelect;
export type InsertFileUpload = typeof fileUploads.$inferInsert;

/**
 * Messages/Comments on jobs
 */
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  jobId: integer("jobId").references(() => jobs.id, { onDelete: "cascade" }).notNull(),
  userId: integer("userId").references(() => users.id),
  content: text("content").notNull(),
  isInternal: boolean("isInternal").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Job status history for tracking changes
 */
export const jobStatusHistory = pgTable("jobStatusHistory", {
  id: serial("id").primaryKey(),
  jobId: integer("jobId").references(() => jobs.id, { onDelete: "cascade" }).notNull(),
  changedBy: integer("changedBy").references(() => users.id),
  oldStatus: varchar("oldStatus", { length: 50 }),
  newStatus: varchar("newStatus", { length: 50 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type JobStatusHistory = typeof jobStatusHistory.$inferSelect;
export type InsertJobStatusHistory = typeof jobStatusHistory.$inferInsert;

/**
 * Email templates for automated notifications
 */
export const emailTemplates = pgTable("emailTemplates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  triggerEvent: varchar("triggerEvent", { length: 100 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

/**
 * Email template images stored as base64 for inline attachments
 */
export const emailTemplateImages = pgTable("emailTemplateImages", {
  id: serial("id").primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  contentType: varchar("contentType", { length: 100 }).notNull(),
  base64Data: text("base64Data").notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailTemplateImage = typeof emailTemplateImages.$inferSelect;
export type InsertEmailTemplateImage = typeof emailTemplateImages.$inferInsert;

/**
 * Voucher codes for discounts
 */
export const voucherCodes = pgTable("voucherCodes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  discountType: varchar("discountType", { length: 20 }).notNull(),
  discountValue: decimal("discountValue", { precision: 10, scale: 2 }).notNull(),
  maxUses: integer("maxUses"),
  usesPerUser: integer("usesPerUser"),
  usedCount: integer("usedCount").default(0).notNull(),
  validFrom: timestamp("validFrom"),
  validUntil: timestamp("validUntil"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type VoucherCode = typeof voucherCodes.$inferSelect;
export type InsertVoucherCode = typeof voucherCodes.$inferInsert;

/**
 * Voucher usage tracking
 */
export const voucherUsage = pgTable("voucherUsage", {
  id: serial("id").primaryKey(),
  voucherId: integer("voucherId").references(() => voucherCodes.id),
  userId: integer("userId").references(() => users.id),
  orderId: varchar("orderId", { length: 255 }),
  usedDate: timestamp("usedDate").defaultNow().notNull(),
});

export type VoucherUsage = typeof voucherUsage.$inferSelect;
export type InsertVoucherUsage = typeof voucherUsage.$inferInsert;

/**
 * Design packages/pricing
 */
export const designPackages = pgTable("designPackages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  features: text("features"),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: integer("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type DesignPackage = typeof designPackages.$inferSelect;
export type InsertDesignPackage = typeof designPackages.$inferInsert;

/**
 * Orders for package purchases
 */
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id),
  packageId: integer("packageId").references(() => designPackages.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  voucherCode: varchar("voucherCode", { length: 50 }),
  discountAmount: decimal("discountAmount", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  stripeSessionId: varchar("stripeSessionId", { length: 255 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Client satisfaction surveys
 */
export const surveys = pgTable("surveys", {
  id: serial("id").primaryKey(),
  jobId: integer("jobId").references(() => jobs.id),
  clientId: integer("clientId").references(() => users.id),
  overallSatisfaction: integer("overallSatisfaction"),
  communicationRating: integer("communicationRating"),
  qualityRating: integer("qualityRating"),
  timelinessRating: integer("timelinessRating"),
  feedback: text("feedback"),
  wouldRecommend: boolean("wouldRecommend"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Survey = typeof surveys.$inferSelect;
export type InsertSurvey = typeof surveys.$inferInsert;

/**
 * System settings
 */
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value"),
  description: text("description"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;

/**
 * Designer assignments for automatic job routing by job type
 */
export const designerAssignments = pgTable("designerAssignments", {
  id: serial("id").primaryKey(),
  jobType: varchar("jobType", { length: 100 }).notNull(), // 'sell_sheets', 'virtual_prototypes', 'line_drawings'
  designerId: integer("designerId").references(() => users.id).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  priority: integer("priority").default(0).notNull(), // Higher priority designers get assigned first
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type DesignerAssignment = typeof designerAssignments.$inferSelect;
export type InsertDesignerAssignment = typeof designerAssignments.$inferInsert;
