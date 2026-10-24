import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateRequest } from "../../middleware/validate-request.js";
import { validateRequestPart } from "../../middleware/validate-request-part.js";
import { catchAsync } from "../../shared/catch-async.js";
import {
  create,
  getGroupedByInterests,
  remove,
  update,
} from "./user.controller.js";
import { UserRole } from "./user.model.js";
import {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
} from "./user.validation.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest(createUserSchema),
  catchAsync(create),
);
router.patch(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequestPart("params", userIdSchema),
  validateRequest(updateUserSchema),
  catchAsync(update),
);
router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequestPart("params", userIdSchema),
  catchAsync(remove),
);
router.get(
  "/grouped-by-interests",
  authenticate,
  authorize(UserRole.ADMIN),
  catchAsync(getGroupedByInterests),
);

export const userRoutes = router;
