import { TTransactions } from "@prisma/client";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { adminService } from "./admin.service";

const getAllBuyers = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string | undefined;

  const result = await adminService.getAllBuyersFromDB(page, limit, search);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Buyers retrieved successfully.",
    data: result,
  });
});
const buyerDetails = catchAsync(async (req, res) => {
  const buyerId = req.params.id;

  const result = await adminService.getBuyerDetailsFromDB(buyerId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Buyer details retrieved successfully.",
    data: result,
  });
});

const getAllBrands = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string | undefined;

  const result = await adminService.getAllBrandsFromDB(page, limit, search);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Brands retrieved successfully.",
    data: result,
  });
});
const getOrderItems = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string | undefined;

  const result = await adminService.getAllOrderItemsFromDB(page, limit, search);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Order items retrieved successfully.",
    data: result,
  });
});

const brandDetails = catchAsync(async (req, res) => {
  const brandId = req.params.id;

  const result = await adminService.getBrandDetailsFromDB(brandId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Brand details retrieved successfully.",
    data: result,
  });
});
const approveRejectBrand = catchAsync(async (req, res) => {
  const { isApprove, brandId } = req.body;

  const result = await adminService.approveRejectBrand(brandId, isApprove);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
  });
});
const approveRejectProduct = catchAsync(async (req, res) => {
  const { isApprove, productId } = req.body;

  const result = await adminService.approveRejectProduct(productId, isApprove);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
  });
});
const blockUnblockUser = catchAsync(async (req, res) => {
  const id = req.params.id;

  const result = await adminService.blockUnblockUser(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
  });
});
const toggleTransferPermission = catchAsync(async (req, res) => {
  const id = req.params.id;

  const result = await adminService.toggleTransferPermission(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
  });
});
const getAllProducts = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string | undefined;
  const categoryId = req.query.categoryId as string;

  const result = await adminService.getAllProductsFromDB(
    page,
    limit,
    search,
    categoryId,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Products retrieved successfully.",
    data: result,
  });
});

const getAllCampaigns = catchAsync(async (req, res) => {
  const result = await adminService.getAllCampaignsFromDB();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Campaigns retrieved successfully.",
    data: result,
  });
});

const getMonthlyOrderChart = catchAsync(async (req, res) => {
  const year = req.query.year ? parseInt(req.query.year as string) : undefined;

  const result = await adminService.getMonthlyOrderChart(year);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Monthly order chart retrieved successfully.",
    data: result,
  });
});

const getMonthlyUserRegistrationChart = catchAsync(async (req, res) => {
  const year = req.query.year ? parseInt(req.query.year as string) : undefined;

  const result = await adminService.getMonthlyUserRegistrationChart(year);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Monthly user registration chart retrieved successfully.",
    data: result,
  });
});

const getAllCampaign = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const result = await adminService.getAllCampaigns(page, limit);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Campaigns retrieved successfully.",
    data: result,
  });
});
const overviewStats = catchAsync(async (req, res) => {
  const result = await adminService.getOverviewStats();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Overview stats retrieved successfully.",
    data: result,
  });
});
const brandOverviewStats = catchAsync(async (req, res) => {
  const result = await adminService.brandOverviewStats();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Brand overview stats retrieved successfully.",
    data: result,
  });
});
const getProductOverviewStats = catchAsync(async (req, res) => {
  const result = await adminService.getProductOverviewStats();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Product overview stats retrieved successfully.",
    data: result,
  });
});
const getOrderOverviewStats = catchAsync(async (req, res) => {
  const result = await adminService.getOrderOverviewStats();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Order overview stats retrieved successfully.",
    data: result,
  });
});
const allTransactions = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const type = req.query.type as TTransactions;
  const result = await adminService.getAllTransactionsFromDB(page, limit, type);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Top-up transactions retrieved successfully.",
    data: result,
  });
});
const updatePointSystem = catchAsync(async (req, res) => {
  const payload = req.body;
  await adminService.updatePointSystem(payload);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Point setting updated successfully.",
  });
});
const getCurrentPointSystem = catchAsync(async (req, res) => {
  const point = await adminService.getCurrentPointSystem();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Current point system retrieved successfully.",
    data: point,
  });
});
const getPointOverviewStats = catchAsync(async (req, res) => {
  const stats = await adminService.getPointOverviewStats();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Point overview stats retrieved successfully.",
    data: stats,
  });
});

const updateAffiliateSystem = catchAsync(async (req, res) => {
  const payload = req.body;
  await adminService.updateAffiliateSystem(payload);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Affiliate setting updated successfully.",
  });
});
const getCurrentAffiliateSystem = catchAsync(async (req, res) => {
  const affiliate = await adminService.getCurrentAffiliateSystem();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Current affiliate system retrieved successfully.",
    data: affiliate,
  });
});
const updateSpinSystem = catchAsync(async (req, res) => {
  const payload = req.body;
  await adminService.updateSpinSystem(payload);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Spin setting updated successfully.",
  });
});
const getCurrentSpinSystem = catchAsync(async (req, res) => {
  const spin = await adminService.getCurrentSpinSystem();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Current spin system retrieved successfully.",
    data: spin,
  });
});
const createReward = catchAsync(async (req, res) => {
  await adminService.createReward(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Reward created successfully.",
  });
});
const rewards = catchAsync(async (req, res) => {
  const rewardList = await adminService.rewardsFromDB();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Rewards retrieved successfully.",
    data: rewardList,
  });
});
const updateReward = catchAsync(async (req, res) => {
  const rewardList = await adminService.updateReward(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Rewards updated successfully.",
    data: rewardList,
  });
});

export const adminController = {
  getAllBuyers,
  buyerDetails,
  getAllBrands,
  brandDetails,
  approveRejectBrand,
  approveRejectProduct,
  blockUnblockUser,
  getOrderItems,
  toggleTransferPermission,
  getAllProducts,
  getAllCampaigns,
  getMonthlyOrderChart,
  getMonthlyUserRegistrationChart,
  getAllCampaign,
  overviewStats,
  brandOverviewStats,
  getProductOverviewStats,
  getOrderOverviewStats,
  allTransactions,
  updatePointSystem,
  getCurrentPointSystem,
  getPointOverviewStats,
  rewards,
  updateReward,
  updateAffiliateSystem,
  getCurrentAffiliateSystem,
  updateSpinSystem,
  getCurrentSpinSystem,
  createReward,
};
