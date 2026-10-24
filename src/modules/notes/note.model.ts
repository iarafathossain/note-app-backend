import { model, Schema, type InferSchemaType } from "mongoose";

const noteSchema = new Schema(
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

// User's own notes, sorted newest first.
noteSchema.index({ userId: 1, createdAt: -1 });

// Admin's listing of all notes, sorted newest first.
noteSchema.index({ createdAt: -1 });

export type Note = InferSchemaType<typeof noteSchema>;

export const NoteModel = model("Note", noteSchema);
