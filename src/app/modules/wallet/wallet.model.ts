import { model, Schema } from "mongoose";
import { IWallet } from "./wallet.interface";
import { IsActive } from "../user/user.interface";


const walletSchema = new Schema<IWallet>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    isActive: {
        type: String,
        enum: Object.values(IsActive),
        default: IsActive.ACTIVE,
    },
    balance: { type: Number, default: 50 },
})

export const Wallet = model<IWallet>("Wallet", walletSchema)