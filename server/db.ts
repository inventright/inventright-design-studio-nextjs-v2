import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  users,
  departments,
  jobs,
  fileUploads,
  messages,
  jobStatusHistory,
  emailTemplates,
  voucherCodes,
  voucherUsage,
  designPackages,
  orders,
  surveys,
  settings,
  type User,
  type InsertUser,
  type Department,
  type InsertDepartment,
  type Job,
  type InsertJob,
  type FileUpload,
  type InsertFileUpload,
  type Message,
  type InsertMessage,
  type InsertJobStatusHistory,
  type EmailTemplate,
  type InsertEmailTemplate,
  type VoucherCode,
  type InsertVoucherCode,
  type DesignPackage,
  type InsertDesignPackage,
  type Order,
  type InsertOrder,
  type Survey,
  type InsertSurvey,
  type Setting,
  type InsertSetting,
} from "../drizzle/schema-pg";

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: Pool | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = new Pool({ connectionString: process.env.DATABASE_URL });
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// User operations
export async function upsertUser(data: InsertUser): Promise<User> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(users).where(eq(users.openId, data.openId)).limit(1);
  
  if (existing.length > 0) {
    const [updated] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.openId, data.openId))
      .returning();
    return updated;
  } else {
    const [created] = await db.insert(users).values(data).returning();
    return created;
  }
}

export async function getUserByOpenId(openId: string): Promise<User | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0] || null;
}

export async function getUserById(id: number): Promise<User | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] || null;
}

export async function getAllUsers(): Promise<User[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(users);
}

// Department operations
export async function getAllDepartments(): Promise<Department[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(departments).where(eq(departments.isActive, true));
}

export async function getDepartmentById(id: number): Promise<Department | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(departments).where(eq(departments.id, id)).limit(1);
  return result[0] || null;
}

export async function createDepartment(data: InsertDepartment): Promise<Department> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [created] = await db.insert(departments).values(data).returning();
  return created;
}

// Job operations
export async function createJob(data: InsertJob): Promise<Job> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [created] = await db.insert(jobs).values(data).returning();
  return created;
}

export async function getJobById(id: number): Promise<Job | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  return result[0] || null;
}

export async function getJobsByClientId(clientId: number): Promise<Job[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(jobs).where(eq(jobs.clientId, clientId)).orderBy(desc(jobs.createdAt));
}

export async function getAllJobs(): Promise<Job[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(jobs).orderBy(desc(jobs.createdAt));
}

export async function updateJob(id: number, data: Partial<InsertJob>): Promise<Job> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [updated] = await db
    .update(jobs)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(jobs.id, id))
    .returning();
  return updated;
}

// File upload operations
export async function createFileUpload(data: InsertFileUpload): Promise<FileUpload> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [created] = await db.insert(fileUploads).values(data).returning();
  return created;
}

export async function getFileUploadsByJobId(jobId: number): Promise<FileUpload[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(fileUploads).where(eq(fileUploads.jobId, jobId));
}

// Message operations
export async function createMessage(data: InsertMessage): Promise<Message> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [created] = await db.insert(messages).values(data).returning();
  return created;
}

export async function getMessagesByJobId(jobId: number): Promise<Message[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(messages).where(eq(messages.jobId, jobId)).orderBy(desc(messages.createdAt));
}

// Voucher operations
export async function getVoucherByCode(code: string): Promise<VoucherCode | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(voucherCodes).where(eq(voucherCodes.code, code)).limit(1);
  return result[0] || null;
}

export async function getAllVouchers(): Promise<VoucherCode[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(voucherCodes).orderBy(desc(voucherCodes.createdAt));
}

export async function createVoucher(data: InsertVoucherCode): Promise<VoucherCode> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [created] = await db.insert(voucherCodes).values(data).returning();
  return created;
}

// Email template operations
export async function getAllEmailTemplates(): Promise<EmailTemplate[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(emailTemplates);
}

export async function getEmailTemplateByName(name: string): Promise<EmailTemplate | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(emailTemplates).where(eq(emailTemplates.name, name)).limit(1);
  return result[0] || null;
}

export async function createEmailTemplate(data: InsertEmailTemplate): Promise<EmailTemplate> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [created] = await db.insert(emailTemplates).values(data).returning();
  return created;
}

// Survey operations
export async function createSurvey(data: InsertSurvey): Promise<Survey> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [created] = await db.insert(surveys).values(data).returning();
  return created;
}

export async function getAllSurveys(): Promise<Survey[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(surveys).orderBy(desc(surveys.createdAt));
}

// Export all types
export type {
  User,
  InsertUser,
  Department,
  InsertDepartment,
  Job,
  InsertJob,
  FileUpload,
  InsertFileUpload,
  Message,
  InsertMessage,
  InsertJobStatusHistory,
  EmailTemplate,
  InsertEmailTemplate,
  VoucherCode,
  InsertVoucherCode,
  DesignPackage,
  InsertDesignPackage,
  Order,
  InsertOrder,
  Survey,
  InsertSurvey,
  Setting,
  InsertSetting,
};
