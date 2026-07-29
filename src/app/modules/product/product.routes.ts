import express from "express";
import { productControllers } from "./product.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { fileUploader } from "../../../helpers/fileUploader";
import { parseBodyData } from "../../middlewares/parseBodyData";

const router = express.Router();

router.post(
  "/create",
  auth(UserRole.Brand),
  fileUploader.uploadMultiple,
  parseBodyData,
  productControllers.createProduct,
);
router.get("/all-products", auth(), productControllers.getAllProducts);
router.get("/my-products", auth(UserRole.Brand), productControllers.myProducts);
router.get(
  "/brand-overview",
  auth(UserRole.Brand),
  productControllers.brandOverview,
);
router.get(
  "/price-overview/:id",
  productControllers.priceOverview,
);
router.get("/single-product/:id", auth(), productControllers.getProductById);
router.get("/product-view/:id", auth(), productControllers.productViewById);
router.get("/flash-drops", productControllers.flashDrops);
router.get("/trending-investments", auth(), productControllers.trendingInvest);
router.get("/youth-price-deals", auth(), productControllers.youthPriceDeals);

//guest

router.get("/trending-investments-guest", productControllers.trendingInvestGuest);
router.get("/youth-price-deals-guest", productControllers.youthPriceDealsGuest);
router.get("/all-products-guest", productControllers.getAllProductsGuest);
//guest end

router.patch(
  "/:id",
  auth(UserRole.Brand),
  fileUploader.uploadMultiple,
  productControllers.updateProduct,
);
router.delete("/:id", auth(UserRole.Brand), productControllers.deleteProduct);
router.get(
  "/featured-products/:liveId",
  auth(),
  productControllers.getFeaturedProducts,
);
router.get(
  "/all-reviews/:id",
  productControllers.getAllReviewsForProduct,
);

export const productRoutes = router;
