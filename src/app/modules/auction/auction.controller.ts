import { auctionServices } from "./auction.service";
import sendResponse from "../../../shared/sendResponse";
import catchAsync from "../../../shared/catchAsync";

const createAuction = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { stockId } = req.params;
  await auctionServices.createAuction(stockId, userId, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "The auction has been created successfully",
  });
});

const liveAuctions = catchAsync(async (req, res) => {
  const result = await auctionServices.liveAuctions(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All live auctions has been retrived successfully",
    data: result,
  });
});

const myAuctions = catchAsync(async (req, res) => {
  const result = await auctionServices.myAuctions(
    req.user.id,
    String(req.query?.filter ?? "All"),
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "My auctions has been retrived successfully",
    data: result,
  });
});

const getAuctionById = catchAsync(async (req, res) => {
  const result = await auctionServices.getAuctionById(
    req.params.id,
    req.user.id,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "auction has been retrived successfully",
    data: result,
  });
});

const placeBid = catchAsync(async (req, res) => {
  const { auctionId } = req.params;
  const { amount } = req.body;
  await auctionServices.placeBid(auctionId, req.user.id, amount);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Bid has been placed successfully",
  });
});

const moveToStock = catchAsync(async (req, res) => {
  const { auctionId } = req.params;
  await auctionServices.moveToStock(auctionId, req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Auction has been moved to stock successfully",
  });
});

const myPlacedBids = catchAsync(async (req, res) => {
  const result = await auctionServices.myPlacedBids(
    req.user.id,
    String(req.query?.filter ?? "All"),
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "My placed bids have been retrieved successfully",
    data: result,
  });
});

const updateAuction = catchAsync(async (req, res) => {
  await auctionServices.updateAuction(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "auction has been updated successfully",
  });
});

const deleteAuction = catchAsync(async (req, res) => {
  await auctionServices.deleteAuction(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "auction has been deleted successfully",
  });
});

export const auctionControllers = {
  createAuction,
  liveAuctions,
  myAuctions,
  getAuctionById,
  placeBid,
  updateAuction,
  deleteAuction,
  myPlacedBids,
  moveToStock,
};
