import status from "http-status";
import { Types } from "mongoose";
import AppError from "../../errors/app-error.js";
import { getPagination } from "../../utils/pagination.js";
import { UserModel, UserRole } from "../users/user.model.js";
import { PostModel, type Post } from "./post.model.js";

type AuthenticatedUser = {
  userId: string;
  role: UserRole;
};

const requireUser = (user: AuthenticatedUser | undefined) => {
  if (!user) {
    throw new AppError(status.UNAUTHORIZED, "Authentication required.");
  }
  return user;
};

const getPostFilter = (user: AuthenticatedUser, postId?: string) => ({
  ...(postId ? { _id: postId } : {}),
  ...(user.role === UserRole.USER ? { userId: user.userId } : {}),
});

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const createPost = async (
  user: AuthenticatedUser | undefined,
  input: { title: string; content: string },
) => {
  const authenticatedUser = requireUser(user);
  return PostModel.create({
    title: input.title,
    content: input.content,
    userId: authenticatedUser.userId,
  });
};

export const listPosts = async (
  page: number,
  limit: number,
  search?: string,
) => {
  const { skip } = getPagination(page, limit);
  const filter = search
    ? {
        $or: [
          { title: { $regex: escapeRegex(search), $options: "i" } },
          { content: { $regex: escapeRegex(search), $options: "i" } },
        ],
      }
    : {};
  const [posts, total] = await Promise.all([
    PostModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    PostModel.countDocuments(filter),
  ]);
  return { posts, total };
};

export const getPost = async (postId: string) => {
  const post = await PostModel.findById(postId).lean();
  if (!post) {
    throw new AppError(status.NOT_FOUND, "Post not found.");
  }
  return post;
};

export const updatePost = async (
  user: AuthenticatedUser | undefined,
  postId: string,
  input: { title?: string; content?: string },
) => {
  const authenticatedUser = requireUser(user);
  const post = await PostModel.findOneAndUpdate(
    getPostFilter(authenticatedUser, postId),
    { $set: input },
    { new: true, runValidators: true },
  ).lean();
  if (!post) {
    throw new AppError(status.NOT_FOUND, "Post not found.");
  }
  return post;
};

export const deletePost = async (
  user: AuthenticatedUser | undefined,
  postId: string,
) => {
  const authenticatedUser = requireUser(user);
  const result = await PostModel.deleteOne(
    getPostFilter(authenticatedUser, postId),
  );
  if (result.deletedCount === 0) {
    throw new AppError(status.NOT_FOUND, "Post not found.");
  }
};

interface GroupedPostsAggregation {
  _id: Types.ObjectId;
  name: string;
  email: string;
  postData?: {
    posts: Post[];
    metadata: { total: number }[];
  };
}

export const getUserPosts = async (
  userId: string,
  page: number,
  limit: number,
) => {
  const { skip } = getPagination(page, limit);
  const [result] = await UserModel.aggregate<GroupedPostsAggregation>([
    {
      $match: {
        _id: new Types.ObjectId(userId),
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
      },
    },
    {
      $lookup: {
        from: PostModel.collection.name,
        let: { ownerId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$userId", "$$ownerId"],
              },
            },
          },
          { $sort: { createdAt: -1 } },
          {
            $facet: {
              posts: [{ $skip: skip }, { $limit: limit }],
              metadata: [{ $count: "total" }],
            },
          },
        ],
        as: "postData",
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        postData: { $arrayElemAt: ["$postData", 0] },
      },
    },
  ]);

  if (!result) {
    throw new AppError(status.NOT_FOUND, "User not found.");
  }

  return {
    user: {
      _id: result._id,
      name: result.name,
      email: result.email,
    },
    posts: result.postData?.posts ?? [],
    total: result.postData?.metadata[0]?.total ?? 0,
  };
};
