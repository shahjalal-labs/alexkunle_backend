import express from "express";
import auth from "../../middlewares/auth";
import { autopilotController } from "./autopilot.controller";

const router = express.Router();

router.get("/me", auth(), autopilotController.getAutopilotByUser);
router.post("/from-stock", auth(), autopilotController.addFromStock);
router.patch(
  "/:id/complete",
  auth(),
  autopilotController.completeAutopilotItem,
);
router.patch("/:id/cancel", auth(), autopilotController.cancelAutopilotItem);
router.delete("/:id", auth(), autopilotController.moveToStock);

export const autopilotRoute = router;
