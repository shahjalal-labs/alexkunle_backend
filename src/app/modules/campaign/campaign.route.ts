import express from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { campaignController } from "./campaign.controller";
import { campaignValidation } from "./campaign.validation";

const router = express.Router();

router.post(
  "/create",
  auth(UserRole.Brand),
  validateRequest(campaignValidation.createCampaignValidationSchema),
  campaignController.createCampaign,
);

router.get(
  "/brand-wise",
  auth(UserRole.Brand),
  campaignController.myCampaigns,
);
router.get("/details/:id", auth(UserRole.Brand), campaignController.getCampaignById);
router.delete("/delete/:id", auth(UserRole.Brand, UserRole.Admin), campaignController.deleteCampaign);

export const campaignRoute = router;
