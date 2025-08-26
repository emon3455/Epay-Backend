import z from "zod";
import { IsActive } from "../user/user.interface";
import mongoose from "mongoose";

export const createWalletZodSchema = z.object({
  user: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid user ObjectId",
  }),
  balance: z.number({ invalid_type_error: "Balance must be number" }),
  isActive: z.enum(Object.values(IsActive) as [string]).optional(),
});

export const updateWalletZodSchema = z.object({
  user: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid user ObjectId",
  }),
  balance: z
    .number({ invalid_type_error: "Balance must be number" })
    .min(0, { message: "Balance cannot be negative" }),
  isActive: z.enum(Object.values(IsActive) as [string]).optional(),
});

// ✅ Add Money
export const addMoneyZodSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid user Id",
  }),
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .positive({ message: "Amount must be greater than zero" }),
});

// ✅ Withdraw Money
export const withdrawMoneyZodSchema = z.object({
  agentId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid Agent Id",
  }),
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .positive({ message: "Amount must be greater than zero" }),
});

// ✅ Send Money
export const sendMoneyZodSchema = z.object({
  receiverEmailOrPhone: z
    .string({ required_error: "Receiver email or phone is required" })
    .min(5, { message: "Receiver email or phone is too short" }),
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .positive({ message: "Amount must be greater than zero" }),
});

// ✅ Agent Cash In / Out
export const agentCashZodSchema = z.object({
  userId: z
    .string({ required_error: "User ID is required" })
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid user ObjectId",
    }),
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .positive({ message: "Amount must be greater than zero" }),
});
