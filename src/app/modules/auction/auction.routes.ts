import express from "express";
import { auctionControllers } from "./auction.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.post(
  "/start/:stockId",
  auth(UserRole.Buyer),
  auctionControllers.createAuction,
);
router.get(
  "/live-auctions",
  auth(UserRole.Buyer),
  auctionControllers.liveAuctions,
);
router.get("/my-auctions", auth(UserRole.Buyer), auctionControllers.myAuctions);
router.get("/:id", auth(UserRole.Buyer), auctionControllers.getAuctionById);
router.post(
  "/place-bid/:auctionId",
  auth(UserRole.Buyer),
  auctionControllers.placeBid,
);
router.get(
  "/my/placed-bids",
  auth(UserRole.Buyer),
  auctionControllers.myPlacedBids,
);
router.patch("/:id", auth(UserRole.Buyer), auctionControllers.updateAuction);
router.delete("/:id", auth(UserRole.Buyer), auctionControllers.deleteAuction);
router.post(
  "/move-to-stock/:auctionId",
  auth(UserRole.Buyer),
  auctionControllers.moveToStock,
);

export const auctionRoutes = router;
