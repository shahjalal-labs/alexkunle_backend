import express from "express";
import auth from "../../middlewares/auth";
import { tokenController } from "./token.controller";
import validateRequest from "../../middlewares/validateRequest";
import { tokenValidation } from "./token.validation";

const router = express.Router();

router.post(
  "/buy",
  auth(),
  validateRequest(tokenValidation.tokenSchema),
  tokenController.buyToken,
);
router.get("/history", auth(), tokenController.myTokenHistory);
router.post("/spin", auth(), tokenController.spinNow);

export const tokenRoutes = router;
