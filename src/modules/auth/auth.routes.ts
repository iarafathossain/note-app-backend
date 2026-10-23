import { Router } from "express";
import { validateRequest } from "../../middleware/validate-request.js";
import { catchAsync } from "../../shared/catch-async.js";
import { login, logout, refresh, register } from "./auth.controller.js";
import { loginSchema, registerSchema } from "./auth.validation.js";

const router = Router();

router.post("/register", validateRequest(registerSchema), catchAsync(register));
router.post("/login", validateRequest(loginSchema), catchAsync(login));
router.post("/refresh", catchAsync(refresh));
router.post("/logout", catchAsync(logout));

export const authRoutes = router;
