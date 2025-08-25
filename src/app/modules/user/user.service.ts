/* eslint-disable @typescript-eslint/no-unused-vars */
import bcryptjs from "bcryptjs";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { IAuthProvider, IsActive, IUser, Role } from "./user.interface";
import { User } from "./user.model";
import { Wallet } from "../wallet/wallet.model";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { IGenericResponse } from "../../interfaces/common";

const createUser = async (payload: Partial<IUser>) => {
  const { email, password, role = Role.USER, ...rest } = payload;

  const isUserExist = await User.findOne({ email });

  if (isUserExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "User Already Exist");
  }

  const hashedPassword = await bcryptjs.hash(
    password as string,
    Number(envVars.BCRYPT_SALT_ROUND)
  );

  const authProvider: IAuthProvider = {
    provider: "credentials",
    providerId: email as string,
  };

  const isActive = role === Role.AGENT ? IsActive.PENDING : IsActive.ACTIVE;

  const user = await User.create({
    email,
    password: hashedPassword,
    auths: [authProvider],
    role,
    isActive,
    ...rest,
  });

  await Wallet.create({
    user: user._id,
    balance: 50,
  });

  return user;
};

const updateUser = async (
  userId: string,
  payload: Partial<IUser>,
  decodedToken: JwtPayload
) => {
  const ifUserExist = await User.findById(userId);

  if (!ifUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }

  if (payload.password) {
    payload.password = await bcryptjs.hash(
      payload.password,
      envVars.BCRYPT_SALT_ROUND
    );
  }

  const newUpdatedUser = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  });

  return newUpdatedUser;
};

const approveRejectAgent = async (
  userId: string,
  payload: Partial<IUser>,
  decodedToken: JwtPayload
) => {
  const agent = await User.findById(userId);

  if (!agent) {
    throw new AppError(httpStatus.NOT_FOUND, "Agent Not Found");
  }

  agent.isActive = payload.isActive;

  await agent.save();
  return agent;
};

const approveRejectUser = async (
  userId: string,
  payload: Partial<IUser>,
  decodedToken: JwtPayload
) => {
  const agent = await User.findById(userId);

  if (!agent) {
    throw new AppError(httpStatus.NOT_FOUND, "Agent Not Found");
  }

  agent.isActive = payload.isActive;

  await agent.save();
  return agent;
};

const getAllUsers = async (
  query: Record<string, string>
): Promise<IGenericResponse<IUser[]>> => {
  const modifiedQuery = { ...query, role: Role.USER };

  const baseQuery = User.find();

  const queryBuilder = new QueryBuilder(baseQuery, modifiedQuery)
    .filter()
    .search(['name', 'email', 'phone'])
    .sort()
    .fields()
    .paginate();

  const users = await queryBuilder.build();
  const meta = await queryBuilder.getMeta();

  return {
    data: users,
    meta,
  };
};

const getAllAgent = async (
  query: Record<string, string>
): Promise<IGenericResponse<IUser[]>> => {
  const modifiedQuery = { ...query, role: Role.AGENT };

  const baseQuery = User.find();

  const queryBuilder = new QueryBuilder(baseQuery, modifiedQuery)
    .filter()
    .search(["name", "email", "phone"])
    .sort()
    .fields()
    .paginate();

  const agents = await queryBuilder.build();
  const meta = await queryBuilder.getMeta();

  return {
    data: agents,
    meta,
  };
};
const getMe = async (userId: string) => {
    const user = await User.findById(userId).select("-password");
    return {
        data: user
    }
};
export const UserServices = {
  createUser,
  getAllUsers,
  updateUser,
  getAllAgent,
  approveRejectAgent,
  approveRejectUser,
  getMe
};
