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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserServices = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const env_1 = require("../../config/env");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const user_interface_1 = require("./user.interface");
const user_model_1 = require("./user.model");
const wallet_model_1 = require("../wallet/wallet.model");
const QueryBuilder_1 = require("../../utils/QueryBuilder");
const createUser = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, role = user_interface_1.Role.USER } = payload, rest = __rest(payload, ["email", "password", "role"]);
    const isUserExist = yield user_model_1.User.findOne({ email });
    if (isUserExist) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "User Already Exist");
    }
    const hashedPassword = yield bcryptjs_1.default.hash(password, Number(env_1.envVars.BCRYPT_SALT_ROUND));
    const authProvider = {
        provider: "credentials",
        providerId: email,
    };
    const isActive = role === user_interface_1.Role.AGENT ? user_interface_1.IsActive.PENDING : user_interface_1.IsActive.ACTIVE;
    const user = yield user_model_1.User.create(Object.assign({ email, password: hashedPassword, auths: [authProvider], role,
        isActive }, rest));
    yield wallet_model_1.Wallet.create({
        user: user._id,
        balance: 50,
    });
    return user;
});
const updateUser = (userId, payload, decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    const ifUserExist = yield user_model_1.User.findById(userId);
    if (!ifUserExist) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User Not Found");
    }
    if (payload.password) {
        payload.password = yield bcryptjs_1.default.hash(payload.password, env_1.envVars.BCRYPT_SALT_ROUND);
    }
    const newUpdatedUser = yield user_model_1.User.findByIdAndUpdate(userId, payload, {
        new: true,
        runValidators: true,
    });
    return newUpdatedUser;
});
const approveRejectAgent = (userId, payload, decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    const agent = yield user_model_1.User.findById(userId);
    if (!agent) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Agent Not Found");
    }
    agent.isActive = payload.isActive;
    yield agent.save();
    return agent;
});
const getAllUsers = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const modifiedQuery = Object.assign(Object.assign({}, query), { role: user_interface_1.Role.USER });
    const baseQuery = user_model_1.User.find();
    const queryBuilder = new QueryBuilder_1.QueryBuilder(baseQuery, modifiedQuery)
        .filter()
        .search(['name', 'email', 'phone'])
        .sort()
        .fields()
        .paginate();
    const users = yield queryBuilder.build();
    const meta = yield queryBuilder.getMeta();
    return {
        data: users,
        meta,
    };
});
const getAllAgent = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const modifiedQuery = Object.assign(Object.assign({}, query), { role: user_interface_1.Role.AGENT });
    const baseQuery = user_model_1.User.find();
    const queryBuilder = new QueryBuilder_1.QueryBuilder(baseQuery, modifiedQuery)
        .filter()
        .search(["name", "email", "phone"])
        .sort()
        .fields()
        .paginate();
    const agents = yield queryBuilder.build();
    const meta = yield queryBuilder.getMeta();
    return {
        data: agents,
        meta,
    };
});
exports.UserServices = {
    createUser,
    getAllUsers,
    updateUser,
    getAllAgent,
    approveRejectAgent,
};
