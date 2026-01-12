import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(role: "client" | "designer" | "manager" | "admin" = "client"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
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

describe("jobs router", () => {
  describe("jobs.create", () => {
    it("allows authenticated users to create a job", async () => {
      const ctx = createMockContext("client");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.jobs.create({
        title: "Test Design Job",
        description: "This is a test job description",
        priority: "Medium",
        isDraft: false,
      });

      expect(result).toBeDefined();
      expect(result.id).toBeTypeOf("number");
      expect(result.success).toBe(true);

      // Verify the job was created by fetching it
      const job = await caller.jobs.getById({ id: result.id });
      expect(job.title).toBe("Test Design Job");
      expect(job.clientId).toBe(1);
    });

    it("creates a draft job when isDraft is true", async () => {
      const ctx = createMockContext("client");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.jobs.create({
        title: "Draft Job",
        description: "Draft description",
        priority: "Low",
        isDraft: true,
      });

      expect(result.success).toBe(true);

      const job = await caller.jobs.getById({ id: result.id });
      expect(job.isDraft).toBe(true);
    });

    it("rejects job creation without authentication", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: { clearCookie: () => {} } as TrpcContext["res"],
      };
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.jobs.create({
          title: "Unauthorized Job",
          description: "Should fail",
          priority: "High",
          isDraft: false,
        })
      ).rejects.toThrow();
    });
  });

  describe("jobs.getMyJobs", () => {
    it("returns jobs for the authenticated client", async () => {
      const ctx = createMockContext("client");
      const caller = appRouter.createCaller(ctx);

      // Create a job first
      await caller.jobs.create({
        title: "My Test Job",
        description: "Test",
        priority: "Medium",
        isDraft: false,
      });

      const jobs = await caller.jobs.getMyJobs();
      
      expect(Array.isArray(jobs)).toBe(true);
      expect(jobs.length).toBeGreaterThan(0);
      expect(jobs[0]?.clientId).toBe(1);
    });

    it("returns assigned jobs for designers", async () => {
      const ctx = createMockContext("designer");
      const caller = appRouter.createCaller(ctx);

      const jobs = await caller.jobs.getMyJobs();
      
      expect(Array.isArray(jobs)).toBe(true);
      // Designer should see jobs assigned to them (may be empty in test)
    });
  });

  describe("jobs.update", () => {
    it("allows designers to update job status", async () => {
      const clientCtx = createMockContext("client");
      const clientCaller = appRouter.createCaller(clientCtx);

      // Create a job as client
      const createResult = await clientCaller.jobs.create({
        title: "Job to Update",
        description: "Test",
        priority: "High",
        isDraft: false,
      });

      // Update as designer
      const designerCtx = createMockContext("designer");
      const designerCaller = appRouter.createCaller(designerCtx);

      const updateResult = await designerCaller.jobs.update({
        id: createResult.id,
        status: "In Progress",
      });

      expect(updateResult.success).toBe(true);

      // Verify the update
      const job = await designerCaller.jobs.getById({ id: createResult.id });
      expect(job.status).toBe("In Progress");
    });

    it("allows clients to update their own job details", async () => {
      const ctx = createMockContext("client");
      const caller = appRouter.createCaller(ctx);

      const createResult = await caller.jobs.create({
        title: "Client Job",
        description: "Test",
        priority: "Medium",
        isDraft: false,
      });

      // Clients can update their own jobs (but not status if not staff)
      const updateResult = await caller.jobs.update({
        id: createResult.id,
        title: "Updated Title",
      });

      expect(updateResult.success).toBe(true);
    });
  });

  describe("jobs.getById", () => {
    it("allows job owner to view their job", async () => {
      const ctx = createMockContext("client");
      const caller = appRouter.createCaller(ctx);

      const createResult = await caller.jobs.create({
        title: "My Job",
        description: "Test",
        priority: "Medium",
        isDraft: false,
      });

      const job = await caller.jobs.getById({ id: createResult.id });
      
      expect(job).toBeDefined();
      expect(job.title).toBe("My Job");
      expect(job.clientId).toBe(1);
    });

    it("prevents unauthorized access to jobs", async () => {
      const client1Ctx = createMockContext("client");
      const client1Caller = appRouter.createCaller(client1Ctx);

      const createResult = await client1Caller.jobs.create({
        title: "Private Job",
        description: "Test",
        priority: "High",
        isDraft: false,
      });

      // Try to access as different client
      const client2Ctx = createMockContext("client");
      client2Ctx.user!.id = 999; // Different user ID
      const client2Caller = appRouter.createCaller(client2Ctx);

      await expect(
        client2Caller.jobs.getById({ id: createResult.id })
      ).rejects.toThrow();
    });
  });

  describe("jobs.getAll", () => {
    it("allows managers to view all jobs", async () => {
      const ctx = createMockContext("manager");
      const caller = appRouter.createCaller(ctx);

      const jobs = await caller.jobs.getAll();
      
      expect(Array.isArray(jobs)).toBe(true);
    });

    it("prevents clients from viewing all jobs", async () => {
      const ctx = createMockContext("client");
      const caller = appRouter.createCaller(ctx);

      await expect(caller.jobs.getAll()).rejects.toThrow();
    });
  });
});
