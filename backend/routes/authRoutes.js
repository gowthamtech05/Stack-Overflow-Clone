import express from "express";
import {
  registerUser,
  verifyRegisterOTP,
  loginUser,
  logoutUser,
  verifyLoginOTP,
  getMe,
  forgotPassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-register-otp", verifyRegisterOTP);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/verify-login-otp", verifyLoginOTP);
router.post("/forgot-password", forgotPassword);
router.get("/me", protect, getMe);

export default router;
