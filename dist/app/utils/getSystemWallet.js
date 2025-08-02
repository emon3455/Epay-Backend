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
exports.getSystemWallet = void 0;
const wallet_model_1 = require("../modules/wallet/wallet.model");
const user_model_1 = require("../modules/user/user.model");
const env_1 = require("../config/env");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const AppError_1 = __importDefault(require("../errorHelpers/AppError"));
const getSystemWallet = () => __awaiter(void 0, void 0, void 0, function* () {
    const systemUser = yield user_model_1.User.findOne({ email: env_1.envVars.SUPER_ADMIN_EMAIL });
    if (!systemUser)
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "System admin not found");
    const systemWallet = yield wallet_model_1.Wallet.findOne({ user: systemUser._id });
    if (!systemWallet)
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "System wallet not found");
    return systemWallet;
});
exports.getSystemWallet = getSystemWallet;
