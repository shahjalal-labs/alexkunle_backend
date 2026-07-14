import express from "express";
import { categoryControllers } from "./category.controller";
import auth from "../../middlewares/auth";
import { fileUploader } from "../../../helpers/fileUploader";

const router = express.Router();

router.post(
  "/create",
  auth(),
  fileUploader.thumbnail,
  categoryControllers.createCategory,
);
router.get("/", categoryControllers.getAllCategorys);
router.get("/:id", categoryControllers.getCategoryById);
router.patch("/:id", categoryControllers.updateCategory);
router.delete("/:id", categoryControllers.deleteCategory);
router.get("/with-product/count", categoryControllers.allCategoryWithTotalProduct);

export const categoryRoutes = router;
