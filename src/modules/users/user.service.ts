import { Types } from "mongoose";
import { UserModel } from "./user.model.js";

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
