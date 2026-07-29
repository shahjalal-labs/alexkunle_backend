import { productServices } from "./product.service";
import sendResponse from "../../../shared/sendResponse";
import catchAsync from "../../../shared/catchAsync";

const parseVariants = (variants: unknown) => {
  if (!variants) return undefined;

  if (typeof variants === "string") {
    return JSON.parse(variants);
  }

  return variants;
};

const createProduct = catchAsync(async (req, res) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const variants = parseVariants(req.body.variants);

  await productServices.createProduct(req.body, req.user.id, files, variants);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "The product has been created successfully",
  });
});

const myProducts = catchAsync(async (req, res) => {
  const result = await productServices.myProducts(req.user.id, req.query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "My products has been retrived successfully",
    data: result,
  });
});

const priceOverview = catchAsync(async (req, res) => {
  const result = await productServices.getPriceTrendOverviewForProduct(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Price overview has been retrieved successfully",
    data: result,
  });
});

const brandOverview = catchAsync(async (req, res) => {
  const result = await productServices.brandOverview(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Brand overview has been retrieved successfully",
    data: result,
  });
});

const getAllProducts = catchAsync(async (req, res) => {
  const result = await productServices.getAllProducts(req.query, req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All products has been retrived successfully",
    data: result,
  });
});

const getProductById = catchAsync(async (req, res) => {
  const result = await productServices.getProductById(
    req.params.id,
    req.user.id,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "product has been retrived successfully",
    data: result,
  });
});

const productViewById = catchAsync(async (req, res) => {
  const result = await productServices.productViewById(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "product has been retrived successfully",
    data: result,
  });
});

const updateProduct = catchAsync(async (req, res) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const variants = parseVariants(req.body.variants);

  await productServices.editProduct(
    req.params.id,
    req.user.id,
    req.body,
    files,
    variants,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "product has been edited successfully",
  });
});

const deleteProduct = catchAsync(async (req, res) => {
  await productServices.deleteProduct(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "product has been deleted successfully",
  });
});

const flashDrops = catchAsync(async (req, res) => {
  const result = await productServices.flashDrops(req.query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Flash drops has been retrieved successfully",
    data: result,
  });
});

const trendingInvest = catchAsync(async (req, res) => {
  const result = await productServices.trendingInvest(req.query, req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Trending investments has been retrieved successfully",
    data: result,
  });
});

const youthPriceDeals = catchAsync(async (req, res) => {
  const result = await productServices.youthPriceDeals(req.query, req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Youth price deals has been retrieved successfully",
    data: result,
  });
});

const getFeaturedProducts = catchAsync(async (req, res) => {
  const result = await productServices.getFeaturedProducts(req.params.liveId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Featured products has been retrieved successfully",
    data: result,
  });
});
const getAllReviewsForProduct = catchAsync(async (req, res) => {
  const result = await productServices.getAllReviewsForProduct(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All reviews retrieved successfully",
    data: result,
  });
});



//guest
const trendingInvestGuest = catchAsync(async (req, res) => {
  const result = await productServices.trendingInvestGuest(req.query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Trending investments has been retrieved successfully",
    data: result,
  });
});

const youthPriceDealsGuest = catchAsync(async (req, res) => {
  const result = await productServices.youthPriceDealsGuest(req.query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Youth price deals has been retrieved successfully",
    data: result,
  });
});

const getAllProductsGuest = catchAsync(async (req, res) => {
  const result = await productServices.getAllProductsGuest(req.query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All products has been retrived successfully",
    data: result,
  });
});

export const productControllers = {
  createProduct,
  myProducts,
  brandOverview,
  getAllProducts,
  getProductById,
  productViewById,
  updateProduct,
  deleteProduct,
  flashDrops,
  trendingInvest,
  youthPriceDeals,
  getFeaturedProducts,
  getAllReviewsForProduct,
  priceOverview,
  getAllProductsGuest,
  trendingInvestGuest,
  youthPriceDealsGuest,
};
