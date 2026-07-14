import { Prisma, TTransactions } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";

const campaignProductSelect = {
  id: true,
  productName: true,
  productImages: true,
  categoryId: true,
  price: true,
  status: true,
  totalStock: true,
  description: true,
  category: {
    select: {
      categoryName: true,
    },
  },
  business: {
    select: {
      businessName: true,
    },
  },
} as const;

const getAllBuyersFromDB = async (
  page: number = 1,
  limit: number = 10,
  search?: string,
) => {
  const whereCondition: Prisma.UserWhereInput = {
    role: "Buyer",
    ...(search && {
      OR: [
        { fullName: { contains: search, mode: "insensitive" } },
        { phoneNumber: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const totalBuyers = await prisma.user.count({
    where: { role: "Buyer" },
  });

  const filteredBuyersCount = await prisma.user.count({
    where: whereCondition,
  });

  const totalPages = Math.ceil(filteredBuyersCount / limit);

  const buyers = await prisma.user.findMany({
    where: whereCondition,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      fullName: true,
      phoneNumber: true,
      email: true,
      createdAt: true,
      profileImage: true,
      status: true,
      canTransfer: true,
    },
  });

  return {
    meta: {
      totalBuyers,
      filteredBuyers: filteredBuyersCount,
      totalPages,
      currentPage: page,
    },
    buyers,
  };
};

const getBuyerDetailsFromDB = async (buyerId: string) => {
  const buyer = await prisma.user.findUniqueOrThrow({
    where: { id: buyerId },
    select: {
      id: true,
      fullName: true,
      phoneNumber: true,
      email: true,
      gender: true,
      profileImage: true,
      canTransfer: true,
    },
  });
  return buyer;
};

const getAllBrandsFromDB = async (
  page: number = 1,
  limit: number = 10,
  search?: string,
) => {
  const whereCondition: Prisma.UserWhereInput = {
    role: "Brand",
    ...(search && {
      OR: [
        { fullName: { contains: search, mode: "insensitive" } },
        { phoneNumber: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const totalBrands = await prisma.user.count({
    where: { role: "Brand" },
  });

  const filteredBrandsCount = await prisma.user.count({
    where: whereCondition,
  });

  const totalPages = Math.ceil(filteredBrandsCount / limit);

  const brands = await prisma.user.findMany({
    where: whereCondition,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      fullName: true,
      phoneNumber: true,
      email: true,
      createdAt: true,
      profileImage: true,
      status: true,
      canTransfer: true,
      businesses: {
        select: {
          status: true,
        },
      },
    },
  });

  return {
    meta: {
      totalBrands,
      filteredBrands: filteredBrandsCount,
      totalPages,
      currentPage: page,
    },
    brands,
  };
};

const getBrandDetailsFromDB = async (brandId: string) => {
  const brand = await prisma.user.findUniqueOrThrow({
    where: { id: brandId },
    select: {
      id: true,
      fullName: true,
      phoneNumber: true,
      email: true,
      profileImage: true,
      canTransfer: true,
      businesses: {
        select: {
          status: true,
          NIDBack: true,
          NIDFront: true,
          tradeLicense: true,
        },
      },
    },
  });

  return brand;
};

const approveRejectBrand = async (brandId: string, isApprove: boolean) => {
  const business = await prisma.business.findUniqueOrThrow({
    where: { ownerId: brandId },
  });

  if (business.status !== "Pending") {
    throw new ApiError(400, "Brand verification already completed.");
  }

  const updatedStatus = isApprove ? "Approved" : "Rejected";

  await prisma.business.update({
    where: { ownerId: brandId },
    data: {
      status: updatedStatus,
    },
  });

  return {
    message: `Brand has been ${isApprove ? "approved" : "rejected"} successfully.`,
  };
};

const blockUnblockUser = async (userId: string) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      status: user.status === "Active" ? "Blocked" : "Active",
    },
  });

  return {
    message: `User has been ${user.status === "Active" ? "blocked" : "unblocked"} successfully.`,
  };
};

const getAllOrderItemsFromDB = async (
  page: number = 1,
  limit: number = 10,
  search?: string,
) => {
  const whereCondition: Prisma.OrderItemWhereInput = {};

  const totalOrderItems = await prisma.orderItem.count({
    where: whereCondition,
  });

  const filteredOrderItemsCount = await prisma.orderItem.count({
    where: whereCondition,
  });

  const totalPages = Math.ceil(filteredOrderItemsCount / limit);

  const orderItems = await prisma.orderItem.findMany({
    where: whereCondition,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      createdAt: true,
      quantity: true,
      subtotal: true,
      status: true,
      orderId: true,

      order: {
        select: {
          buyer: {
            select: {
              fullName: true,
            },
          },
          // stripePaymentIntentId: true,
        },
      },
      product: {
                                 
        select: {
          productName: true,
          price: true,
          business: {
            select: {
              businessName: true,
            },
          },
        },
      },
    },
  });

  return {
    meta: {
      totalOrderItems,
      filteredOrderItems: filteredOrderItemsCount,
      totalPages,
      currentPage: page,
    },
    orderItems,
  };
};

const toggleTransferPermission = async (userId: string) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      canTransfer: true,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      canTransfer: !user.canTransfer,
    },
  });

  return {
    message: `Transfer permission has been ${user.canTransfer ? "disabled" : "enabled"} successfully.`,
  };
};

const getAllProductsFromDB = async (
  page: number = 1,
  limit: number = 10,
  search?: string,
  categoryId?: string,
) => {
  const whereCondition: Prisma.ProductWhereInput = {
    ...(search && {
      OR: [
        { productName: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(categoryId && {
      categoryId,
    }),
  };

  const totalProducts = await prisma.product.count({
    where: whereCondition,
  });

  const filteredProductsCount = await prisma.product.count({
    where: whereCondition,
  });

  const totalPages = Math.ceil(filteredProductsCount / limit);

  const products = await prisma.product.findMany({
    where: whereCondition,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      productImages: true,
      productName: true,
      categoryId: true,
      price: true,
      status: true,
      totalStock: true,
      description: true,
      category: {
        select: {
          categoryName: true,
        },
      },
      business: {
        select: {
          businessName: true,
        },
      },
    },
  });

  return {
    meta: {
      totalProducts,
      filteredProducts: filteredProductsCount,
      totalPages,
      currentPage: page,
    },
    products,
  };
};

const getCampaignProducts = async ({
  userId,
  listingScope,
  selectedListingIds,
}: {
  userId: string;
  listingScope: string;
  selectedListingIds: string[];
}) => {
  if (listingScope === "SpecificListings") {
    if (selectedListingIds.length === 0) {
      return [];
    }

    const selectedProducts = await prisma.product.findMany({
      where: {
        id: { in: selectedListingIds },
        userId,
      },
      select: campaignProductSelect,
    });

    const productById = new Map(
      selectedProducts.map((product) => [product.id, product]),
    );

    return selectedListingIds
      .map((productId) => productById.get(productId))
      .filter((product): product is NonNullable<typeof product> =>
        Boolean(product),
      );
  }

  return prisma.product.findMany({
    where: { userId },
    select: campaignProductSelect,
  });
};

const getAllCampaignsFromDB = async () => {
  const campaigns = await prisma.campaign.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      userId: true,
      campaignName: true,
      objective: true,
      totalBudget: true,
      campaignDuration: true,
      startDate: true,
      endDate: true,
      dailySpendCap: true,
      listingScope: true,
      categoryId: true,
      selectedListingIds: true,
      placements: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const campaignsWithProducts = await Promise.all(
    campaigns.map(async (campaign) => ({
      ...campaign,
      products: await getCampaignProducts(campaign),
    })),
  );

  return {
    totalCampaigns: campaignsWithProducts.length,
    campaigns: campaignsWithProducts,
  };
};

const getMonthlyOrderChart = async (
  year: number = new Date().getFullYear(),
) => {
  const targetYear = Number.isFinite(year) ? year : new Date().getFullYear();

  const orderItems = await prisma.orderItem.findMany({
    where: {
      createdAt: {
        gte: new Date(targetYear, 0, 1),
        lt: new Date(targetYear + 1, 0, 1),
      },
    },
    select: {
      createdAt: true,
      subtotal: true,
    },
  });

  const monthOrder: string[] = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];

  const monthlyTotals = orderItems.reduce<Record<string, number>>(
    (accumulator, orderItem) => {
      const month = monthOrder[orderItem.createdAt.getMonth()];
      accumulator[month] = (accumulator[month] ?? 0) + orderItem.subtotal;
      return accumulator;
    },
    {},
  );

  return monthOrder.map((month) => ({ [month]: monthlyTotals[month] ?? 0 }));
};

const getMonthlyUserRegistrationChart = async (
  year: number = new Date().getFullYear(),
) => {
  const targetYear = Number.isFinite(year) ? year : new Date().getFullYear();

  const users = await prisma.user.findMany({
    where: {
      role: {
        not: "Admin",
      },
      createdAt: {
        gte: new Date(targetYear, 0, 1),
        lt: new Date(targetYear + 1, 0, 1),
      },
    },
    select: {
      createdAt: true,
    },
  });

  const monthOrder: string[] = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];

  const monthlyTotals = users.reduce<Record<string, number>>(
    (accumulator, user) => {
      const month = monthOrder[user.createdAt.getMonth()];
      accumulator[month] = (accumulator[month] ?? 0) + 1;
      return accumulator;
    },
    {},
  );

  return monthOrder.map((month) => ({ [month]: monthlyTotals[month] ?? 0 }));
};

const approveRejectProduct = async (productId: string, isApprove: boolean) => {
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
  });

  if (product.status !== "Pending") {
    throw new ApiError(400, "Product verification already completed.");
  }

  const updatedStatus = isApprove ? "Approved" : "Rejected";

  await prisma.product.update({
    where: { id: productId },
    data: {
      status: updatedStatus,
    },
  });

  return {
    message: `Product has been ${isApprove ? "approved" : "rejected"} successfully.`,
  };
};

const getAllCampaigns = async (page: number = 1, limit: number = 10) => {
  const totalCampaigns = await prisma.campaign.count({});

  const filteredCampaignsCount = await prisma.campaign.count({});

  const totalPages = Math.ceil(filteredCampaignsCount / limit);

  const campaigns = await prisma.campaign.findMany({
    skip: (page - 1) * limit,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      campaignDuration: true,
      campaignName: true,
      totalBudget: true,
      dailySpendCap: true,
      startDate: true,
      endDate: true,
      objective: true,
      status: true,
      placements: true,
      listingScope: true,
    },
  });

  return {
    meta: {
      totalCampaigns,
      filteredCampaigns: filteredCampaignsCount,
      totalPages,
      currentPage: page,
    },
    campaigns,
  };
};

const getOverviewStats = async () => {
  const totalBuyers = await prisma.user.count({
    where: { role: "Buyer" },
  });
  const totalBrands = await prisma.user.count({
    where: { role: "Brand" },
  });
  const totalProducts = await prisma.product.count({});
  const totalCampaigns = await prisma.campaign.count({});
  const totalOrders = await prisma.order.count({});

  return {
    totalBuyers,
    totalBrands,
    totalProducts,
    totalCampaigns,
    totalOrders,
  };
};

const brandOverviewStats = async () => {
  const pendingBrands = await prisma.business.count({
    where: { status: "Pending" },
  });
  const approvedBrands = await prisma.business.count({
    where: { status: "Approved" },
  });

  const blockedBrands = await prisma.user.count({
    where: { role: "Brand", status: "Blocked" },
  });

  return {
    pendingBrands,
    approvedBrands,
    blockedBrands,
  };
};

const getProductOverviewStats = async () => {
  const pendingProducts = await prisma.product.count({
    where: { status: "Pending" },
  });
  const totalProducts = await prisma.product.count({});

  const totalStock = await prisma.product.aggregate({
    _sum: {
      totalStock: true,
    },
  });

  return {
    pendingProducts,
    totalProducts,
    totalStock: totalStock._sum.totalStock ?? 0,
  };
};

const getOrderOverviewStats = async () => {
  const totalOrders = await prisma.orderItem.count({});
  const pendingOrders = await prisma.orderItem.count({
    where: { status: "Pending" },
  });
  const completedOrders = await prisma.orderItem.count({
    where: { status: "Delivered" },
  });

  const totalRevenueData = await prisma.orderItem.aggregate({
    where: { status: "Delivered" },
    _sum: {
      subtotal: true,
    },
  });

  return {
    totalOrders,
    pendingOrders,
    completedOrders,
    totalRevenue: totalRevenueData._sum.subtotal ?? 0,
  };
};

const getAllTransactionsFromDB = async (
  page: number = 1,
  limit: number = 10,
  type?: TTransactions,
) => {
  const totalTransactions = await prisma.transaction.count({
    where: type ? { transactionType: type } : {},
  });

  const totalPages = Math.ceil(totalTransactions / limit);

  const transactions = await prisma.transaction.findMany({
    where: type ? { transactionType: type } : {},
    skip: (page - 1) * limit,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      amount: true,
      createdAt: true,
      title: true,
      transactionType: true,
      user: {
        select: {
          fullName: true,
          profileImage: true,
          role: true,
        },
      },
    },
  });

  const totalTopUp = await prisma.transaction.aggregate({
    where: { transactionType: "TopUp" },
    _sum: {
      amount: true,
    },
  });

  const totalWithdraw = await prisma.transaction.aggregate({
    where: { transactionType: "Withdraw" },
    _sum: {
      amount: true,
    },
  });
  const totalPurchase = await prisma.transaction.aggregate({
    where: { transactionType: "Purchase" },
    _sum: {
      amount: true,
    },
  });

  return {
    meta: {
      totalTransactions,
      filteredTransactions: totalTransactions,
      totalPages,
      currentPage: page,
    },
    overview: {
      totalTopUp: totalTopUp._sum.amount ?? 0,
      totalWithdraw: totalWithdraw._sum.amount ?? 0,
      totalPurchase: totalPurchase._sum.amount ?? 0,
    },
    transactions,
  };
};

const updatePointSystem = async (payload: any) => {
  const point = await prisma.pointSetting.findFirst();

  if (point) {
    await prisma.pointSetting.update({
      where: { id: point.id },
      data: {
        ...payload,
      },
    });
  } else {
    await prisma.pointSetting.create({
      data: {
        ...payload,
      },
    });
  }

  return;
};

const getCurrentPointSystem = async () => {
  const point = await prisma.pointSetting.findFirst();

  return point;
};

const getPointOverviewStats = async () => {
  const point = await prisma.pointSetting.findFirst();
  const totalPointsGiven = await prisma.user.aggregate({
    _sum: {
      points: true,
    },
  });

  const totalActiveUsers = await prisma.user.count({
    where: { status: "Active" },
  });
  return {
    totalPointsGiven: totalPointsGiven._sum.points ?? 0,
    pointsReedemed: 0, // This can be calculated based on your redemption logic
    totalActiveUsers,
    value: point?.pointValue ?? 0,
  };
};

const updateAffiliateSystem = async (payload: any) => {
  const affiliate = await prisma.affiliateSetting.findFirst();

  if (affiliate) {
    await prisma.affiliateSetting.update({
      where: { id: affiliate.id },
      data: {
        ...payload,
      },
    });
  } else {
    await prisma.affiliateSetting.create({
      data: {
        ...payload,
      },
    });
  }

  return;
};

const getCurrentAffiliateSystem = async () => {
  const affiliate = await prisma.affiliateSetting.findFirst();

  return affiliate;
};
const updateSpinSystem = async (payload: any) => {
  const spin = await prisma.spinSetting.findFirst();

  if (spin) {
    await prisma.spinSetting.update({
      where: { id: spin.id },
      data: {
        ...payload,
      },
    });
  } else {
    await prisma.spinSetting.create({
      data: {
        ...payload,
      },
    });
  }

  return;
};

const getCurrentSpinSystem = async () => {
  const spin = await prisma.spinSetting.findFirst();

  return spin;
};

const createReward = async (payload: any) => {
  await prisma.reward.create({
    data: {
      ...payload,
    },
  });

  return;
};

const rewardsFromDB = async () => {
  const rewards = await prisma.reward.findMany({
    // orderBy: {
    //   createdAt: "desc",
    // },
    select: {
      id: true,
      title: true,
      percentage: true,
      subTitle: true,
    },
  });

  return rewards;
};

const updateReward = async (payload: any) => {
  const updates = Array.isArray(payload) ? payload : [payload];

  if (updates.length === 0) return [];

  const rewards = await prisma.reward.findMany();

  const existingMap = new Map(rewards.map((r) => [r.id, r.percentage ?? 0]));

  // Apply incoming percentage updates to a copy of existing percentages
  for (const u of updates) {
    if (!u.id)
      throw new ApiError(400, "Each reward update must include an 'id'.");
    if (u.percentage !== undefined && u.percentage !== null) {
      const val = Number(u.percentage);
      if (!Number.isFinite(val) || val < 0)
        throw new ApiError(400, "Invalid percentage value");
      existingMap.set(u.id, val);
    }
  }

  const total = Array.from(existingMap.values()).reduce(
    (s, n) => s + (n ?? 0),
    0,
  );
  if (Math.abs(total - 100) > 1e-6) {
    throw new ApiError(400, "Total percentage of all rewards must equal 100");
  }

  // Build update operations (only set provided fields)
  const ops = updates.map((u) => {
    const data: any = {};
    if (u.title !== undefined) data.title = u.title;
    if (u.subTitle !== undefined) data.subTitle = u.subTitle;
    if (u.percentage !== undefined) data.percentage = Number(u.percentage);

    return prisma.reward.update({
      where: { id: u.id },
      data,
    });
  });

  const result = await prisma.$transaction(ops);
  return result;
};

export const adminService = {
  getAllBuyersFromDB,
  getBuyerDetailsFromDB,
  getAllBrandsFromDB,
  getBrandDetailsFromDB,
  approveRejectBrand,
  approveRejectProduct,
  blockUnblockUser,
  getAllOrderItemsFromDB,
  toggleTransferPermission,
  getAllProductsFromDB,
  getAllCampaignsFromDB,
  getMonthlyOrderChart,
  getMonthlyUserRegistrationChart,
  getAllCampaigns,
  getOverviewStats,
  brandOverviewStats,
  getProductOverviewStats,
  getOrderOverviewStats,
  getAllTransactionsFromDB,
  updatePointSystem,
  getCurrentPointSystem,
  getPointOverviewStats,
  updateAffiliateSystem,
  getCurrentAffiliateSystem,
  updateSpinSystem,
  getCurrentSpinSystem,
  createReward,
  rewardsFromDB,
  updateReward,
};
