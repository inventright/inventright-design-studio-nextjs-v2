import { eq, and, desc, sql, or, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
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
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER FUNCTIONS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (user.wordpressId !== undefined) {
      values.wordpressId = user.wordpressId;
      updateSet.wordpressId = user.wordpressId;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByWordpressId(wordpressId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.wordpressId, wordpressId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUsersByRole(role: "client" | "designer" | "manager" | "admin") {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).where(eq(users.role, role));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

// ============ DEPARTMENT FUNCTIONS ============

export async function createDepartment(dept: InsertDepartment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(departments).values(dept);
  return Number(result[0].insertId);
}

export async function getAllDepartments() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(departments).orderBy(departments.name);
}

export async function getActiveDepartments() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(departments).where(eq(departments.isActive, true)).orderBy(departments.name);
}

export async function updateDepartment(id: number, data: Partial<Department>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(departments).set(data).where(eq(departments.id, id));
}

export async function deleteDepartment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(departments).where(eq(departments.id, id));
}

// ============ JOB FUNCTIONS ============

export async function createJob(job: InsertJob) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(jobs).values(job);
  return Number(result[0].insertId);
}

export async function getJobById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getJobsByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(jobs)
    .where(and(eq(jobs.clientId, clientId), eq(jobs.archived, false)))
    .orderBy(desc(jobs.lastActivityDate));
}

export async function getJobsByDesignerId(designerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(jobs)
    .where(and(eq(jobs.designerId, designerId), eq(jobs.archived, false)))
    .orderBy(desc(jobs.lastActivityDate));
}

export async function getAllActiveJobs() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(jobs)
    .where(eq(jobs.archived, false))
    .orderBy(desc(jobs.lastActivityDate));
}

export async function getArchivedJobs() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(jobs)
    .where(eq(jobs.archived, true))
    .orderBy(desc(jobs.updatedAt));
}

export async function updateJob(id: number, data: Partial<Job>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(jobs).set({
    ...data,
    lastActivityDate: new Date(),
  }).where(eq(jobs.id, id));
}

export async function deleteJob(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(jobs).where(eq(jobs.id, id));
}

// ============ FILE UPLOAD FUNCTIONS ============

export async function createFileUpload(file: InsertFileUpload) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(fileUploads).values(file);
  return Number(result[0].insertId);
}

export async function getFilesByJobId(jobId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(fileUploads)
    .where(eq(fileUploads.jobId, jobId))
    .orderBy(desc(fileUploads.createdAt));
}

export async function deleteFileUpload(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(fileUploads).where(eq(fileUploads.id, id));
}

// ============ MESSAGE FUNCTIONS ============

export async function createMessage(message: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(messages).values(message);
  return Number(result[0].insertId);
}

export async function getMessagesByJobId(jobId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(messages)
    .where(eq(messages.jobId, jobId))
    .orderBy(messages.createdAt);
}

export async function updateMessage(id: number, content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(messages).set({ content }).where(eq(messages.id, id));
}

export async function deleteMessage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(messages).where(eq(messages.id, id));
}

// ============ JOB STATUS HISTORY FUNCTIONS ============

export async function createJobStatusHistory(history: InsertJobStatusHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(jobStatusHistory).values(history);
  return Number(result[0].insertId);
}

export async function getJobStatusHistory(jobId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(jobStatusHistory)
    .where(eq(jobStatusHistory.jobId, jobId))
    .orderBy(desc(jobStatusHistory.createdAt));
}

// ============ EMAIL TEMPLATE FUNCTIONS ============

export async function createEmailTemplate(template: InsertEmailTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(emailTemplates).values(template);
  return Number(result[0].insertId);
}

export async function getAllEmailTemplates() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(emailTemplates).orderBy(emailTemplates.name);
}

export async function getEmailTemplateByName(name: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(emailTemplates).where(eq(emailTemplates.name, name)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateEmailTemplate(id: number, data: Partial<EmailTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(emailTemplates).set(data).where(eq(emailTemplates.id, id));
}

export async function deleteEmailTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
}

// ============ VOUCHER CODE FUNCTIONS ============

export async function createVoucherCode(voucher: InsertVoucherCode) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(voucherCodes).values(voucher);
  return Number(result[0].insertId);
}

export async function getAllVoucherCodes() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(voucherCodes).orderBy(desc(voucherCodes.createdAt));
}

export async function getVoucherCodeByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(voucherCodes).where(eq(voucherCodes.code, code)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateVoucherCode(id: number, data: Partial<VoucherCode>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(voucherCodes).set(data).where(eq(voucherCodes.id, id));
}

export async function deleteVoucherCode(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(voucherCodes).where(eq(voucherCodes.id, id));
}

// ============ DESIGN PACKAGE FUNCTIONS ============

export async function createDesignPackage(pkg: InsertDesignPackage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(designPackages).values(pkg);
  return Number(result[0].insertId);
}

export async function getAllDesignPackages() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(designPackages).orderBy(designPackages.sortOrder);
}

export async function getActiveDesignPackages() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(designPackages)
    .where(eq(designPackages.isActive, true))
    .orderBy(designPackages.sortOrder);
}

export async function updateDesignPackage(id: number, data: Partial<DesignPackage>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(designPackages).set(data).where(eq(designPackages.id, id));
}

export async function deleteDesignPackage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(designPackages).where(eq(designPackages.id, id));
}

// ============ ORDER FUNCTIONS ============

export async function createOrder(order: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(orders).values(order);
  return Number(result[0].insertId);
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrdersByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function updateOrder(id: number, data: Partial<Order>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set(data).where(eq(orders.id, id));
}

// ============ SURVEY FUNCTIONS ============

export async function createSurvey(survey: InsertSurvey) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(surveys).values(survey);
  return Number(result[0].insertId);
}

export async function getSurveyByJobId(jobId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(surveys).where(eq(surveys.jobId, jobId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllSurveys() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(surveys).orderBy(desc(surveys.createdAt));
}

export async function getCompletedSurveys() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(surveys)
    .where(sql`${surveys.completedAt} IS NOT NULL`)
    .orderBy(desc(surveys.completedAt));
}

export async function updateSurvey(id: number, data: Partial<Survey>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(surveys).set(data).where(eq(surveys.id, id));
}

// ============ SETTINGS FUNCTIONS ============

export async function getSetting(key: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertSetting(setting: InsertSetting) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(settings).values(setting).onDuplicateKeyUpdate({
    set: {
      value: setting.value,
      description: setting.description,
    },
  });
}

export async function getAllSettings() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(settings).orderBy(settings.key);
}
