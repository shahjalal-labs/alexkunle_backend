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

router.post(
  "/pickup",
  auth(UserRole.Brand),
  // validateRequest(addressValidation.addressValidationSchema),
  addressController.createCampusAddress,
);

router.get(
  "/pickup",
  auth(UserRole.Brand),
  addressController.getBrandPickupAddress,
);

router.put(
  "/pickup-update",
  auth(UserRole.Brand),
  addressController.updatePickupAddress,
);

export const addressRoute = router;
