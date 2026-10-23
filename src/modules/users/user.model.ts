import { Schema, model, type InferSchemaType } from "mongoose";

export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
      required: true,
    },

    interests: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Required for unique email lookups and login.
userSchema.index({ email: 1 }, { unique: true });

// Supports the admin user listing sorted by newest first.
userSchema.index({ createdAt: -1 });

export type User = InferSchemaType<typeof userSchema>;

export const UserModel = model("User", userSchema);
