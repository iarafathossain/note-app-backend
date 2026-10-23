import status from "http-status";
import AppError from "../../errors/app-error.js";
import { getPagination } from "../../utils/pagination.js";
import { UserRole } from "../users/user.model.js";
import { NoteModel } from "./note.model.js";

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

const getNoteFilter = (user: AuthenticatedUser, noteId?: string) => ({
  ...(noteId ? { _id: noteId } : {}),
  ...(user.role === UserRole.USER ? { userId: user.userId } : {}),
});

export const createNote = async (
  user: AuthenticatedUser | undefined,
  input: { title: string; content: string },
) => {
  const authenticatedUser = requireUser(user);
  return NoteModel.create({
    title: input.title,
    content: input.content,
    userId: authenticatedUser.userId,
  });
};

export const listNotes = async (
  user: AuthenticatedUser | undefined,
  page: number,
  limit: number,
) => {
  const authenticatedUser = requireUser(user);
  const filter = getNoteFilter(authenticatedUser);
  const { skip } = getPagination(page, limit);
  const [notes, total] = await Promise.all([
    NoteModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    NoteModel.countDocuments(filter),
  ]);

  return { notes, total };
};

const findNote = async (
  user: AuthenticatedUser | undefined,
  noteId: string,
) => {
  const authenticatedUser = requireUser(user);
  const note = await NoteModel.findOne(
    getNoteFilter(authenticatedUser, noteId),
  ).lean();
  if (!note) {
    throw new AppError(status.NOT_FOUND, "Note not found.");
  }
  return note;
};

export const getNote = findNote;

export const updateNote = async (
  user: AuthenticatedUser | undefined,
  noteId: string,
  input: { title?: string; content?: string },
) => {
  const authenticatedUser = requireUser(user);
  const note = await NoteModel.findOneAndUpdate(
    getNoteFilter(authenticatedUser, noteId),
    { $set: input },
    { new: true, runValidators: true },
  ).lean();
  if (!note) {
    throw new AppError(status.NOT_FOUND, "Note not found.");
  }
  return note;
};

export const deleteNote = async (
  user: AuthenticatedUser | undefined,
  noteId: string,
) => {
  const authenticatedUser = requireUser(user);
  const result = await NoteModel.deleteOne(
    getNoteFilter(authenticatedUser, noteId),
  );
  if (result.deletedCount === 0) {
    throw new AppError(status.NOT_FOUND, "Note not found.");
  }
};
