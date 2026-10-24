import argon2 from "argon2";
import status from "http-status";
import { Types } from "mongoose";
import type { z } from "zod";
import AppError from "../../errors/app-error.js";
import { SessionModel } from "../sessions/session.model.js";
import { UserModel } from "./user.model.js";
import {
  createUserSchema,
  updateUserSchema,
} from "./user.validation.js";

type CreateUserInput = z.infer<typeof createUserSchema>;
type UpdateUserInput = z.infer<typeof updateUserSchema>;

export interface SafeManagedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  interests: string[];
}

const toSafeUser = (user: {
  _id: { toString(): string };
  name: string;
  email: string;
  role: string;
  interests: string[];
}): SafeManagedUser => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  interests: user.interests,
});

const duplicateEmailError = () =>
  new AppError(status.CONFLICT, "An account with this email already exists.");

export const createUser = async (input: CreateUserInput) => {
  try {
    const user = await UserModel.create({
      name: input.name,
      email: input.email,
      passwordHash: await argon2.hash(input.password),
      role: input.role,
      interests: input.interests ?? [],
    });

    return toSafeUser(user);
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      throw duplicateEmailError();
    }
    throw error;
  }
};

export const updateUser = async (id: string, input: UpdateUserInput) => {
  const user = await UserModel.findById(id);
  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found.");
  }

  if (input.name !== undefined) user.name = input.name;
  if (input.email !== undefined) user.email = input.email;
  if (input.role !== undefined) user.role = input.role;
  if (input.interests !== undefined) user.interests = input.interests;
  if (input.password !== undefined) {
    user.passwordHash = await argon2.hash(input.password);
  }

  try {
    await user.save();
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      throw duplicateEmailError();
    }
    throw error;
  }

  return toSafeUser(user);
};

export const deleteUser = async (id: string) => {
  const user = await UserModel.findByIdAndDelete(id);
  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found.");
  }

  await SessionModel.deleteMany({ userId: user._id });
};

export interface GroupedInterestUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
}

export interface GroupedInterest {
  interest: string;
  users: GroupedInterestUser[];
}

export const getUsersGroupedByInterests = async (): Promise<
  GroupedInterest[]
> => {
  return UserModel.aggregate<GroupedInterest>([
    {
      $unwind: {
        path: "$interests",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $match: {
        interests: { $type: "string", $ne: "" },
      },
    },
    {
      $sort: {
        interests: 1,
        _id: 1,
      },
    },
    {
      $group: {
        _id: {
          interest: "$interests",
          userId: "$_id",
        },
        user: {
          $first: {
            _id: "$_id",
            name: "$name",
            email: "$email",
          },
        },
      },
    },
    {
      $group: {
        _id: "$_id.interest",
        users: {
          $push: "$user",
        },
      },
    },
    {
      $project: {
        _id: 0,
        interest: "$_id",
        users: 1,
      },
    },
    {
      $sort: {
        interest: 1,
      },
    },
  ]);
};
