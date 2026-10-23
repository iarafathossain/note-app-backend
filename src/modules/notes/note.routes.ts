import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import type { ZodType } from "zod";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateRequest } from "../../middleware/validate-request.js";
import { catchAsync } from "../../shared/catch-async.js";
import { UserRole } from "../users/user.model.js";
import { create, get, list, remove, update } from "./note.controller.js";
import {
  noteBodySchema,
  noteIdSchema,
  paginationSchema,
  updateNoteSchema,
} from "./note.validation.js";

const validateRequestPart =
  (source: "params" | "query", schema: ZodType) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(result.error);
    }
    Object.assign(req[source], result.data);
    return next();
  };

const router = Router();
const authenticated = [authenticate, authorize(UserRole.USER, UserRole.ADMIN)];

router.use(...authenticated);
router.post("/", validateRequest(noteBodySchema), catchAsync(create));
router.get(
  "/",
  validateRequestPart("query", paginationSchema),
  catchAsync(list),
);
router.get(
  "/:id",
  validateRequestPart("params", noteIdSchema),
  catchAsync(get),
);
router.patch(
  "/:id",
  validateRequestPart("params", noteIdSchema),
  validateRequest(updateNoteSchema),
  catchAsync(update),
);
router.delete(
  "/:id",
  validateRequestPart("params", noteIdSchema),
  catchAsync(remove),
);

export { router as noteRoutes };
