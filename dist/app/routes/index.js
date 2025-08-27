"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const auth_route_1 = require("../modules/auth/auth.route");
const user_route_1 = require("../modules/user/user.route");
const wallet_route_1 = require("../modules/wallet/wallet.route");
const transaction_route_1 = require("../modules/transaction/transaction.route");
const systemConfig_routes_1 = require("../modules/systemConfig/systemConfig.routes");
const stats_routes_1 = require("../modules/stats/stats.routes");
const otp_route_1 = require("../modules/otp/otp.route");
exports.router = (0, express_1.Router)();
const moduleRoutes = [
    {
        path: "/user",
        route: user_route_1.UserRoutes
    },
    {
        path: "/auth",
        route: auth_route_1.AuthRoutes
    },
    {
        path: "/otp",
        route: otp_route_1.OtpRoutes
    },
    {
        path: "/wallet",
        route: wallet_route_1.WalletRoutes
    },
    {
        path: "/transaction",
        route: transaction_route_1.TransactionRoutes
    },
    {
        path: "/system-config",
        route: systemConfig_routes_1.SystemConfigRoutes
    },
    {
        path: "/stats",
        route: stats_routes_1.StatsRoutes
    },
];
moduleRoutes.forEach((route) => {
    exports.router.use(route.path, route.route);
});
