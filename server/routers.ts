import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { paymentsRouter } from "./routers/payments";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { storagePut } from "./storage";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "manager") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// Designer procedure (designer, manager, or admin)
const designerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!["designer", "manager", "admin"].includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Designer access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  payments: paymentsRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ USER MANAGEMENT ============
  users: router({
    getAll: adminProcedure.query(async () => {
      return await db.getAllUsers();
    }),
    
    getByRole: adminProcedure
      .input(z.object({ role: z.enum(["client", "designer", "manager", "admin"]) }))
      .query(async ({ input }) => {
        return await db.getUsersByRole(input.role);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        // Users can only view their own profile unless they're admin
        if (input.id !== ctx.user.id && ctx.user.role !== "admin" && ctx.user.role !== "manager") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await db.getUserById(input.id);
      }),
  }),

  // ============ DEPARTMENTS ============
  departments: router({
    getAll: protectedProcedure.query(async () => {
      return await db.getAllDepartments();
    }),
    
    getActive: publicProcedure.query(async () => {
      return await db.getActiveDepartments();
    }),
    
    create: adminProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createDepartment(input);
        return { id, success: true };
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        color: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateDepartment(id, data);
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteDepartment(input.id);
        return { success: true };
      }),
  }),

  // ============ JOBS ============
  jobs: router({
    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        departmentId: z.number().optional(),
        packageType: z.string().optional(),
        priority: z.string().optional(),
        isDraft: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const jobId = await db.createJob({
          ...input,
          clientId: ctx.user.id,
          status: "Draft",
        });
        return { id: jobId, success: true };
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const job = await db.getJobById(input.id);
        if (!job) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
        }
        
        // Check access permissions
        const canAccess = 
          job.clientId === ctx.user.id ||
          job.designerId === ctx.user.id ||
          ["admin", "manager"].includes(ctx.user.role);
        
        if (!canAccess) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        return job;
      }),
    
    getMyJobs: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === "client") {
        return await db.getJobsByClientId(ctx.user.id);
      } else if (ctx.user.role === "designer") {
        return await db.getJobsByDesignerId(ctx.user.id);
      } else {
        return await db.getAllActiveJobs();
      }
    }),
    
    getAll: protectedProcedure.query(async ({ ctx }) => {
      // Only managers and admins can see all jobs
      if (!["admin", "manager"].includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return await db.getAllActiveJobs();
    }),
    
    getArchived: protectedProcedure.query(async ({ ctx }) => {
      if (!["admin", "manager"].includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return await db.getArchivedJobs();
    }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        designerId: z.number().optional(),
        departmentId: z.number().optional(),
        dueDate: z.date().optional(),
        completedDate: z.date().optional(),
        archived: z.boolean().optional(),
        isDraft: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, status, ...data } = input;
        const job = await db.getJobById(id);
        
        if (!job) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        // Check permissions
        const canUpdate = 
          job.clientId === ctx.user.id ||
          job.designerId === ctx.user.id ||
          ["admin", "manager"].includes(ctx.user.role);
        
        if (!canUpdate) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        // Track status changes
        if (status && status !== job.status) {
          await db.createJobStatusHistory({
            jobId: id,
            changedBy: ctx.user.id,
            oldStatus: job.status,
            newStatus: status,
          });
        }
        
        await db.updateJob(id, { ...data, ...(status ? { status } : {}) });
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteJob(input.id);
        return { success: true };
      }),
  }),

  // ============ FILE UPLOADS ============
  files: router({
    getByJobId: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ input, ctx }) => {
        const job = await db.getJobById(input.jobId);
        if (!job) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        const canAccess = 
          job.clientId === ctx.user.id ||
          job.designerId === ctx.user.id ||
          ["admin", "manager"].includes(ctx.user.role);
        
        if (!canAccess) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        return await db.getFilesByJobId(input.jobId);
      }),
    
    upload: protectedProcedure
      .input(z.object({
        jobId: z.number(),
        fileName: z.string(),
        fileData: z.string(), // base64 encoded
        mimeType: z.string(),
        fileType: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const job = await db.getJobById(input.jobId);
        if (!job) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        const canUpload = 
          job.clientId === ctx.user.id ||
          job.designerId === ctx.user.id ||
          ["admin", "manager"].includes(ctx.user.role);
        
        if (!canUpload) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        // Decode base64 and upload to S3
        const buffer = Buffer.from(input.fileData, 'base64');
        const fileKey = `jobs/${input.jobId}/${Date.now()}-${input.fileName}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        
        const fileId = await db.createFileUpload({
          jobId: input.jobId,
          uploadedBy: ctx.user.id,
          fileName: input.fileName,
          fileUrl: url,
          fileKey: fileKey,
          fileSize: buffer.length,
          mimeType: input.mimeType,
          fileType: input.fileType || "input",
        });
        
        return { id: fileId, url, success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // TODO: Also delete from S3
        await db.deleteFileUpload(input.id);
        return { success: true };
      }),
  }),

  // ============ MESSAGES/COMMENTS ============
  messages: router({
    getByJobId: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ input, ctx }) => {
        const job = await db.getJobById(input.jobId);
        if (!job) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        const canAccess = 
          job.clientId === ctx.user.id ||
          job.designerId === ctx.user.id ||
          ["admin", "manager"].includes(ctx.user.role);
        
        if (!canAccess) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        const messages = await db.getMessagesByJobId(input.jobId);
        
        // Filter out internal messages for clients
        if (ctx.user.role === "client") {
          return messages.filter(m => !m.isInternal);
        }
        
        return messages;
      }),
    
    create: protectedProcedure
      .input(z.object({
        jobId: z.number(),
        content: z.string(),
        isInternal: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const job = await db.getJobById(input.jobId);
        if (!job) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        const canComment = 
          job.clientId === ctx.user.id ||
          job.designerId === ctx.user.id ||
          ["admin", "manager"].includes(ctx.user.role);
        
        if (!canComment) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        // Only staff can create internal messages
        const isInternal = input.isInternal && ["designer", "manager", "admin"].includes(ctx.user.role);
        
        const messageId = await db.createMessage({
          jobId: input.jobId,
          userId: ctx.user.id,
          content: input.content,
          isInternal: isInternal || false,
        });
        
        // Update job activity
        await db.updateJob(input.jobId, {});
        
        return { id: messageId, success: true };
      }),
  }),

  // ============ JOB STATUS HISTORY ============
  jobHistory: router({
    getByJobId: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ input, ctx }) => {
        const job = await db.getJobById(input.jobId);
        if (!job) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        const canAccess = 
          job.clientId === ctx.user.id ||
          job.designerId === ctx.user.id ||
          ["admin", "manager"].includes(ctx.user.role);
        
        if (!canAccess) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        return await db.getJobStatusHistory(input.jobId);
      }),
  }),

  // ============ EMAIL TEMPLATES ============
  emailTemplates: router({
    getAll: adminProcedure.query(async () => {
      return await db.getAllEmailTemplates();
    }),
    
    create: adminProcedure
      .input(z.object({
        name: z.string(),
        subject: z.string(),
        body: z.string(),
        triggerEvent: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createEmailTemplate(input);
        return { id, success: true };
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        subject: z.string().optional(),
        body: z.string().optional(),
        triggerEvent: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateEmailTemplate(id, data);
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteEmailTemplate(input.id);
        return { success: true };
      }),
  }),

  // ============ VOUCHER CODES ============
  vouchers: router({
    getAll: adminProcedure.query(async () => {
      return await db.getAllVoucherCodes();
    }),
    
    validate: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        const voucher = await db.getVoucherCodeByCode(input.code);
        
        if (!voucher || !voucher.isActive) {
          return { valid: false, message: "Invalid voucher code" };
        }
        
        const now = new Date();
        if (voucher.validFrom && new Date(voucher.validFrom) > now) {
          return { valid: false, message: "Voucher not yet valid" };
        }
        
        if (voucher.validUntil && new Date(voucher.validUntil) < now) {
          return { valid: false, message: "Voucher has expired" };
        }
        
        if (voucher.maxUses && voucher.usedCount >= voucher.maxUses) {
          return { valid: false, message: "Voucher usage limit reached" };
        }
        
        return {
          valid: true,
          voucher: {
            code: voucher.code,
            discountType: voucher.discountType,
            discountValue: voucher.discountValue,
          },
        };
      }),
    
    create: adminProcedure
      .input(z.object({
        code: z.string(),
        discountType: z.string(),
        discountValue: z.string(),
        maxUses: z.number().optional(),
        validFrom: z.date().optional(),
        validUntil: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createVoucherCode(input);
        return { id, success: true };
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        code: z.string().optional(),
        discountType: z.string().optional(),
        discountValue: z.string().optional(),
        maxUses: z.number().optional(),
        validFrom: z.date().optional(),
        validUntil: z.date().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateVoucherCode(id, data);
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteVoucherCode(input.id);
        return { success: true };
      }),
  }),

  // ============ DESIGN PACKAGES ============
  packages: router({
    getAll: publicProcedure.query(async () => {
      return await db.getActiveDesignPackages();
    }),
    
    getAllAdmin: adminProcedure.query(async () => {
      return await db.getAllDesignPackages();
    }),
    
    create: adminProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        price: z.string(),
        currency: z.string().optional(),
        features: z.string().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createDesignPackage(input);
        return { id, success: true };
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        price: z.string().optional(),
        features: z.string().optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateDesignPackage(id, data);
        return { success: true };
      }),
  }),

  // ============ SURVEYS ============
  surveys: router({
    getAll: adminProcedure.query(async () => {
      return await db.getAllSurveys();
    }),
    
    getCompleted: adminProcedure.query(async () => {
      return await db.getCompletedSurveys();
    }),
    
    getByJobId: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ input }) => {
        return await db.getSurveyByJobId(input.jobId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        jobId: z.number(),
        overallSatisfaction: z.number().min(1).max(5),
        communicationRating: z.number().min(1).max(5),
        qualityRating: z.number().min(1).max(5),
        timelinessRating: z.number().min(1).max(5),
        feedback: z.string().optional(),
        wouldRecommend: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        const job = await db.getJobById(input.jobId);
        if (!job) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        if (job.clientId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        const id = await db.createSurvey({
          ...input,
          clientId: ctx.user.id,
          completedAt: new Date(),
        });
        
        return { id, success: true };
      }),
  }),

  // ============ ANALYTICS ============
  analytics: router({
    getJobStats: adminProcedure.query(async () => {
      const allJobs = await db.getAllActiveJobs();
      const archivedJobs = await db.getArchivedJobs();
      
      const statusCounts = allJobs.reduce((acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return {
        total: allJobs.length,
        archived: archivedJobs.length,
        byStatus: statusCounts,
      };
    }),
    
    getSurveyStats: adminProcedure.query(async () => {
      const surveys = await db.getCompletedSurveys();
      
      if (surveys.length === 0) {
        return {
          totalSurveys: 0,
          averageRatings: {
            overall: 0,
            communication: 0,
            quality: 0,
            timeliness: 0,
          },
          recommendationRate: 0,
        };
      }
      
      const totals = surveys.reduce(
        (acc, survey) => ({
          overall: acc.overall + (survey.overallSatisfaction || 0),
          communication: acc.communication + (survey.communicationRating || 0),
          quality: acc.quality + (survey.qualityRating || 0),
          timeliness: acc.timeliness + (survey.timelinessRating || 0),
          wouldRecommend: acc.wouldRecommend + (survey.wouldRecommend ? 1 : 0),
        }),
        { overall: 0, communication: 0, quality: 0, timeliness: 0, wouldRecommend: 0 }
      );
      
      return {
        totalSurveys: surveys.length,
        averageRatings: {
          overall: totals.overall / surveys.length,
          communication: totals.communication / surveys.length,
          quality: totals.quality / surveys.length,
          timeliness: totals.timeliness / surveys.length,
        },
        recommendationRate: (totals.wouldRecommend / surveys.length) * 100,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
