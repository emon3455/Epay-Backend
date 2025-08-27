"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemConfig = void 0;
const mongoose_1 = require("mongoose");
const systemConfigSchema = new mongoose_1.Schema({
    _id: { type: String, default: "SYSTEM" },
    agentCashInRate: { type: Number, required: true, min: 0 },
    agentCashOutRate: { type: Number, required: true, min: 0 },
    userSendMoneyRate: { type: Number, required: true, min: 0 },
    userWithdrawRate: { type: Number, required: true, min: 0 },
}, {
    timestamps: true,
    versionKey: false,
});
exports.SystemConfig = (0, mongoose_1.model)("SystemConfig", systemConfigSchema);
