import ApiError from "../../../errors/ApiErrors";
import { createStripePaymentIntent } from "../../../helpers/stripe.helper";
import prisma from "../../../shared/prisma";

const toNumber = (value: unknown) => {
  const parsedValue = Number(value);
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
};

const createStockInDB = async (userId: string, payload: any) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
  });

  const isUsingWallet = Boolean(payload?.isUsingWallet);

  const rawCartIds = payload?.cartIds;
  const cartIds = Array.isArray(rawCartIds)
    ? Array.from(new Set(rawCartIds.filter(Boolean)))
    : [];

  if (cartIds.length === 0) {
    throw new ApiError(400, "cart Ids must contain at least one cart id");
  }

  const carts = await prisma.cart.findMany({
    where: {
      userId,
      id: {
        in: cartIds,
      },
    },
    select: {
      id: true,
      quantity: true,
      product: {
        select: {
          id: true,
          price: true,
          totalStock: true,
          variants: {
            select: {
              id: true,
              stock: true,
            },
          },
        },
      },
    },
  });

  if (carts.length !== cartIds.length) {
    throw new ApiError(
      400,
      "Some cart ids are invalid or do not belong to this user",
    );
  }

  const normalizedItems = carts.map((cart) => {
    const quantity = toNumber(cart.quantity);

    if (quantity <= 0) {
      throw new ApiError(400, "Item quantity must be greater than 0");
    }

    const firstVariant = cart.product.variants[0];

    if (!firstVariant) {
      throw new ApiError(400, "Product has no variant available");
    }

    if (quantity > firstVariant.stock || quantity > cart.product.totalStock) {
      throw new ApiError(400, "Requested quantity exceeds available stock");
    }

    return {
      cartId: cart.id,
      productId: cart.product.id,
      variantId: firstVariant.id,
      quantity,
      subtotal: toNumber(cart.product.price) * quantity,
    };
  });

  const totalAmount = normalizedItems.reduce(
    (total, item) => total + toNumber(item.subtotal),
    0,
  );

  if (totalAmount <= 0) {
    throw new ApiError(400, "Total amount must be greater than 0");
  }

  if (!isUsingWallet) {
    if (!payload?.paymentMethodId) {
      throw new ApiError(
        400,
        "Payment method is required when wallet is not used",
      );
    }

    const paymentIntent = await createStripePaymentIntent(
      user.id,
      payload.paymentMethodId,
      totalAmount,
    );

    if (paymentIntent.status !== "succeeded") {
      throw new ApiError(400, "Payment failed. Please try again.");
    }
  }

  await prisma.$transaction(async (tx) => {
    if (isUsingWallet) {
      const walletUser = await tx.user.findUniqueOrThrow({
        where: {
          id: user.id,
        },
      });

      if (walletUser.wallet < totalAmount) {
        throw new ApiError(400, "Insufficient funds in wallet");
      }

      await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          wallet: { decrement: totalAmount },
        },
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          transactionType: "Purchase",
          amount: totalAmount,
          title: "Stock Payment (Wallet)",
          status: "Active",
        },
      });
    }

    await tx.stock.createMany({
      data: normalizedItems.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        subtotal: item.subtotal,
        userId,
      })),
    });

    await Promise.all(
      normalizedItems.map(async (item) => {
        const updatedVariant = await tx.variant.updateMany({
          where: {
            id: item.variantId,
            stock: {
              gte: item.quantity,
            },
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        if (updatedVariant.count === 0) {
          throw new ApiError(400, "Stock changed. Please try again");
        }

        const updatedProduct = await tx.product.updateMany({
          where: {
            id: item.productId,
            totalStock: {
              gte: item.quantity,
            },
          },
          data: {
            totalStock: {
              decrement: item.quantity,
            },
          },
        });

        if (updatedProduct.count === 0) {
          throw new ApiError(400, "Product stock changed. Please try again");
        }
      }),
    );

    await tx.cart.deleteMany({
      where: {
        userId,
        id: {
          in: normalizedItems.map((item) => item.cartId),
        },
      },
    });
  });

  return;
};

const getUserWiseStocksFromDB = async (userId: string) => {
  const stocks = await prisma.stock.findMany({
    where: {
      userId,
      quantity: { gt: 0 },
    },
    select: {
      id: true,
      quantity: true,
      subtotal: true,
      createdAt: true,
      product: {
        select: {
          id: true,
          price: true,
          productImages: true,
          productName: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const stockAnalytics = stocks.map((stock) => {
    const buyValue = toNumber(stock.subtotal);
    const quantity = toNumber(stock.quantity);
    const currentPrice = toNumber(stock.product.price);
    const currentValue = currentPrice * quantity;
    const profitOrLoss = currentValue - buyValue;
    const rawGrowthPercentage =
      buyValue > 0 ? (profitOrLoss / buyValue) * 100 : 0;
    const growthPercentage = Number(rawGrowthPercentage.toFixed(1));

    return {
      id: stock.id,
      quantity,
      purchasedAt: stock.createdAt,
      buyValue,
      currentValue,
      profitOrLoss,
      growthPercentage,
      isProfit: profitOrLoss >= 0,
      product: {
        id: stock.product.id,
        productImages: stock.product.productImages,
        productName: stock.product.productName,
      },
    };
  });

  const totalInvested = stockAnalytics.reduce(
    (total, stock) => total + toNumber(stock.buyValue),
    0,
  );
  const totalCurrentValue = stockAnalytics.reduce(
    (total, stock) => total + toNumber(stock.currentValue),
    0,
  );
  const totalProfitOrLoss = totalCurrentValue - totalInvested;
  const rawOverallGrowthPercentage =
    totalInvested > 0 ? (totalProfitOrLoss / totalInvested) * 100 : 0;
  const overallGrowthPercentage = Number(rawOverallGrowthPercentage.toFixed(1));

  return {
    overall: {
      totalInvested,
      totalCurrentValue,
      totalProfitOrLoss,
      overallGrowthPercentage,
      isProfit: totalProfitOrLoss >= 0,
      totalItems: stockAnalytics.length,
    },
    stocks: stockAnalytics,
  };
};

const stockDetails = async (stockId: string, userId: string) => {
  const stockInfo = await prisma.stock.findUnique({
    where: {
      id: stockId,
    },
    select: {
      id: true,
      quantity: true,
      subtotal: true,
      createdAt: true,
      product: {
        select: {
          id: true,
          price: true,
          productName: true,
          productImages: true,
          category: {
            select: {
              id: true,
              categoryName: true,
            },
          },
        },
      },
    },
  });

  if (!stockInfo) throw new ApiError(404, "Stock not found");

  const buyValue = toNumber(stockInfo.subtotal);
  const quantity = toNumber(stockInfo.quantity);
  const currentPrice = toNumber(stockInfo.product.price);
  const currentValue = currentPrice * quantity;
  const profitOrLoss = currentValue - buyValue;
  const rawGrowthPercentage =
    buyValue > 0 ? (profitOrLoss / buyValue) * 100 : 0;
  const growthPercentage = Number(rawGrowthPercentage.toFixed(1));
  const priceHistory = [
    { month: "Jan", price: 80 },
    { month: "Feb", price: 130 },
    { month: "Mar", price: 90 },
    { month: "Apr", price: 170 },
    { month: "May", price: 230 },
    { month: "Jun", price: 510 },
    { month: "Jul", price: 180 },
  ];

  return {
    id: stockInfo.id,
    quantity,
    purchasedAt: stockInfo.createdAt,
    buyValue,
    currentPrice,
    currentValue,
    profitOrLoss,
    growthPercentage,
    isProfit: profitOrLoss >= 0,
    priceHistory,
    product: {
      id: stockInfo.product.id,
      productImages: stockInfo.product.productImages,
      productName: stockInfo.product.productName,
      category: stockInfo.product.category,
    },
  };
};

const createDirectStockWithoutCart = async (userId: string, payload: any) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
  });

  const product = await prisma.product.findUniqueOrThrow({
    where: {
      id: payload.productId,
    },
    include: {
      variants: true,
    },
  });

  const quantity = toNumber(payload.quantity);
  if (quantity <= 0) {
    throw new ApiError(400, "Item quantity must be greater than 0");
  }

  const selectedVariant = product.variants[0];
  if (!selectedVariant) {
    throw new ApiError(400, "Product has no variant available");
  }

  if (quantity > selectedVariant.stock || quantity > product.totalStock) {
    throw new ApiError(400, "Requested quantity exceeds available stock");
  }

  const totalAmount = toNumber(product.price) * quantity;
  if (totalAmount <= 0) {
    throw new ApiError(400, "Total amount must be greater than 0");
  }

  const isUsingWallet = Boolean(payload?.isUsingWallet);

  if (!isUsingWallet) {
    if (!payload?.paymentMethodId) {
      throw new ApiError(
        400,
        "Payment method is required when wallet is not used",
      );
    }

    const paymentIntent = await createStripePaymentIntent(
      user.id,
      payload.paymentMethodId,
      totalAmount,
    );

    if (paymentIntent.status !== "succeeded") {
      throw new ApiError(400, "Payment failed. Please try again.");
    }
  }

  await prisma.$transaction(async (tx) => {
    if (isUsingWallet) {
      const walletUser = await tx.user.findUniqueOrThrow({
        where: {
          id: user.id,
        },
      });

      if (walletUser.wallet < totalAmount) {
        throw new ApiError(400, "Insufficient funds in wallet");
      }

      await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          wallet: { decrement: totalAmount },
        },
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          transactionType: "Purchase",
          amount: totalAmount,
          title: "Stock Payment (Wallet)",
          status: "Active",
        },
      });
    }

    await tx.stock.create({
      data: {
        productId: product.id,
        variantId: selectedVariant.id,
        quantity,
        subtotal: totalAmount,
        userId,
      },
    });

    const updatedVariant = await tx.variant.updateMany({
      where: {
        id: selectedVariant.id,
        stock: {
          gte: quantity,
        },
      },
      data: {
        stock: {
          decrement: quantity,
        },
      },
    });

    if (updatedVariant.count === 0) {
      throw new ApiError(400, "Stock changed. Please try again");
    }

    const updatedProduct = await tx.product.updateMany({
      where: {
        id: product.id,
        totalStock: {
          gte: quantity,
        },
      },
      data: {
        totalStock: {
          decrement: quantity,
        },
      },
    });

    if (updatedProduct.count === 0) {
      throw new ApiError(400, "Product stock changed. Please try again");
    }
  });

  return;
};

export const stockService = {
  createStockInDB,
  createDirectStockWithoutCart,
  getUserWiseStocksFromDB,
  stockDetails,
};
