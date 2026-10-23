import { Schema, model, type InferSchemaType } from "mongoose";

const sessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    refreshTokenHash: {
      type: String,
      required: true,
      select: false,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Find a session by its refresh-token hash.
sessionSchema.index({ refreshTokenHash: 1 }, { unique: true });

// Automatically remove expired sessions.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type Session = InferSchemaType<typeof sessionSchema>;

export const SessionModel = model("Session", sessionSchema);
