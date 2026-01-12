import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(role: "client" | "designer" | "manager" | "admin" = "admin"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-admin",
    email: "admin@example.com",
    name: "Test Admin",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("vouchers router", () => {
  describe("vouchers.create", () => {
    it("allows admins to create vouchers", async () => {
      const ctx = createMockContext("admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.vouchers.create({
        code: "TEST2024",
        discountType: "percentage",
        discountValue: "20",
        isActive: true,
      });

      expect(result).toBeDefined();
      expect(result.id).toBeTypeOf("number");
      expect(result.success).toBe(true);

      // Verify by fetching all vouchers
      const vouchers = await caller.vouchers.getAll();
      const created = vouchers.find(v => v.code === "TEST2024");
      expect(created).toBeDefined();
      expect(created?.discountType).toBe("percentage");
      expect(created?.discountValue).toBe("20");
    });

    it("prevents non-admins from creating vouchers", async () => {
      const ctx = createMockContext("client");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.vouchers.create({
          code: "UNAUTHORIZED",
          discountType: "fixed",
          discountValue: "50",
          isActive: true,
        })
      ).rejects.toThrow();
    });
  });

  describe("vouchers.validate", () => {
    it("validates active vouchers correctly", async () => {
      const ctx = createMockContext("admin");
      const caller = appRouter.createCaller(ctx);

      // Create a voucher
      await caller.vouchers.create({
        code: "VALID2024",
        discountType: "percentage",
        discountValue: "15",
        isActive: true,
      });

      // Validate it
      const result = await caller.vouchers.validate({ code: "VALID2024" });

      expect(result.valid).toBe(true);
      expect(result.voucher?.code).toBe("VALID2024");
    });

    it("rejects non-existent vouchers", async () => {
      const ctx = createMockContext("client");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.vouchers.validate({ code: "NONEXISTENT" });

      expect(result.valid).toBe(false);
      expect(result.voucher).toBeUndefined();
    });
  });

  describe("vouchers.update", () => {
    it("allows admins to update vouchers", async () => {
      const ctx = createMockContext("admin");
      const caller = appRouter.createCaller(ctx);

      const createResult = await caller.vouchers.create({
        code: "UPDATE2024",
        discountType: "percentage",
        discountValue: "10",
        isActive: true,
      });

      const updateResult = await caller.vouchers.update({
        id: createResult.id,
        discountValue: "25",
      });

      expect(updateResult.success).toBe(true);

      // Verify the update
      const vouchers = await caller.vouchers.getAll();
      const updated = vouchers.find(v => v.id === createResult.id);
      expect(updated?.discountValue).toBe("25");
    });
  });

  describe("vouchers.delete", () => {
    it("allows admins to delete vouchers", async () => {
      const ctx = createMockContext("admin");
      const caller = appRouter.createCaller(ctx);

      const createResult = await caller.vouchers.create({
        code: "DELETE2024",
        discountType: "fixed",
        discountValue: "100",
        isActive: true,
      });

      const deleteResult = await caller.vouchers.delete({ id: createResult.id });
      expect(deleteResult.success).toBe(true);

      // Verify it's deleted
      const vouchers = await caller.vouchers.getAll();
      const found = vouchers.find(v => v.id === createResult.id);
      expect(found).toBeUndefined();
    });
  });
});

describe("emailTemplates router", () => {
  describe("emailTemplates.create", () => {
    it("allows admins to create email templates", async () => {
      const ctx = createMockContext("admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.emailTemplates.create({
        name: "Job Completed",
        subject: "Your design is ready!",
        body: "Hello {{userName}}, your job {{jobTitle}} is complete.",
        isActive: true,
      });

      expect(result).toBeDefined();
      expect(result.id).toBeTypeOf("number");
      expect(result.success).toBe(true);

      // Verify by fetching all templates
      const templates = await caller.emailTemplates.getAll();
      const created = templates.find(t => t.name === "Job Completed");
      expect(created).toBeDefined();
      expect(created?.subject).toBe("Your design is ready!");
    });

    it("prevents non-admins from creating templates", async () => {
      const ctx = createMockContext("designer");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.emailTemplates.create({
          name: "Unauthorized Template",
          subject: "Test",
          body: "Test body",
          isActive: true,
        })
      ).rejects.toThrow();
    });
  });

  describe("emailTemplates.getAll", () => {
    it("returns all email templates for admins", async () => {
      const ctx = createMockContext("admin");
      const caller = appRouter.createCaller(ctx);

      // Create a template
      await caller.emailTemplates.create({
        name: "Welcome Email",
        subject: "Welcome!",
        body: "Welcome to our platform!",
        isActive: true,
      });

      const templates = await caller.emailTemplates.getAll();

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });
  });

  describe("emailTemplates.update", () => {
    it("allows admins to update email templates", async () => {
      const ctx = createMockContext("admin");
      const caller = appRouter.createCaller(ctx);

      const createResult = await caller.emailTemplates.create({
        name: "Update Test",
        subject: "Original Subject",
        body: "Original body",
        isActive: true,
      });

      const updateResult = await caller.emailTemplates.update({
        id: createResult.id,
        subject: "Updated Subject",
        body: "Updated body content",
      });

      expect(updateResult.success).toBe(true);

      // Verify the update
      const templates = await caller.emailTemplates.getAll();
      const updated = templates.find(t => t.id === createResult.id);
      expect(updated?.subject).toBe("Updated Subject");
      expect(updated?.body).toBe("Updated body content");
    });
  });

  describe("emailTemplates.delete", () => {
    it("allows admins to delete email templates", async () => {
      const ctx = createMockContext("admin");
      const caller = appRouter.createCaller(ctx);

      const createResult = await caller.emailTemplates.create({
        name: "Delete Test",
        subject: "To be deleted",
        body: "This will be deleted",
        isActive: true,
      });

      const deleteResult = await caller.emailTemplates.delete({ id: createResult.id });
      expect(deleteResult.success).toBe(true);

      // Verify it's deleted
      const templates = await caller.emailTemplates.getAll();
      const found = templates.find(t => t.id === createResult.id);
      expect(found).toBeUndefined();
    });
  });
});

describe("analytics router", () => {
  describe("analytics.getJobStats", () => {
    it("returns job statistics for admins", async () => {
      const ctx = createMockContext("admin");
      const caller = appRouter.createCaller(ctx);

      const stats = await caller.analytics.getJobStats();

      expect(stats).toBeDefined();
      expect(stats.total).toBeTypeOf("number");
      expect(stats.byStatus).toBeDefined();
    });

    it("prevents non-admins from accessing analytics", async () => {
      const ctx = createMockContext("client");
      const caller = appRouter.createCaller(ctx);

      await expect(caller.analytics.getJobStats()).rejects.toThrow();
    });
  });

  describe("analytics.getSurveyStats", () => {
    it("returns survey statistics for admins", async () => {
      const ctx = createMockContext("admin");
      const caller = appRouter.createCaller(ctx);

      const stats = await caller.analytics.getSurveyStats();

      expect(stats).toBeDefined();
      expect(stats.totalSurveys).toBeTypeOf("number");
      expect(stats.averageRatings).toBeDefined();
      expect(stats.recommendationRate).toBeTypeOf("number");
    });
  });
});

describe("departments router", () => {
  describe("departments.getActive", () => {
    it("returns active departments for all users", async () => {
      const ctx = createMockContext("client");
      const caller = appRouter.createCaller(ctx);

      const departments = await caller.departments.getActive();

      expect(Array.isArray(departments)).toBe(true);
    });
  });

  describe("departments.create", () => {
    it("allows admins to create departments", async () => {
      const ctx = createMockContext("admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.departments.create({
        name: "Test Department",
        description: "A test department",
      });

      expect(result.success).toBe(true);
      expect(result.id).toBeTypeOf("number");
    });

    it("prevents non-admins from creating departments", async () => {
      const ctx = createMockContext("designer");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.departments.create({
          name: "Unauthorized Dept",
        })
      ).rejects.toThrow();
    });
  });
});
