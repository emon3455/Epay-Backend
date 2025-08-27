"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemConfigService = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const systemConfig_model_1 = require("./systemConfig.model");
const getConfig = () => __awaiter(void 0, void 0, void 0, function* () {
    const cfg = yield systemConfig_model_1.SystemConfig.findById("SYSTEM");
    if (!cfg) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "System config not found");
    }
    return cfg.toObject();
});
const upsertConfig = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // sanity checks
    ["agentCashInRate", "userSendMoneyRate", "userWithdrawRate"].forEach((k) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const v = payload[k];
        if (v != null && v < 0) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, `${k} cannot be negative`);
        }
    });
    const updated = yield systemConfig_model_1.SystemConfig.findByIdAndUpdate("SYSTEM", { $set: payload }, { new: true, upsert: true, setDefaultsOnInsert: true });
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return updated;
});
exports.SystemConfigService = { getConfig, upsertConfig };
