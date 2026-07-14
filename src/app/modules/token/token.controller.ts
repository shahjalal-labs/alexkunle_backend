import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { tokenService } from "./token.service";

const myTokenHistory = catchAsync(async (req, res) => {
  const result = await tokenService.getMyTokenHistory(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Token history retrieved successfully",
    data: result,
  });
});
const buyToken = catchAsync(async (req, res) => {
  await tokenService.buyToken(req.user.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Tokens purchased successfully",
  });
});
const spinNow = catchAsync(async (req, res) => {
  const result =await tokenService.spinNow(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Wheel spun successfully",
    data: result,
  });
});

export const tokenController = {
  myTokenHistory,
  spinNow,
  buyToken,
};
