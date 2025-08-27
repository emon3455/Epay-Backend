"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentCashZodSchema = exports.sendMoneyZodSchema = exports.withdrawMoneyZodSchema = exports.addMoneyZodSchema = exports.updateWalletZodSchema = exports.createWalletZodSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const user_interface_1 = require("../user/user.interface");
const mongoose_1 = __importDefault(require("mongoose"));
exports.createWalletZodSchema = zod_1.default.object({
    user: zod_1.default.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
        message: "Invalid user ObjectId",
    }),
    balance: zod_1.default.number({ invalid_type_error: "Balance must be number" }),
    isActive: zod_1.default.enum(Object.values(user_interface_1.IsActive)).optional(),
});
exports.updateWalletZodSchema = zod_1.default.object({
    user: zod_1.default.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
        message: "Invalid user ObjectId",
    }),
    balance: zod_1.default
        .number({ invalid_type_error: "Balance must be number" })
        .min(0, { message: "Balance cannot be negative" }),
    isActive: zod_1.default.enum(Object.values(user_interface_1.IsActive)).optional(),
});
// ✅ Add Money
exports.addMoneyZodSchema = zod_1.default.object({
    id: zod_1.default.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
        message: "Invalid user Id",
    }),
    amount: zod_1.default
        .number({ invalid_type_error: "Amount must be a number" })
        .positive({ message: "Amount must be greater than zero" }),
});
// ✅ Withdraw Money
exports.withdrawMoneyZodSchema = zod_1.default.object({
    agentId: zod_1.default.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
        message: "Invalid Agent Id",
    }),
    amount: zod_1.default
        .number({ invalid_type_error: "Amount must be a number" })
        .positive({ message: "Amount must be greater than zero" }),
});
// ✅ Send Money
exports.sendMoneyZodSchema = zod_1.default.object({
    receiverEmailOrPhone: zod_1.default
        .string({ required_error: "Receiver email or phone is required" })
        .min(5, { message: "Receiver email or phone is too short" }),
    amount: zod_1.default
        .number({ invalid_type_error: "Amount must be a number" })
        .positive({ message: "Amount must be greater than zero" }),
});
// ✅ Agent Cash In / Out
exports.agentCashZodSchema = zod_1.default.object({
    userId: zod_1.default
        .string({ required_error: "User ID is required" })
        .refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
        message: "Invalid user ObjectId",
    }),
    amount: zod_1.default
        .number({ invalid_type_error: "Amount must be a number" })
        .positive({ message: "Amount must be greater than zero" }),
});
