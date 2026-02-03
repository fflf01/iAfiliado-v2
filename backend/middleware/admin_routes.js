import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { onlyAdmin } from "../middlewares/admin.js";

const router = Router();

router.get(
  "/dashboard",
  authenticate,
  onlyAdmin,
  (req, res) => {
    res.json({ message: "Bem-vindo, admin 👑" });
  }
);

export default router;