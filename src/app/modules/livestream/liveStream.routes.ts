import express from "express";
import { liveStreamControllers } from "./liveStream.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.post(
  "/create",
  auth(UserRole.Brand),
  liveStreamControllers.createLiveStream,
);
router.get(
  "/my-upcoming-lives",
  auth(UserRole.Brand),
  liveStreamControllers.myUpcomingLives,
);
router.get(
  "/my-past-lives",
  auth(UserRole.Brand),
  liveStreamControllers.myPastLives,
);
router.post(
  "/start/:streamId",
  auth(UserRole.Brand),
  liveStreamControllers.startLiveStream,
);
router.post(
  "/end/:streamId",
  auth(UserRole.Brand),
  liveStreamControllers.endLiveStream,
);
router.get("/live-now", auth(), liveStreamControllers.liveNow);
router.get(
  "/live-overview",
  auth(UserRole.Brand),
  liveStreamControllers.myLiveOverview,
);
router.get("/", liveStreamControllers.getAllLiveStreams);
router.get("/:id", auth(), liveStreamControllers.getLiveStreamById);
router.patch(
  "/:id",
  auth(UserRole.Brand),
  liveStreamControllers.updateLiveStream,
);
router.delete(
  "/:id",
  auth(UserRole.Brand),
  liveStreamControllers.deleteLiveStream,
);

export const liveStreamRoutes = router;
