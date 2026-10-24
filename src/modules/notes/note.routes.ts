import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateRequest } from "../../middleware/validate-request.js";
import { validateRequestPart } from "../../middleware/validate-request-part.js";
import { catchAsync } from "../../shared/catch-async.js";
import { UserRole } from "../users/user.model.js";
import { create, get, list, remove, update } from "./note.controller.js";
import {
  noteBodySchema,
  noteIdSchema,
  paginationSchema,
  updateNoteSchema,
} from "./note.validation.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize(UserRole.USER),
  validateRequest(noteBodySchema),
  catchAsync(create),
);
router.get(
  "/",
  authenticate,
  authorize(UserRole.USER, UserRole.ADMIN),
  validateRequestPart("query", paginationSchema),
  catchAsync(list),
);
router.get(
  "/:id",
  authenticate,
  authorize(UserRole.USER, UserRole.ADMIN),
  validateRequestPart("params", noteIdSchema),
  catchAsync(get),
);
router.patch(
  "/:id",
  authenticate,
  authorize(UserRole.USER, UserRole.ADMIN),
  validateRequestPart("params", noteIdSchema),
  validateRequest(updateNoteSchema),
  catchAsync(update),
);
router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.USER, UserRole.ADMIN),
  validateRequestPart("params", noteIdSchema),
  catchAsync(remove),
);

export { router as noteRoutes };
