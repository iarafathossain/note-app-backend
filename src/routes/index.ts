import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.routes.js";
import { noteRoutes } from "../modules/notes/note.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/notes", noteRoutes);

export const indexRoutes = router;
