import express from "express";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { shortlistController } from "./shortlist.controller";
import validateRequest from "../../middlewares/validateRequest";
import { shortlistValidation } from "./shortlist.validation";

const router = express.Router();

router.post(
  "/add-to-wishlist",
  auth(UserRole.Buyer),
  validateRequest(shortlistValidation.wishlistValidationSchema),
  shortlistController.addProductToWishlist,
);
router.get(
  "/buyer-wishlist",
  auth(UserRole.Buyer),
  shortlistController.getMyWishlist,
);
router.delete(
  "/wishlist-remove/:id",
  auth(UserRole.Buyer),
  shortlistController.deleteProductFromWishlist
);
router.post(
  "/add-to-cart",
  auth(UserRole.Buyer),
  validateRequest(shortlistValidation.wishlistValidationSchema),
  shortlistController.addProductToCart,
);
router.get(
  "/buyer-cart",
  auth(UserRole.Buyer),
  shortlistController.getMyCart,
);
router.delete(
  "/cart-remove/:id",
  auth(UserRole.Buyer),
  shortlistController.deleteProductFromCart,
);
router.put(
  "/cart-update-quantity",
  auth(UserRole.Buyer),
  validateRequest(shortlistValidation.cartQuantityValidationSchema),
  shortlistController.updateCartQuantity,
);

export const shortlistRoute = router;
