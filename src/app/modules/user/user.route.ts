import express from "express";
import { UserControllers } from "./user.controller";
import validateRequest from "../../middlewares/validateRequest";
import { userValidation } from "./user.validation";
import auth from "../../middlewares/auth";
import { fileUploader } from "../../../helpers/fileUploader";
import { parseBodyData } from "../../middlewares/parseBodyData";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.post(
  "/create",
  validateRequest(userValidation.userRegisterValidationSchema),
  UserControllers.createUser,
);
router.post(
  "/signup-verification",
  validateRequest(userValidation.verificationSchema),
  UserControllers.signupVerification,
);

router.put(
  "/resend-otp",
  validateRequest(userValidation.resendOtpValidationSchema),
  UserControllers.resendOTP,
);
router.get("/my-affiliates", auth(), UserControllers.myAffiliates);
router.patch("/switch-role", auth(), UserControllers.switchUserRole);
router.post(
  "/setup-profile",
  auth(),
  fileUploader.profileImage,
  parseBodyData,
  validateRequest(userValidation.setupProfileValidationSchema),
  UserControllers.setupProfile,
);
router.post(
  "/setup-business-profile",
  auth(UserRole.Brand),
  fileUploader.uploadMultiple,
  parseBodyData,
  validateRequest(userValidation.setupBusinessValidationSchema),
  UserControllers.setupBrandProfile,
);

export const userRoutes = router;
