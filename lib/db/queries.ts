import { db } from "./index";
import {
  users,
  departments,
  jobs,
  emailTemplates,
  voucherCodes,
  fileUploads,
  messages,
  designPackages,
} from "./schema";
import { eq, and, desc } from "drizzle-orm";

// User queries
export async function getUserById(id: number) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export async function getUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

export async function getAllUsers() {
  return await db.select().from(users);
}

export async function getUsersByRole(
  role: "client" | "designer" | "manager" | "admin"
) {
  return await db.select().from(users).where(eq(users.role, role));
}

// Department queries
export async function getAllDepartments() {
  return await db.select().from(departments);
}

export async function getActiveDepartments() {
  return await db
    .select()
    .from(departments)
    .where(eq(departments.isActive, true));
}

export async function createDepartment(data: {
  name: string;
  description?: string;
  color?: string;
}) {
  const [department] = await db.insert(departments).values(data).returning();
  return department;
}

// Job queries
export async function getJobById(id: number) {
  const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
  return job;
}

export async function getJobsByClientId(clientId: number) {
  return await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.clientId, clientId), eq(jobs.archived, false)))
    .orderBy(desc(jobs.lastActivityDate));
}

export async function getJobsByDesignerId(designerId: number) {
  return await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.designerId, designerId), eq(jobs.archived, false)))
    .orderBy(desc(jobs.lastActivityDate));
}

export async function getAllActiveJobs() {
  return await db
    .select()
    .from(jobs)
    .where(eq(jobs.archived, false))
    .orderBy(desc(jobs.lastActivityDate));
}

export async function getArchivedJobs() {
  return await db
    .select()
    .from(jobs)
    .where(eq(jobs.archived, true))
    .orderBy(desc(jobs.lastActivityDate));
}

// Email template queries
export async function getAllEmailTemplates() {
  return await db.select().from(emailTemplates);
}

export async function getEmailTemplateById(id: number) {
  const [template] = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.id, id));
  return template;
}

// Voucher queries
export async function getAllVoucherCodes() {
  return await db.select().from(voucherCodes);
}

export async function getVoucherCodeByCode(code: string) {
  const [voucher] = await db
    .select()
    .from(voucherCodes)
    .where(eq(voucherCodes.code, code));
  return voucher;
}

// File queries
export async function getFilesByJobId(jobId: number) {
  return await db
    .select()
    .from(fileUploads)
    .where(eq(fileUploads.jobId, jobId))
    .orderBy(desc(fileUploads.createdAt));
}

// Message queries
export async function getMessagesByJobId(jobId: number) {
  return await db
    .select()
    .from(messages)
    .where(eq(messages.jobId, jobId))
    .orderBy(desc(messages.createdAt));
}

// Design package queries
export async function getActiveDesignPackages() {
  return await db
    .select()
    .from(designPackages)
    .where(eq(designPackages.isActive, true));
}

export async function getAllDesignPackages() {
  return await db.select().from(designPackages);
}
