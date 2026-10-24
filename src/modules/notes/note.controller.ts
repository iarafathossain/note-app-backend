import type { Request, Response } from "express";
import status from "http-status";
import AppError from "../../errors/app-error.js";
import { sendResponse } from "../../shared/send-response.js";
import { getPaginationMeta } from "../../utils/pagination.js";
import {
  createNote,
  deleteNote,
  getNote,
  listNotes,
  updateNote,
} from "./note.service.js";
import type { NoteListQuery } from "./note.validation.js";

const getNoteId = (req: Request) => {
  const { id } = req.params;
  if (typeof id !== "string") {
    throw new AppError(status.BAD_REQUEST, "Invalid note ID.");
  }
  return id;
};

export const create = async (req: Request, res: Response) => {
  const note = await createNote(req.user, req.body);
  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Note created successfully.",
    data: { note },
  });
};

export const list = async (req: Request, res: Response) => {
  const { page, limit, search } = req.query as unknown as NoteListQuery;
  const result = await listNotes(req.user, page, limit, search);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Notes retrieved successfully.",
    data: { notes: result.notes },
    meta: getPaginationMeta(page, limit, result.total),
  });
};

export const get = async (req: Request, res: Response) => {
  const note = await getNote(req.user, getNoteId(req));
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Note retrieved successfully.",
    data: { note },
  });
};

export const update = async (req: Request, res: Response) => {
  const note = await updateNote(req.user, getNoteId(req), req.body);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Note updated successfully.",
    data: { note },
  });
};

export const remove = async (req: Request, res: Response) => {
  await deleteNote(req.user, getNoteId(req));
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Note deleted successfully.",
  });
};
