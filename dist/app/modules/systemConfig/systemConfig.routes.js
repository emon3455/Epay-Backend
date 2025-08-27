"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemConfigRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_interface_1 = require("../user/user.interface");
const systemConfig_controller_1 = require("./systemConfig.controller");
const checkAuth_1 = require("../../middlewares/checkAuth");
const router = express_1.default.Router();
router.get("/", (0, checkAuth_1.checkAuth)(user_interface_1.Role.USER, user_interface_1.Role.AGENT, user_interface_1.Role.ADMIN, user_interface_1.Role.SUPER_ADMIN), systemConfig_controller_1.getSystemConfig); // anyone logged-in can read
router.put("/", (0, checkAuth_1.checkAuth)(user_interface_1.Role.ADMIN, user_interface_1.Role.SUPER_ADMIN), systemConfig_controller_1.putSystemConfig); // only ADMINS can change
exports.SystemConfigRoutes = router;
