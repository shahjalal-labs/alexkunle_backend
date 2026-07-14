import express from "express";
import auth from "../../middlewares/auth";
import { addressController } from "./address.controller";
import { UserRole } from "@prisma/client";
import validateRequest from "../../middlewares/validateRequest";
import { addressValidation } from "./address.validation";

const router = express.Router();

router.post(
  "/create",
  auth(UserRole.Buyer),
  validateRequest(addressValidation.addressValidationSchema),
  addressController.createNewDeliveryAddress,
);
router.get(
  "/buyer-wise",
  auth(UserRole.Buyer),
  addressController.getUserDeliveryAddresses,
);

export const addressRoute = router;
