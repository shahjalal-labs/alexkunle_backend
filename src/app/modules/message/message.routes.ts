import express from "express";
import { messageControllers } from "./message.controller";
import { fileUploader } from "../../../helpers/fileUploader";
import auth from "../../middlewares/auth";

const router = express.Router();

router.post("/create-many", messageControllers.createManyMessage);
router.post(
  "/generate-urls",
  fileUploader.uploadMultiple,
  messageControllers.generateUrls,
);
router.get("/", messageControllers.getAllMessages);
router.patch("/room/:roomId/block", auth(), messageControllers.blockRoom);
router.delete("/room/:roomId/delete", auth(), messageControllers.deleteRoom);

export const messageRoutes = router;
