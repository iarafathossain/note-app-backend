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
import {
  create,
  get,
  list,
  listUserPosts,
  remove,
  update,
} from "./post.controller.js";
import {
  paginationSchema,
  postBodySchema,
  postIdSchema,
  updatePostSchema,
  userIdSchema,
} from "./post.validation.js";

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

router.post(
  "/",
  authenticate,
  authorize(UserRole.USER),
  validateRequest(postBodySchema),
  catchAsync(create),
);
router.get(
  "/",
  validateRequestPart("query", paginationSchema),
  catchAsync(list),
);
router.get(
  "/:id",
  validateRequestPart("params", postIdSchema),
  catchAsync(get),
);
router.patch(
  "/:id",
  ...authenticated,
  validateRequestPart("params", postIdSchema),
  validateRequest(updatePostSchema),
  catchAsync(update),
);
router.delete(
  "/:id",
  ...authenticated,
  validateRequestPart("params", postIdSchema),
  catchAsync(remove),
);

router.get(
  "/:userId/posts",
  validateRequestPart("params", userIdSchema),
  validateRequestPart("query", paginationSchema),
  catchAsync(listUserPosts),
);

export { router as postRoutes };
