import { Router } from "express"
import { AuthRoutes } from "../modules/auth/auth.route"
import { UserRoutes } from "../modules/user/user.route"
import { WalletRoutes } from "../modules/wallet/wallet.route"
import { TransactionRoutes } from "../modules/transaction/transaction.route"
import { SystemConfigRoutes } from "../modules/systemConfig/systemConfig.routes"

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
]

moduleRoutes.forEach((route) => {
    router.use(route.path, route.route)
})