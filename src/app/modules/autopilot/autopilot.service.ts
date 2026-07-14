import { AutopilotStatus } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";

const getAutopilotByUser = async (userId: string) => {
  const autoPiliotItemsCount = await prisma.autopilotItem.count();
  const completedAutoPilotItemsCount = await prisma.autopilotItem.count({
    where: { status: "Completed" },
  });

  const successRate =
    autoPiliotItemsCount > 0
      ? (completedAutoPilotItemsCount / autoPiliotItemsCount) * 100
      : 0;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const activeItemsCount = await prisma.autopilotItem.count({
    where: { userId, status: "Active" },
  });

  const totalProfit = await prisma.autopilotItem.aggregate({
    where: { userId, status: "Completed" },
    _sum: {
      profit: true,
    },
  });

  const commission = (totalProfit._sum.profit ?? 0) * 0.05;

  const completedItemsCount = await prisma.autopilotItem.count({
    where: { userId, status: "Completed" },
  });

  const items = await prisma.autopilotItem.findMany({
    where: { userId },
    orderBy: { placedAt: "desc" },
    select: {
      id: true,
      productName: true,
      buyPrice: true,
      sellPrice: true,
      targetSellPrice: true,
      profit: true,
      status: true,
      placedAt: true,
    },
  });

  return {
    successRate: successRate.toFixed(2),
    commission,
    totalProfit: totalProfit._sum.profit ?? 0,
    activeItemsCount,
    completedItemsCount,
    items,
  };
};

const addFromStock = async (
  userId: string,
  stockId: string,
  targetSellPrice?: number | string,
) => {
  const stock = await prisma.stock.findFirst({
    where: {
      id: stockId,
      userId,
    },
    select: {
      id: true,
      userId: true,
      quantity: true,
      subtotal: true,
      productId: true,
      product: {
        select: {
          productName: true,
        },
      },
    },
  });

  if (!stock) {
    throw new ApiError(404, "Stock product not found");
  }

  if (stock.quantity <= 0) {
    throw new ApiError(
      400,
      "Only stock products with quantity can be added to autopilot",
    );
  }

  const alreadyAdded = await prisma.autopilotItem.findUnique({
    where: { stockId },
  });

  if (alreadyAdded) {
    throw new ApiError(409, "This stock product is already in autopilot");
  }

  const buyPrice =
    stock.quantity > 0 ? stock.subtotal / stock.quantity : stock.subtotal;
  const parsedTargetSellPrice =
    targetSellPrice === undefined ||
    targetSellPrice === null ||
    targetSellPrice === ""
      ? Number((buyPrice * 1.15).toFixed(2))
      : Number(targetSellPrice);

  if (
    Number.isNaN(parsedTargetSellPrice) ||
    parsedTargetSellPrice <= buyPrice
  ) {
    throw new ApiError(400, "Target sell price must be greater than buy price");
  }

  const item = await prisma.autopilotItem.create({
    data: {
      userId,
      stockId: stock.id,
      productId: stock.productId,
      productName: stock.product.productName,
      quantity: stock.quantity,
      buyPrice,
      targetSellPrice: parsedTargetSellPrice,
      status: "Active",
    },
    select: {
      id: true,
      stockId: true,
      productName: true,
      quantity: true,
      buyPrice: true,
      sellPrice: true,
      targetSellPrice: true,
      profit: true,
      status: true,
      placedAt: true,
    },
  });

  return item;
};

const updateStatus = async (
  userId: string,
  itemId: string,
  status: AutopilotStatus,
) => {
  const item = await prisma.autopilotItem.findFirst({
    where: {
      id: itemId,
      userId,
    },
    select: {
      id: true,
      stockId: true,
      productName: true,
      quantity: true,
      buyPrice: true,
      sellPrice: true,
      targetSellPrice: true,
      profit: true,
      status: true,
      placedAt: true,
    },
  });

  if (!item) {
    throw new ApiError(404, "Autopilot item not found");
  }

  if (item.status !== "Active") {
    throw new ApiError(400, "Only active autopilot items can be updated");
  }

  const sellPrice =
    status === "Completed"
      ? (item.targetSellPrice ?? Number((item.buyPrice * 1.1).toFixed(2)))
      : null;

  const profit =
    status === "Completed" && sellPrice !== null
      ? Number((sellPrice - item.buyPrice).toFixed(2))
      : 0;

  const updatedItem = await prisma.autopilotItem.update({
    where: { id: itemId },
    data: {
      status,
      sellPrice,
      profit,
    },
    select: {
      id: true,
      stockId: true,
      productName: true,
      quantity: true,
      buyPrice: true,
      sellPrice: true,
      targetSellPrice: true,
      profit: true,
      status: true,
      placedAt: true,
    },
  });

  return updatedItem;
};

const completeAutopilotItem = async (userId: string, itemId: string) =>
  updateStatus(userId, itemId, "Completed");

const cancelAutopilotItem = async (userId: string, itemId: string) =>
  updateStatus(userId, itemId, "Unsold");

const moveToStock = async (pilotId: string) => {
  await prisma.autopilotItem.findUniqueOrThrow({
    where: { id: pilotId, status: "Unsold" },
  });

  await prisma.autopilotItem.delete({
    where: { id: pilotId },
  });
};

export const autopilotService = {
  getAutopilotByUser,
  addFromStock,
  completeAutopilotItem,
  cancelAutopilotItem,
  moveToStock,
};
