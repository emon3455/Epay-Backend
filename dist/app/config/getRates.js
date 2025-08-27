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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRates = void 0;
const systemConfig_service_1 = require("../modules/systemConfig/systemConfig.service");
const getRates = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const cfg = yield systemConfig_service_1.SystemConfigService.getConfig();
    // Graceful defaults if any field is absent in DB
    return {
        agentCashInRate: (_a = cfg.agentCashInRate) !== null && _a !== void 0 ? _a : 0,
        agentCashOutRate: (_b = cfg.agentCashOutRate) !== null && _b !== void 0 ? _b : 0,
        userSendMoneyRate: (_c = cfg.userSendMoneyRate) !== null && _c !== void 0 ? _c : 0,
        userWithdrawRate: (_d = cfg.userWithdrawRate) !== null && _d !== void 0 ? _d : 0,
    };
});
exports.getRates = getRates;
