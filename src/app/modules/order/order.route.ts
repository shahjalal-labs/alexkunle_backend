import express from "express";
import auth from "../../middlewares/auth";
import { orderController } from "./order.controller";
import { UserRole } from "@prisma/client";
import validateRequest from "../../middlewares/validateRequest";
import { orderSchema } from "./order.validation";

const router = express.Router();

router.post("/create", auth(UserRole.Buyer), orderController.createOrder);
router.post(
  "/create-direct",
  auth(UserRole.Buyer),
  orderController.createDirectOrder,
);
router.get("/brand-wise", auth(UserRole.Brand), orderController.getOrderItems);
router.get(
  "/buyer-wise",
  auth(UserRole.Buyer),
  orderController.getOrderItemsBuyerWise,
);
router.patch("/accept/:id", auth(UserRole.Brand), orderController.acceptOrder);
router.patch(
  "/reject/:id",
  auth(UserRole.Brand, UserRole.Buyer),
  orderController.rejectOrder,
);
router.put("/cancel", auth(UserRole.Brand), orderController.cancelOrder);
router.patch(
  "/deliver/:id",
  auth(UserRole.Brand),
  orderController.deliverOrder,
);
router.get(
  "/details/:id",
  auth(UserRole.Brand, UserRole.Buyer),
  orderController.orderDetails,
);
router.post(
  "/create-review",
  auth(UserRole.Buyer),
  validateRequest(orderSchema.reviewValidationSchema),
  orderController.createReview,
);

export const orderRoutes = router;
