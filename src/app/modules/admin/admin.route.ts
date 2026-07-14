import express from "express";
import auth from "../../middlewares/auth";
import { adminController } from "./admin.controller";
import { UserRole } from "@prisma/client";
import validateRequest from "../../middlewares/validateRequest";
import { adminValidation } from "./admin.validation";

const router = express.Router();

router.get("/all-buyers", auth(UserRole.Admin), adminController.getAllBuyers);
router.get(
  "/buyer-details/:id",
  auth(UserRole.Admin),
  adminController.buyerDetails,
);
router.get("/all-brands", auth(UserRole.Admin), adminController.getAllBrands);
router.get("/all-orders", auth(UserRole.Admin), adminController.getOrderItems);
router.get(
  "/brand-details/:id",
  auth(UserRole.Admin),
  adminController.brandDetails,
);
router.put(
  "/approve-reject-brand",
  auth(UserRole.Admin),
  validateRequest(adminValidation.approveRejectBrandSchema),
  adminController.approveRejectBrand,
);
router.put(
  "/approve-reject-product",
  auth(UserRole.Admin),
  validateRequest(adminValidation.approveRejectProductSchema),
  adminController.approveRejectProduct,
);

router.patch(
  "/block-unblock-user/:id",
  auth(UserRole.Admin),
  adminController.blockUnblockUser,
);

router.patch(
  "/toggle-transfer-permission/:id",
  auth(UserRole.Admin),
  adminController.toggleTransferPermission,
);
router.get(
  "/monthly-order-chart",
  auth(UserRole.Admin),
  adminController.getMonthlyOrderChart,
);
router.get(
  "/monthly-user-chart",
  auth(UserRole.Admin),
  adminController.getMonthlyUserRegistrationChart,
);
router.get(
  "/all-products",
  auth(UserRole.Admin),
  adminController.getAllProducts,
);
router.get(
  "/all-campaigns",
  auth(UserRole.Admin),
  adminController.getAllCampaigns,
);
router.get("/campaigns", auth(UserRole.Admin), adminController.getAllCampaign);
router.get(
  "/overview-stats",
  auth(UserRole.Admin),
  adminController.overviewStats,
);
router.get(
  "/brand-overview-stats",
  auth(UserRole.Admin),
  adminController.brandOverviewStats,
);
router.get(
  "/product-overview-stats",
  auth(UserRole.Admin),
  adminController.getProductOverviewStats,
);
router.get(
  "/order-overview-stats",
  auth(UserRole.Admin),
  adminController.getOrderOverviewStats,
);

router.get(
  "/all-transactions",
  auth(UserRole.Admin),
  adminController.allTransactions,
);
router.put(
  "/point-system",
  auth(UserRole.Admin),  
  adminController.updatePointSystem,
);

router.get(
  "/point-system",
  auth(UserRole.Admin),  
  adminController.getCurrentPointSystem,
);
router.get(
  "/point-overview-stats",
  auth(UserRole.Admin),
  adminController.getPointOverviewStats,
);

router.put(
  "/affiliate-system",
  auth(UserRole.Admin),  
  adminController.updateAffiliateSystem,
);

router.get(
  "/affiliate-system",
  // auth(UserRole.Admin),  
  adminController.getCurrentAffiliateSystem,
);
router.put(
  "/spin-system",
  auth(UserRole.Admin),  
  adminController.updateSpinSystem,
);

router.get(
  "/spin-system",
  auth(UserRole.Admin),  
  adminController.getCurrentSpinSystem,
);
router.post(
  "/reward/create",
  auth(UserRole.Admin),
  adminController.createReward
);
router.get(
  "/rewards",
  auth(),
  adminController.rewards
);
router.put(
  "/reward/update",
  auth(UserRole.Admin),
  adminController.updateReward
);

export const adminRoutes = router;
