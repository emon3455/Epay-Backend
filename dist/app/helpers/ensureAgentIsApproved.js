"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureAgentIsApproved = void 0;
const AppError_1 = __importDefault(require("../errorHelpers/AppError"));
const user_interface_1 = require("../modules/user/user.interface");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const ensureAgentIsApproved = (user) => {
    if (user.role === user_interface_1.Role.AGENT && user.isActive === user_interface_1.IsActive.PENDING) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Agent account is on pending state");
    }
};
exports.ensureAgentIsApproved = ensureAgentIsApproved;
