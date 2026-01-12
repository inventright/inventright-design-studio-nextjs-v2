import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";

// Initialize Stripe (will use STRIPE_SECRET_KEY from environment)
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover",
    })
  : null;

// Department pricing (in cents)
const DEPARTMENT_PRICES: Record<string, number> = {
  "Sell Sheets": 29900, // $299
  "Virtual Prototypes": 49900, // $499
  "Line Drawings": 19900, // $199
  "Design Package": 59900, // $599 (20% discount from $299 + $499 = $798)
};

export const paymentsRouter = router({
  // Create a payment intent for a job
  createPaymentIntent: protectedProcedure
    .input(
      z.object({
        departmentName: z.string(),
        isPackage: z.boolean().optional(),
        voucherDiscount: z.number().optional(), // Discount amount in cents
        jobTitle: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!stripe) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Stripe is not configured",
        });
      }

      // Calculate base amount
      let amount = DEPARTMENT_PRICES[input.departmentName] || 0;

      if (amount === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid department or pricing not configured",
        });
      }

      // Apply voucher discount
      if (input.voucherDiscount) {
        amount = Math.max(0, amount - input.voucherDiscount);
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        metadata: {
          userId: ctx.user.id.toString(),
          userName: ctx.user.name || "Unknown",
          userEmail: ctx.user.email || "unknown@example.com",
          departmentName: input.departmentName,
          isPackage: input.isPackage ? "true" : "false",
          jobTitle: input.jobTitle,
        },
        description: `Design Service: ${input.jobTitle}`,
      });

      return {
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        paymentIntentId: paymentIntent.id,
      };
    }),

  // Confirm payment was successful
  confirmPayment: protectedProcedure
    .input(
      z.object({
        paymentIntentId: z.string(),
      })
    )
    .query(async ({ input }) => {
      if (!stripe) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Stripe is not configured",
        });
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(input.paymentIntentId);

      return {
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        paid: paymentIntent.status === "succeeded",
      };
    }),

  // Get pricing for a department
  getPricing: protectedProcedure
    .input(
      z.object({
        departmentName: z.string(),
        isPackage: z.boolean().optional(),
      })
    )
    .query(({ input }) => {
      const basePrice = DEPARTMENT_PRICES[input.departmentName] || 0;

      return {
        basePrice,
        currency: "usd",
        formattedPrice: `$${(basePrice / 100).toFixed(2)}`,
      };
    }),
});
