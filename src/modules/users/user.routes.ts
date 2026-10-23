import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { catchAsync } from "../../shared/catch-async.js";
import { getGroupedByInterests } from "./user.controller.js";
import { UserRole } from "./user.model.js";

const router = Router();

router.get(
  "/grouped-by-interests",
  authenticate,
  authorize(UserRole.ADMIN),
  catchAsync(getGroupedByInterests),
);

export const userRoutes = router;
