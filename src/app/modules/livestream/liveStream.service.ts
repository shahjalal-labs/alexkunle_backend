import { LiveStream } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import { paginationHelper } from "../../../shared/pagination";
import { Request } from "express";

const createtLiveStream = async (data: LiveStream, userId: string) => {
  const userInfo = await prisma.user.findUnique({ where: { id: userId } });
  if (!userInfo) throw new ApiError(404, "User not found");

  const streamInfo = await prisma.liveStream.create({
    data: {
      ...data,
      userId: userId,
      isLive: data.liveFor === "Schedule" ? false : true,
    },
  });
  return streamInfo;
};

const startLiveStream = async (streamId: string) => {
  const streamInfo = await prisma.liveStream.findUnique({
    where: { id: streamId },
  });
  if (!streamInfo) throw new ApiError(404, "Live stream not found");

  const startedLiveInfo = await prisma.liveStream.update({
    where: { id: streamId },
    data: {
      isLive: true,
    },
  });
  return startedLiveInfo;
};

const endLiveStream = async (streamId: string) => {
  const streamInfo = await prisma.liveStream.findUnique({
    where: { id: streamId },
  });
  if (!streamInfo) throw new ApiError(404, "Live stream not found");

  await prisma.liveStream.update({
    where: { id: streamId },
    data: { isLive: false, isCompleted: true },
  });
  return;
};

const myLiveOverview = async (userId: string) => {
  const totalViews = await prisma.liveStream.aggregate({
    where: { userId },
    _sum: { views: true },
  });

  const totalStreamTime = await prisma.liveStream.aggregate({
    where: { userId },
    _sum: {
      streamDuration: true,
    },
  });

  const liveCount = await prisma.liveStream.count({
    where: { userId, isCompleted: true },
  });

  const totalViewsValue = totalViews._sum.views ?? 0;

  const avgViews = totalViewsValue / (liveCount || 1);

  return {
    liveCount,
    totalViews: totalViewsValue,
    avgViews,
    totalStreamTime: totalStreamTime._sum.streamDuration,
  };
};

const liveNow = async (query: any, userId: string) => {
  const { page, limit, skip } = paginationHelper(query);

  const liveStreams = await prisma.liveStream.findMany({
    where: { isLive: true, isCompleted: false, NOT: { userId } },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          profileImage: true,
          businesses: {
            select: {
              id: true,
              businessName: true,
            },
          },
        },
      },
    },
    skip,
    take: limit,
  });

  const productIds = liveStreams.flatMap((stream) => stream.productIds);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      productName: true,
      price: true,
      totalStock: true,
      productImages: true,
    },
  });

  const productsMap = new Map(products.map((product) => [product.id, product]));

  const liveStreamsWithProducts = liveStreams.map((stream) => ({
    ...stream,
    products: stream.productIds.map((id) => productsMap.get(id)),
  }));

  const total = await prisma.liveStream.count({ where: { isLive: true } });
  const totalPages = Math.ceil(total / limit);
  return {
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
    liveStreams: liveStreamsWithProducts,
  };
};

const myUpcomingLives = async (userId: string) => {
  const liveStreams = await prisma.liveStream.findMany({
    where: {
      userId,
      isLive: false,
      isCompleted: false,
      scheduleAt: { gt: new Date() },
    },
    select: {
      id: true,
      title: true,
      scheduleAt: true,
      startTime: true,
      productIds: true,
    },
    orderBy: { scheduleAt: "asc" },
  });
  return liveStreams;
};

const myPastLives = async (userId: string) => {
  const liveStreams = await prisma.liveStream.findMany({
    where: { userId, isCompleted: true, scheduleAt: { lt: new Date() } },
    select: {
      id: true,
      title: true,
      views: true,
      scheduleAt: true,
      startTime: true,
      productIds: true,
    },
    orderBy: { updatedAt: "desc" },
  });
  return {
    liveStreams: liveStreams.map((stream) => ({
      ...stream,
      sales: stream.productIds.length,
      revenue: 1000,
    })),
  };
};

const getAllLiveStreams = async (userId: string) => {
  const results = await prisma.liveStream.findMany({
    where: { NOT: { userId }, isCompleted: false },
    // omit: { isCompleted: true },
  });
  return results;
};

const getLiveStreamById = async (id: string) => {
  const result = await prisma.liveStream.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      isLive: true,
      title: true,
      scheduleAt: true,
      category: {
        select: {
          id: true,
          categoryName: true,
        },
      },
      productIds: true,
      startTime: true,
      streamDuration: true,
      user: {
        select: {
          id: true,
          fullName: true,
          profileImage: true,
        },
      },
    },
  });

  const products = await prisma.product.findMany({
    where: { id: { in: result?.productIds } },
    select: {
      id: true,
      productName: true,
      productImages: true,
    },
  });
  if (!result) throw new ApiError(404, "Live stream not found");
  return {
    ...result,
    products,
  };
};

const updateLiveStream = async (id: string, data: LiveStream) => {
  const existingLiveStream = await prisma.liveStream.findUnique({
    where: { id },
  });
  if (!existingLiveStream) throw new ApiError(404, "Live stream not found");

  await prisma.liveStream.update({ where: { id }, data });
  return;
};

const deleteLiveStream = async (id: string) => {
  const existingLiveStream = await prisma.liveStream.findUnique({
    where: { id, isCompleted: false },
  });
  if (!existingLiveStream) throw new ApiError(404, "Live stream not found");

  await prisma.liveStream.delete({ where: { id } });
  return;
};

const liveStreamWebhook = async (req: Request) => {
  console.log("Recording Webhook Payload:", req.body);
  const roomId = req.body.room_id;
  if (req.body.event === "stream_close") {
    await prisma.liveStream.update({
      where: {
        id: roomId,
      },
      data: {
        isLive: false,
        isCompleted: true,
      },
    });
  }
  return;
};

export const liveStreamServices = {
  createtLiveStream,
  startLiveStream,
  endLiveStream,
  liveNow,
  myLiveOverview,
  myUpcomingLives,
  myPastLives,
  getAllLiveStreams,
  getLiveStreamById,
  updateLiveStream,
  deleteLiveStream,
  liveStreamWebhook,
};
