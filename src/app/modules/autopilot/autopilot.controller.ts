import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { autopilotService } from "./autopilot.service";

const getAutopilotByUser = catchAsync(async (req, res) => {
  const result = await autopilotService.getAutopilotByUser(req.user.id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Autopilot data retrieved successfully",
    data: result,
  });
});

const addFromStock = catchAsync(async (req, res) => {
  const result = await autopilotService.addFromStock(
    req.user.id,
    req.body.stockId,
    req.body.targetSellPrice,
  );

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Stock product added to autopilot successfully",
    data: result,
  });
});

const completeAutopilotItem = catchAsync(async (req, res) => {
  const result = await autopilotService.completeAutopilotItem(
    req.user.id,
    req.params.id,
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Autopilot item marked as completed successfully",
    data: result,
  });
});

const cancelAutopilotItem = catchAsync(async (req, res) => {
  const result = await autopilotService.cancelAutopilotItem(
    req.user.id,
    req.params.id,
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Autopilot item cancelled successfully",
    data: result,
  });
});
const moveToStock = catchAsync(async (req, res) => {
  await autopilotService.moveToStock(req.params.id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Autopilot item moved to stock successfully",
  });
});

export const autopilotController = {
  getAutopilotByUser,
  addFromStock,
  completeAutopilotItem,
  cancelAutopilotItem,
  moveToStock,
};
