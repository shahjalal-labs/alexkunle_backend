import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { campaignService } from "./campaign.service";

const createCampaign = catchAsync(async (req, res) => {
  const result = await campaignService.createCampaign(req.user.id, req.body);

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Campaign created successfully",
    data: result,
  });
});

const myCampaigns = catchAsync(async (req, res) => {
  const result = await campaignService.myCampaigns(req.user.id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Campaigns retrieved successfully",
    data: result,
  });
});
const deleteCampaign = catchAsync(async (req, res) => {
  await campaignService.deleteCampaign(req.params.id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Campaign deleted successfully",
  });
});

const getCampaignById = catchAsync(async (req, res) => {
  const result = await campaignService.getCampaignById(
    req.user.id,
    req.params.id,
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Campaign retrieved successfully",
    data: result,
  });
});

export const campaignController = {
  createCampaign,
  myCampaigns,
  getCampaignById,
  deleteCampaign,
};
