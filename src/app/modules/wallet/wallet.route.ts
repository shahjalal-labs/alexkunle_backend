import express from "express";
import auth from "../../middlewares/auth";
import { walletController } from "./wallet.controller";
import validateRequest from "../../middlewares/validateRequest";
import { walletValidation } from "./wallet.validation";

const router = express.Router();

router.post(
  "/top-up",
  auth(),
  validateRequest(walletValidation.walletValidationSchema),
  walletController.addFunds,
);
router.post(
  "/withdraw",
  auth(),
  validateRequest(walletValidation.withdrawValidationSchema),
  walletController.withdrawFunds,
);
router.get(
  "/balance",
  auth(),
  walletController.getWalletBalance,
);
router.get(
  "/transactions",
  auth(),
  walletController.allTransactions,
);
router.post(
  "/transfer",
  auth(),
  validateRequest(walletValidation.transferValidationSchema),
  walletController.transferFund,
);

router.get(
  "/users",
  auth(),
  walletController.allUsers,
);

export const walletRoutes = router;
