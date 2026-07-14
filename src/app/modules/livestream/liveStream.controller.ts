import { liveStreamServices } from "./liveStream.service";
import sendResponse from "../../../shared/sendResponse";
import catchAsync from "../../../shared/catchAsync";
import { Request, Response } from "express";

const createLiveStream = catchAsync(async (req, res) => {
  const data = await liveStreamServices.createtLiveStream(
    req.body,
    req.user.id,
  );
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "The liveStream has been created successfully",
    data,
  });
});

const startLiveStream = catchAsync(async (req, res) => {
  const data = await liveStreamServices.startLiveStream(req.params.streamId);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "The liveStream has been started successfully",
    data,
  });
});

const endLiveStream = catchAsync(async (req, res) => {
  await liveStreamServices.endLiveStream(req.params.streamId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "The liveStream has been ended successfully",
  });
});

const myLiveOverview = catchAsync(async (req, res) => {
  const result = await liveStreamServices.myLiveOverview(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Live streams retrieved successfully",
    data: result,
  });
});

const myUpcomingLives = catchAsync(async (req, res) => {
  const result = await liveStreamServices.myUpcomingLives(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Upcoming live streams retrieved successfully",
    data: result,
  });
});

const myPastLives = catchAsync(async (req, res) => {
  const result = await liveStreamServices.myPastLives(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Past live streams retrieved successfully",
    data: result,
  });
});

const liveNow = catchAsync(async (req, res) => {
  const result = await liveStreamServices.liveNow(req.query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Live streams retrieved successfully",
    data: result,
  });
});

const getAllLiveStreams = catchAsync(async (req, res) => {
  const result = await liveStreamServices.getAllLiveStreams();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All liveStreams has been retrieved successfully",
    data: result,
  });
});

const getLiveStreamById = catchAsync(async (req, res) => {
  const result = await liveStreamServices.getLiveStreamById(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "liveStream has been retrived successfully",
    data: result,
  });
});

const updateLiveStream = catchAsync(async (req, res) => {
  await liveStreamServices.updateLiveStream(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "liveStream has been updated successfully",
  });
});

const deleteLiveStream = catchAsync(async (req, res) => {
  await liveStreamServices.deleteLiveStream(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "liveStream has been deleted successfully",
  });
});

export const liveWebhookController = catchAsync(
  async (req: Request, res: Response) => {
    const data = await liveStreamServices.liveStreamWebhook(req);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Stream webhook received successfully",
      data,
    });
  },
);

export const liveStreamControllers = {
  createLiveStream,
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
};
