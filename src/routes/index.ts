import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.routes.js";
import { noteRoutes } from "../modules/notes/note.routes.js";
import { userRoutes } from "../modules/users/user.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/notes", noteRoutes);
router.use("/admin/users", userRoutes);

export const indexRoutes = router;
