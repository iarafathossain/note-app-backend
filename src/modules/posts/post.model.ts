import { Schema, model, type InferSchemaType } from "mongoose";

const postSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    content: {
      type: String,
      required: true,
      maxlength: 50_000,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Public posts listing, sorted newest first.
postSchema.index({ createdAt: -1 });

// Posts belonging to a particular user, sorted newest first.
postSchema.index({ userId: 1, createdAt: -1 });

export type Post = InferSchemaType<typeof postSchema>;

export const PostModel = model("Post", postSchema);
