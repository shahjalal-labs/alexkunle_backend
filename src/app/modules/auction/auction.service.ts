import { Auction } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import cron from "node-cron";

const createAuction = async (
  stockId: string,
  userId: string,
  data: Auction,
) => {
  const stockInfo = await prisma.stock.findUnique({
    where: { id: stockId },
  });
  if (!stockInfo) throw new ApiError(404, "Stock not found");

  if (stockInfo.userId !== userId)
    throw new ApiError(
      403,
      "You are not authorized to create an auction for this stock",
    );

  if (stockInfo.quantity < data.quantity)
    throw new ApiError(400, "Not enough stock available for auction");

  await prisma.$transaction(async (tx) => {
    await tx.auction.create({
      data: {
        ...data,
        stockId,
        productId: stockInfo.productId,
        userId,
      },
    });

    await tx.stock.update({
      where: { id: stockId },
      data: {
        quantity: stockInfo.quantity - data.quantity,
      },
    });
  });
  return;
};

const liveAuctions = async (userId: string) => {
  const results = await prisma.auction.findMany({
    where: { isLive: true, auctionStatus: "Active", userId: { not: userId } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      isLive: true,
      product: {
        select: {
          id: true,
          productImages: true,
          productName: true,
        },
      },
      highestBid: true,
      endTime: true,
      _count: {
        select: {
          bids: true,
        },
      },
    },
  });
  return results;
};

const myAuctions = async (userId: string, filter = "All") => {
  const normalizedFilter = filter.toLowerCase();
  const statusMap: Record<string, "Active" | "Sold" | "Unsold" | "Completed"> =
    {
      active: "Active",
      sold: "Sold",
      unsold: "Unsold",
      completed: "Completed",
    };

  const results = await prisma.auction.findMany({
    where: {
      userId,
      ...(normalizedFilter !== "all" && statusMap[normalizedFilter]
        ? { auctionStatus: statusMap[normalizedFilter] }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      isLive: true,
      auctionStatus: true,
      product: {
        select: {
          id: true,
          productImages: true,
          productName: true,
        },
      },
      highestBid: true,
      endTime: true,
      _count: {
        select: {
          bids: true,
        },
      },
    },
  });

  return results.map((auction) => ({
    id: auction.id,
    isLive: auction.isLive,
    status: auction.auctionStatus,
    product: auction.product,
    highestBid: auction.highestBid,
    endTime: auction.endTime,
    _count: auction._count,
  }));
};

const getAuctionById = async (id: string, userId: string) => {
  const result = await prisma.auction.findUnique({
    where: { id },
    select: {
      id: true,
      isLive: true,
      auctionStatus: true,
      startingBid: true,
      product: {
        select: {
          id: true,
          productImages: true,
          productName: true,
          category: {
            select: {
              id: true,
              categoryName: true,
            },
          },
          rating: true,
          _count: {
            select: {
              clientReview: true,
            },
          },
        },
      },

      highestBid: true,
      _count: {
        select: {
          bids: true,
        },
      },
      endTime: true,
      bids: {
        select: {
          id: true,
          amount: true,
          user: {
            select: {
              id: true,
              fullName: true,
              profileImage: true,
            },
          },
          createdAt: true,
        },
        orderBy: {
          amount: "desc",
        },
      },
    },
  });
  if (!result) throw new ApiError(404, "Auction not found");
  return {
    ...result,
    bids: result.bids.map((bid) => {
      return {
        id: bid.id,
        amount: bid.amount,
        createdAt: bid.createdAt,
        user: {
          id: bid.user.id,
          fullName: bid.user.fullName,
          profileImage: bid.user.profileImage,
          isMe: bid.user.id === userId,
        },
      };
    }),
  };
};

const placeBid = async (auctionId: string, userId: string, amount: number) => {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
  });
  if (!auction) throw new ApiError(404, "Auction not found");
  if (!auction.isLive) throw new ApiError(400, "Auction is not live");
  if (auction.userId === userId)
    throw new ApiError(400, "You cannot bid on your own auction");
  if (amount <= auction.startingBid)
    throw new ApiError(400, "Bid amount must be higher than the starting bid");

  if (amount <= auction.highestBid)
    throw new ApiError(
      400,
      "Bid amount must be higher than current highest bid",
    );

  await prisma.$transaction(async (tx) => {
    await tx.bid.upsert({
      where: {
        auctionId_userId: {
          auctionId,
          userId,
        },
      },
      create: {
        amount,
        auctionId,
        userId,
      },
      update: {
        amount,
      },
    });

    await tx.auction.update({
      where: { id: auctionId },
      data: {
        highestBid: amount,
      },
    });
  });

  return;
};

const myPlacedBids = async (userId: string, filter = "All") => {
  const bids = await prisma.bid.findMany({
    where: { userId },
    select: {
      id: true,
      amount: true,
      auction: {
        select: {
          id: true,
          isLive: true,
          auctionStatus: true,
          product: {
            select: {
              id: true,
              productName: true,
              productImages: true,
            },
          },
          highestBid: true,
          endTime: true,
          _count: {
            select: {
              bids: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const normalizedFilter = filter.toLowerCase();

  const mappedBids = bids.map((bid) => {
    const isCompleted = ["Sold", "Unsold", "Completed"].includes(
      bid.auction.auctionStatus,
    );
    const bidAmount = Number(bid.amount);
    const highestBidAmount = Number(bid.auction.highestBid);
    const isWinning =
      bid.auction.auctionStatus === "Sold" && bidAmount >= highestBidAmount;

    return {
      id: bid.id,
      amount: bid.amount,
      status: isCompleted ? (isWinning ? "Win" : "Lose") : "Active",
      auction: {
        id: bid.auction.id,
        isLive: bid.auction.isLive,
        product: {
          id: bid.auction.product.id,
          productName: bid.auction.product.productName,
          productImages: bid.auction.product.productImages,
        },
        highestBid: bid.auction.highestBid,
        endTime: bid.auction.endTime,
        totalBids: bid.auction._count.bids,
      },
    };
  });

  const filteredBids = mappedBids.filter((bid) => {
    if (normalizedFilter === "all") return true;
    if (normalizedFilter === "completed")
      return bid.status === "Win" || bid.status === "Lose";
    if (normalizedFilter === "win") return bid.status === "Win";
    if (normalizedFilter === "lose") return bid.status === "Lose";
    return true;
  });

  return {
    bids: filteredBids,
  };
};

const moveToStock = async (auctionId: string, userId: string) => {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
  });
  if (!auction) throw new ApiError(404, "Auction not found");
  if (auction.userId !== userId)
    throw new ApiError(403, "You are not the owner of this auction");
  if (auction.isLive) throw new ApiError(400, "Auction is still live");
  if (auction.auctionStatus === "Sold") {
    throw new ApiError(400, "Cannot move to stock. Auction is sold");
  }

  await prisma.stock.update({
    where: { id: auction.stockId },
    data: {
      quantity: { increment: auction.quantity },
      auctions: {
        delete: { id: auctionId },
      },
    },
  });
  return;
};

const updateAuction = async (id: string, data: Auction) => {
  const auction = await prisma.auction.findUnique({
    where: { id },
  });
  if (!auction) throw new ApiError(404, "Auction not found");
  if (auction.isLive) throw new ApiError(400, "Cannot update a live auction");
  await prisma.auction.update({ where: { id }, data });
  return;
};

const deleteAuction = async (id: string) => {
  const auction = await prisma.auction.findUnique({
    where: { id },
  });
  if (!auction) throw new ApiError(404, "Auction not found");
  if (auction.isLive) throw new ApiError(400, "Cannot delete a live auction");
  await prisma.auction.delete({ where: { id } });
  return;
};

//cron jon to end auctions and update their status to Sold or Unsold based on whether they received any bids or not
const endAuctions = async () => {
  const now = new Date();
  const auctionsToEnd = await prisma.auction.findMany({
    where: {
      isLive: true,
      endTime: { lte: now },
    },
  });

  await prisma.$transaction(async (tx) => {
    for (const auction of auctionsToEnd) {
      const claimedAuction = await tx.auction.updateMany({
        where: {
          id: auction.id,
          isLive: true,
          endTime: { lte: now },
        },
        data: {
          isLive: false,
        },
      });

      // Skip auctions already processed by another job run or server instance.
      if (claimedAuction.count === 0) continue;

      const highestBid = await tx.bid.findFirst({
        where: { auctionId: auction.id },
        orderBy: { amount: "desc" },
      });

      await tx.auction.update({
        where: { id: auction.id },
        data: {
          isLive: false,
          auctionStatus: highestBid ? "Sold" : "Unsold",
        },
      });

      if (!highestBid) {
        await tx.stock.update({
          where: { id: auction.stockId },
          data: {
            quantity: { increment: auction.quantity },
          },
        });
      }
    }
  });
  return;
};

cron.schedule(
  "*/1 * * * *",
  async () => {
    try {
      await endAuctions();
      console.log(`Auction end running at ${Date.now()}`);
    } catch (error) {
      console.error("endAuctions cron failed:", error);
    }
  },
  {
    timezone: "Asia/Dhaka",
  },
);

export const auctionServices = {
  createAuction,
  liveAuctions,
  myAuctions,
  getAuctionById,
  placeBid,
  moveToStock,
  updateAuction,
  deleteAuction,
  myPlacedBids,
};
