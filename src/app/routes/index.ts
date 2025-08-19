import { Router } from "express"
import { AuthRoutes } from "../modules/auth/auth.route"
import { UserRoutes } from "../modules/user/user.route"
import { WalletRoutes } from "../modules/wallet/wallet.route"
import { TransactionRoutes } from "../modules/transaction/transaction.route"
import { SystemConfigRoutes } from "../modules/systemConfig/systemConfig.routes"
import { StatsRoutes } from "../modules/stats/stats.routes"

export const router = Router()

const moduleRoutes = [
    {
        path: "/user",
        route: UserRoutes
    },
    {
        path: "/auth",
        route: AuthRoutes
    },
    {
        path: "/wallet",
        route: WalletRoutes
    },
    {
        path: "/transaction",
        route: TransactionRoutes
    },
    {
        path: "/system-config",
        route: SystemConfigRoutes
    },
    {
        path: "/stats",
        route: StatsRoutes
    },
]

moduleRoutes.forEach((route) => {
    router.use(route.path, route.route)
})