import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateRequest } from "../../middleware/validate-request.js";
import { validateRequestPart } from "../../middleware/validate-request-part.js";
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

const router = Router();

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
  authenticate,
  authorize(UserRole.USER, UserRole.ADMIN),
  validateRequestPart("params", postIdSchema),
  validateRequest(updatePostSchema),
  catchAsync(update),
);
router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.USER, UserRole.ADMIN),
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
