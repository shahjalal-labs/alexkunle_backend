import express from "express";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { stockController } from "./stock.controller";

const router = express.Router();

router.post("/add", auth(UserRole.Buyer), stockController.createStock);
router.post("/direct", auth(UserRole.Buyer), stockController.createDirectStock);
router.get(
  "/buyer-wise",
  auth(UserRole.Buyer),
  stockController.buyerWiseStocks,
);
router.get("/:id", auth(), stockController.getStockDetails);

export const stockRoutes = router;
