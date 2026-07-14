import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { orderService } from "./order.service";

const createOrder = catchAsync(async (req, res) => {
  const order = await orderService.createNewOrderInDB(req.user.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Order created successfully",
    data: order,
  });
});
const createDirectOrder = catchAsync(async (req, res) => {
  await orderService.createDirectOrderWithoutCart(req.user.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Direct order created successfully",
  });
});
const getOrderItems = catchAsync(async (req, res) => {
  const orderItems = await orderService.getBrandWiseOrderItems(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Order items retrieved successfully",
    data: orderItems,
  });
});
const acceptOrder = catchAsync(async (req, res) => {
  await orderService.acceptOrderInDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Order accepted successfully",
  });
});
const rejectOrder = catchAsync(async (req, res) => {
  await orderService.rejectOrderInDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Order rejected successfully",
  });
});
const cancelOrder = catchAsync(async (req, res) => {
  await orderService.cancelOrderInDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Order cancelled successfully",
  });
});
const deliverOrder = catchAsync(async (req, res) => {
  await orderService.deliverOrderInDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Order delivered successfully",
  });
});

const getOrderItemsBuyerWise = catchAsync(async (req, res) => {
  const orderItems = await orderService.getBuyerWiseOrderItems(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Order items retrieved successfully",
    data: orderItems,
  });
});
const orderDetails = catchAsync(async (req, res) => {
  const orderItem = await orderService.getOrderDetails(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Order details retrieved successfully",
    data: orderItem,
  });
});
const createReview = catchAsync(async (req, res) => {
  await orderService.createReviewForOrderItem(req.user.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Review submitted successfully",
  });
});

export const orderController = {
  createOrder,
  createDirectOrder,
  getOrderItems,
  acceptOrder,
  rejectOrder,
  cancelOrder,
  deliverOrder,
  getOrderItemsBuyerWise,
  orderDetails,
  createReview,
};
