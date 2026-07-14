import { Product } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import { uploadInSpace } from "../../../helpers/uploadInSpace";
import { paginationHelper } from "../../../shared/pagination";
import { ObjectId } from "mongodb";

type ProductVariantInput = {
  size: string;
  color: string;
  stock: number | string;
};

type ProductUpdateInput = {
  productName?: string;
  brand?: string;
  categoryId?: string;
  description?: string;
  specifications?: string;
  price?: number | string;
  deliveryTimeline?: string;
  returnPolicy?: string | null;
  totalStock?: number | string;
  flashDrop?: boolean | string;
};

const parseNumber = (value: number | string | undefined, fallback: number) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsedValue = Number(value);
  return Number.isNaN(parsedValue) ? fallback : parsedValue;
};

const parseBoolean = (
  value: boolean | string | undefined,
  fallback: boolean,
) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return value === "true" || value === "1";
};

const sumVariantStock = (variants: ProductVariantInput[]) =>
  variants.reduce((total, variant) => total + parseNumber(variant.stock, 0), 0);

const createProduct = async (
  data: Product,
  userId: string,
  files: { [fieldname: string]: Express.Multer.File[] },
  variants?: ProductVariantInput[],
) => {
  const userInfo = await prisma.user.findUnique({ where: { id: userId } });
  if (!userInfo) {
    throw new ApiError(404, "User not found");
  }


  const businessInfo = await prisma.business.findUnique({
    where: { ownerId: userId },
  });
  if (!businessInfo) {
    throw new ApiError(404, "Business not found");
  }

  if (businessInfo.status !== "Approved") {
    throw new ApiError(
      403,
      "Your business is not approved yet. You cannot add products.",
    );
  }

  const categoryInfo = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });
  if (!categoryInfo) {
    throw new ApiError(404, "Category not found");
  }

  const processImages = async (files?: Express.Multer.File[]) => {
    if (!files || files.length === 0) return [];
    return Promise.all(
      files.map((file) => uploadInSpace(file, "product-files")),
    );
  };

  const productImages = await processImages(files?.productImages);
  const productVideos = await processImages(files?.productVideos);

  const productData = {
    userId,
    businessId: businessInfo.id,
    productName: data.productName,
    brand: data.brand,
    categoryId: data.categoryId,
    description: data.description,
    price: parseFloat(data.price.toString()),
    deliveryTimeline: data.deliveryTimeline,
    returnPolicy: data.returnPolicy ?? undefined,
    productImages: productImages || [],
    productVideos: productVideos || [],
    totalStock: variants
      ? sumVariantStock(variants)
      : parseInt(data.totalStock.toString()),
    specifications: data.specifications ?? undefined,
  };

  await prisma.product.create({
    data: {
      ...productData,
      variants: {
        create: variants
          ? variants.map((variant) => ({
              size: variant.size,
              color: variant.color,
              stock: parseInt(variant.stock.toString()),
            }))
          : [],
      },
    },
  });

  return;
};

const editProduct = async (
  id: string,
  userId: string,
  data: ProductUpdateInput,
  files?: { [fieldname: string]: Express.Multer.File[] },
  variants?: ProductVariantInput[],
) => {
  const userInfo = await prisma.user.findUnique({ where: { id: userId } });
  if (!userInfo) {
    throw new ApiError(404, "User not found");
  }

  const businessInfo = await prisma.business.findUnique({
    where: { ownerId: userId },
  });
  if (!businessInfo) {
    throw new ApiError(404, "Business not found");
  }

  if (businessInfo.status !== "Approved") {
    throw new ApiError(
      403,
      "Your business is not approved yet. You cannot edit products.",
    );
  }

  const existingProduct = await prisma.product.findFirst({
    where: { id, userId },
    select: {
      id: true,
      productImages: true,
      productVideos: true,
      totalStock: true,
      categoryId: true,
      productName: true,
      brand: true,
      description: true,
      price: true,
      deliveryTimeline: true,
      returnPolicy: true,
      flashDrop: true,
      specifications: true,
    },
  });

  if (!existingProduct) {
    throw new ApiError(404, "Product not found");
  }

  if (data.categoryId) {
    const categoryInfo = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!categoryInfo) {
      throw new ApiError(404, "Category not found");
    }
  }

  const processImages = async (inputFiles?: Express.Multer.File[]) => {
    if (!inputFiles || inputFiles.length === 0) return [];
    return Promise.all(
      inputFiles.map((file) => uploadInSpace(file, "product-files")),
    );
  };

  const takeProductImages = files?.productImages || [];
  const takeProductVideos = files?.productVideos || [];

  const productImages =
    takeProductImages.length > 0
      ? await processImages(takeProductImages)
      : existingProduct.productImages;

  const productVideos =
    takeProductVideos.length > 0
      ? await processImages(takeProductVideos)
      : existingProduct.productVideos;

  const hasVariants = Array.isArray(variants);
  const nextTotalStock = hasVariants
    ? sumVariantStock(variants)
    : data.totalStock !== undefined
      ? parseNumber(data.totalStock, existingProduct.totalStock)
      : existingProduct.totalStock;

  await prisma.product.update({
    where: { id },
    data: {
      productName: data.productName ?? existingProduct.productName,
      brand: data.brand ?? existingProduct.brand,
      categoryId: data.categoryId ?? existingProduct.categoryId,
      description: data.description ?? existingProduct.description,
      price:
        data.price !== undefined
          ? parseNumber(data.price, existingProduct.price)
          : existingProduct.price,
      deliveryTimeline:
        data.deliveryTimeline ?? existingProduct.deliveryTimeline,
      returnPolicy:
        data.returnPolicy !== undefined
          ? data.returnPolicy
          : existingProduct.returnPolicy,
      flashDrop: parseBoolean(data.flashDrop, existingProduct.flashDrop),
      specifications: data.specifications ?? existingProduct.specifications,
      totalStock: nextTotalStock,
      ...(takeProductImages.length > 0
        ? { productImages: { set: productImages } }
        : {}),
      ...(takeProductVideos.length > 0
        ? { productVideos: { set: productVideos } }
        : {}),
      ...(hasVariants
        ? {
            variants: {
              deleteMany: {},
              create: variants.map((variant) => ({
                size: variant.size,
                color: variant.color,
                stock: parseNumber(variant.stock, 0),
              })),
            },
          }
        : {}),
    },
  });

  return;
};

const myProducts = async (userId: string, query: any) => {
  const { page, limit, skip, search } = paginationHelper(query);
  const { categoryId } = query;

  const userInfo = await prisma.user.findUnique({ where: { id: userId } });
  if (!userInfo) throw new ApiError(404, "User not found");

  const whereClause: any = { userId };
  if (search) {
    whereClause.productName = { contains: search, mode: "insensitive" };
  }
  if (categoryId) {
    whereClause.categoryId = categoryId;
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    select: {
      id: true,
      productName: true,
      productImages: true,
      description: true,
      category: {
        select: {
          id: true,
          categoryName: true,
        },
      },
      totalStock: true,
      price: true,
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });

  const total = await prisma.product.count({ where: whereClause });
  const totalPages = Math.ceil(total / limit);

  return {
    meta: {
      total,
      currentPage: page,
      limit,
      totalPages,
    },
    products,
  };
};

const brandOverview = async (userId: string) => {
  const totalProducts = await prisma.product.count({ where: { userId } });
  const totalCampaigns = await prisma.campaign.count({ where: { userId } });
  const totalOrders = await prisma.orderItem.count({
    where: { product: { userId }, status: { not: "Cancelled" } },
  });
  const totalRevenueData = await prisma.orderItem.aggregate({
    where: { product: { userId }, status: { not: "Cancelled" } },
    _sum: {
      subtotal: true,
    },
  });

  return {
    totalRevenue: totalRevenueData._sum.subtotal || 0,
    revenueMark: "+0% growth",
    totalOrders: totalOrders,
    orderMark: "+0% growth",
    totalProducts: totalProducts,
    totalCampaigns: totalCampaigns,
    campaignMark: "+0% growth",
  };
};

const flashDrops = async (query: any) => {
  const { page, limit, skip } = paginationHelper(query);
  const products = await prisma.product.findMany({
    where: { flashDrop: true, totalStock: { gt: 0 } },
    select: {
      id: true,
      productName: true,
      price: true,
      productImages: true,
      description: true,
      totalStock: true,
      rating: true,
      reviews: true,
      youthPrice: true,
    },
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  const total = await prisma.product.count({
    where: { flashDrop: true, totalStock: { gt: 0 } },
  });

  return {
    meta: {
      total,
      currentPage: page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    products: products.map((product) => ({
      ...product,
      offerPrice: product.youthPrice,
    })),
  };
};

const trendingInvest = async (query: any) => {
  const { page, limit, skip } = paginationHelper(query);

  const products = await prisma.product.findMany({
    where: { totalStock: { gt: 0 } },
    select: {
      id: true,
      productName: true,
      price: true,
      productImages: true,
      rating: true,
      reviews: true,
      youthPrice: true,
      investIncrease: true,
      totalStock: true,
      description: true,
      category: {
        select: {
          id: true,
          categoryName: true,
        },
      },
    },
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  const total = await prisma.product.count({
    where: { totalStock: { gt: 0 } },
  });

  return {
    meta: {
      total,
      currentPage: page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    products,
  };
};

const youthPriceDeals = async (query: any) => {
  const { page, limit, skip } = paginationHelper(query);

  const products = await prisma.product.findMany({
    where: { totalStock: { gt: 0 } },
    select: {
      id: true,
      productName: true,
      price: true,
      productImages: true,
      rating: true,
      reviews: true,
      youthPrice: true,
      investIncrease: true,
      totalStock: true,
      description: true,
      category: {
        select: {
          id: true,
          categoryName: true,
        },
      },
    },
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  const total = await prisma.product.count({
    where: { totalStock: { gt: 0 } },
  });

  return {
    meta: {
      total,
      currentPage: page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    products,
  };
};

const getAllProducts = async (query: any) => {
  const { page, limit, skip, search } = paginationHelper(query);
  const { categoryId, rating, min_price, max_price, sortby } = query;
  const catObjectId =
    categoryId && ObjectId.isValid(categoryId)
      ? new ObjectId(categoryId)
      : null;

  const whereClause: any = { totalStock: { gt: 0 } };
  if (search) {
    whereClause.productName = { contains: search, mode: "insensitive" };
  }
  if (catObjectId) {
    whereClause.categoryId = catObjectId;
  }
  if (rating) {
    whereClause.rating = { gte: parseFloat(rating) };
  }
  if (min_price) {
    whereClause.price = { ...whereClause.price, gte: parseFloat(min_price) };
  }
  if (max_price) {
    whereClause.price = { ...whereClause.price, lte: parseFloat(max_price) };
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    select: {
      id: true,
      productName: true,
      productImages: true,
      productVideos: true,
      description: true,
      rating: true,
      category: {
        select: {
          id: true,
          categoryName: true,
        },
      },
      totalStock: true,
      price: true,
    },
    orderBy:
      sortby === "asc" || sortby === "desc"
        ? { productName: sortby }
        : { createdAt: sortby === "recent" ? "desc" : undefined },
    skip,
    take: limit,
  });

  const total = await prisma.product.count({ where: whereClause });
  const totalPages = Math.ceil(total / limit);

  return {
    meta: {
      total,
      currentPage: page,
      limit,
      totalPages,
    },
    products,
  };
};

const getProductById = async (id: string, userId: string) => {
  const result = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      productName: true,
      brand: true,
      totalStock: true,
      productImages: true,
      productVideos: true,
      price: true,
      description: true,
      rating: true,
      reviews: true,
      youthPrice: true,
      specifications: true,
      category: {
        select: {
          id: true,
          categoryName: true,
        },
      },
      variants: {
        select: {
          id: true,
          size: true,
          color: true,
          stock: true,
        },
      },
      returnPolicy: true,
    },
  });

  if (!result) throw new ApiError(404, "Product not found");

  const wishlistEntry = await prisma.wishlist.findFirst({
    where: {
      userId,
      productId: id,
    },
  });

  return {
    ...result,
    isInWishlist: wishlistEntry ? true : false,
  };
};

const productViewById = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      productName: true,
      brand: true,
      productImages: true,
      productVideos: true,
      price: true,
      description: true,
      category: {
        select: {
          id: true,
          categoryName: true,
        },
      },
    },
  });
  if (!product) throw new ApiError(404, "Product not found");

  return product;
};

const deleteProduct = async (id: string) => {
  const existingProduct = await prisma.product.findUnique({ where: { id } });
  if (!existingProduct) {
    throw new ApiError(404, "Product not found");
  }
  await prisma.product.delete({ where: { id } });
  return;
};

const getFeaturedProducts = async (liveId: string) => {
  const lives = await prisma.liveStream.findUnique({
    where: { id: liveId },
  });

  const productsIds = lives?.productIds || [];
  const products = await prisma.product.findMany({
    where: { id: { in: productsIds }, totalStock: { gt: 0 } },
    select: {
      id: true,
      productImages: true,
      productName: true,
      price: true,
    },
  });
  return products;
};

const getAllReviewsForProduct = async (productId: string) => {
  const reviews = await prisma.review.findMany({
    where: { productId },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      user: {
        select: {
          fullName: true,
          profileImage: true,
        },
      },
    },
  });

  return reviews;
};

const getPriceTrendOverviewForProduct = async (productId: string) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      productName: true,
      brand: true,
      price: true,
      youthPrice: true,
      totalStock: true,
      rating: true,
      reviews: true,
      flashDrop: true,
      createdAt: true,
      updatedAt: true,
      category: {
        select: {
          id: true,
          categoryName: true,
        },
      },
      variants: {
        select: {
          id: true,
          stock: true,
        },
      },
    },
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const [
    orderStats,
    reviewStats,
    auctionStats, 
    liveCount,
    wishlistCount,   
  ] = await Promise.all([
    prisma.orderItem.aggregate({
      where: { productId, status: { not: "Cancelled" } },
      _sum: {
        quantity: true,
        subtotal: true,
      },
      _count: {
        _all: true,
      },
    }),
    prisma.review.aggregate({
      where: { productId },
      _avg: {
        rating: true,
      },
      _count: {
        _all: true,
      },
    }),
    prisma.auction.aggregate({
      where: { productId },
      _sum: {
        quantity: true,
        highestBid: true,
      },
      _count: {
        _all: true,
      },
    }),
    prisma.auction.count({
      where: { productId, auctionStatus: "Active" },
    }),
    prisma.liveStream.count({
      where: { productIds: { has: productId } },
    }),
    prisma.wishlist.count({
      where: { productId },
    }),
    prisma.stock.aggregate({
      where: { productId },
      _sum: {
        quantity: true,
        subtotal: true,
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const currentPrice = product.price; 
  const soldUnits = orderStats._sum.quantity ?? 0;
  const reviewCount = reviewStats._count._all ?? product.reviews ?? 0;
  const averageRating = reviewStats._avg.rating ?? product.rating ?? 0;
  const auctionCount = auctionStats._count._all ?? 0;
  const liveAppearances = liveCount ?? 0;
  const watchlistCount = wishlistCount ?? 0;

  const estimatedSoldUnits =
    soldUnits > 0
      ? soldUnits
      : Math.max(
          0,
          Math.round(
            (reviewCount * 1.5 + watchlistCount + liveAppearances * 2) / 2,
          ),
        );


  const demandScore = Math.min(
    1,
    Math.max(
      0,
      ((averageRating || 0) / 5) * 0.4 +
        Math.min(
          estimatedSoldUnits /
            Math.max(product.totalStock + estimatedSoldUnits, 1),
          1,
        ) *
          0.35 +
        Math.min((watchlistCount + liveAppearances + auctionCount) / 20, 1) *
          0.25,
    ),
  );

  const estimatedDropRate = Math.min(
    0.35,
    Math.max(
      0.05,
      0.08 +
        (1 - demandScore) * 0.18 +
        (product.flashDrop ? 0.04 : 0) +
        (product.totalStock > 0 ? 0.01 : 0.06),
    ),
  );

  const estimatedPeakPrice = currentPrice / (1 - estimatedDropRate);
  const historicalPrice = Math.max(product.youthPrice ?? 0, estimatedPeakPrice);
  const priceDelta = historicalPrice - currentPrice;
  const priceChangePercent =
    historicalPrice > 0 ? (priceDelta / historicalPrice) * 100 : 0;
  const isPriceDown = priceDelta >= 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 2,
    }).format(value);

  const timelinePoints = isPriceDown
    ? [
        historicalPrice,
        historicalPrice * 0.97,
        historicalPrice * 0.94,
        historicalPrice * 0.91,
        currentPrice,
      ]
    : [
        historicalPrice * 0.92,
        historicalPrice * 0.95,
        historicalPrice * 0.98,
        historicalPrice,
        currentPrice,
      ];

  const priceTrendLabels = ["Jan 1", "Jan 15", "Feb 1", "Feb 15", "Feb 22"];

  return {
    summary: {
      commissionRate: 18,
      commissionPerSale: formatCurrency(currentPrice * 0.18),
    },
    priceTrend: {
      points: timelinePoints.map((price, index) => ({
        label: priceTrendLabels[index],
        price: Number(price.toFixed(2)),
      })),
      currentPrice,
      historicalPrice: Number(historicalPrice.toFixed(2)),
      priceDroppedPercentage: Number(Math.abs(priceChangePercent).toFixed(2)),      
      trendLabel: isPriceDown
        ? `Price dropped ${Math.abs(priceChangePercent).toFixed(0)}% in the last month`
        : `Price increased ${Math.abs(priceChangePercent).toFixed(0)}% in the last month`,
    },
  };
};

export const productServices = {
  createProduct,
  editProduct,
  myProducts,
  brandOverview,
  getAllProducts,
  getProductById,
  productViewById,
  deleteProduct,
  flashDrops,
  trendingInvest,
  youthPriceDeals,
  getFeaturedProducts,
  getAllReviewsForProduct,
  getPriceTrendOverviewForProduct,
};
