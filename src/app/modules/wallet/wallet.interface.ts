import { Types } from "mongoose";
import { IsActive } from "../user/user.interface";

export interface IWallet {
    _id?: Types.ObjectId
    user?: Types.ObjectId
    isActive?: IsActive;
    balance?: number;
}