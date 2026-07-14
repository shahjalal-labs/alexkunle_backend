import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { userService } from "./user.services";

const createUser = catchAsync(async (req, res) => {
  const result = await userService.createUser(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Check your email for signup verification",
    data: result,
  });
});

const signupVerification = catchAsync(async (req, res) => {
  const result = await userService.signupVerification(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "OTP verification successful",
    data: result,
  });
});
const resendOTP = catchAsync(async (req, res) => {
  const result = await userService.resendOTP(req.body.email);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "OTP resent successfully",
    data: result,
  });
});
const myAffiliates = catchAsync(async (req, res) => {
  const result = await userService.getMyAffiliatesFromDB(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Affiliates retrieved successfully",
    data: result,
  });
});
const switchUserRole = catchAsync(async (req, res) => {
  const result = await userService.switchUserRole(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Role switched successfully",
    data: result,
  });
});
const setupProfile = catchAsync(async (req, res) => {
  await userService.setupProfileIntoDB(req);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Profile setup completed successfully",
  });
});
const setupBrandProfile = catchAsync(async (req, res) => {
  await userService.setupBrandProfileIntoDB(req);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Brand profile setup completed successfully",
  });
});

export const UserControllers = {
  createUser,
  signupVerification,
  resendOTP,
  myAffiliates,
  switchUserRole,
  setupProfile,
  setupBrandProfile,
};
