"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
const mongoose_1 = require("mongoose");
const transaction_interface_1 = require("./transaction.interface");
const transactionSchema = new mongoose_1.Schema({
    type: { type: String, enum: transaction_interface_1.TransactionType, required: true },
    amount: { type: Number, required: true },
    sender: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    receiver: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    agent: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    fee: { type: Number, default: 0 },
    commission: { type: Number, default: 0 },
}, { timestamps: true });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ amount: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ sender: 1 });
transactionSchema.index({ receiver: 1 });
transactionSchema.index({ agent: 1 });
exports.Transaction = (0, mongoose_1.model)("Transaction", transactionSchema);
