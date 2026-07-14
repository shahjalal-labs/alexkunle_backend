import express from "express";
import { authController } from "./auth.controller";
import auth from "../../middlewares/auth";
import { fileUploader } from "../../../helpers/fileUploader";

const router = express.Router();

router.post("/email-login", authController.loginWithEmail);
router.post("/phone-login", authController.loginWithPhone);
router.get("/profile", auth(), authController.myProfile);
router.post("/forget-password", authController.sendForgotPasswordOtp);
router.post("/verify-otp", authController.verifyForgotPasswordOtpCode);
router.patch("/reset-password", auth(), authController.resetPassword);
router.patch(
  "/profile",
  auth(),
  fileUploader.uploadMultiple,
  authController.updateProfile,
);
router.patch("/change-password", auth(), authController.changePassword);
router.delete("/delete-account", auth(), authController.deleteAccount);
router.post("/form-info", authController.formInfo);

export const authRoute = router;
