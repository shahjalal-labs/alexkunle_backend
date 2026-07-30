import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { addressService } from "./address.service";

const createNewDeliveryAddress = catchAsync(async (req, res) => {
  await addressService.createNewDeliveryAddress(req.user.id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Delivery address created successfully",
  });
});

const getUserDeliveryAddresses = catchAsync(async (req, res) => {
  const addresses = await addressService.getUserDeliveryAddresses(req.user.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Delivery addresses retrieved successfully",
    data: addresses,
  });
});

const createCampusAddress = catchAsync(async (req, res) => {
  await addressService.createCampusAddress(req.user.id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Pick up address created successfully",
  });
});

const getBrandPickupAddress = catchAsync(async (req, res) => {
  const address = await addressService.getBrandPickupAddress(req.user.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Pickup address retrieved successfully",
    data: address,
  });
});

const updatePickupAddress = catchAsync(async (req, res) => {
  await addressService.updatePickupAddress(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Pickup address updated successfully",
  });
});

export const addressController = {
  createNewDeliveryAddress,
  getUserDeliveryAddresses,
  createCampusAddress,
  getBrandPickupAddress,
  updatePickupAddress,
};
