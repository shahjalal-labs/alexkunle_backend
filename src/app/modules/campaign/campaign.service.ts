import {
  Campaign,
  CampaignObjective,
  CampaignPlacement,
  ListingScope,
} from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";

type CampaignCreateInput = {
  campaignName: string;
  objective: CampaignObjective;
  totalBudget: number | string;
  campaignDuration: number | string;
  startDate: string;
  endDate: string;
  dailySpendCap?: number | string;
  listingScope: ListingScope;
  categoryId?: string;
  selectedListingIds?: string[];
  placements: CampaignPlacement[];
};

const toNumber = (value: number | string | undefined) => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsedValue = Number(value);
  if (Number.isNaN(parsedValue)) return undefined;
  return parsedValue;
};

const randomFloat = (min: number, max: number, decimals = 2) => {
  const value = Math.random() * (max - min) + min;
  return Number(value.toFixed(decimals));
};

const generateCampaignMetrics = () => ({
  clicks: Math.floor(Math.random() * 10) + 1,
  ctr: randomFloat(0.2, 10, 2),
  roas: randomFloat(0.5, 10, 2),
});

const buildFallbackCampaignDetailsAnalytics = (
  placements: CampaignPlacement[] = [],
) => {
  const impressions = Math.floor(Math.random() * 10) + 1;
  const clicks = Math.floor(Math.random() * impressions) + 1;
  const conversions = Math.floor(Math.random() * (clicks + 1));

  const placementKeys =
    placements.length > 0
      ? placements
      : (["HomeFeed", "CategoryPage", "Search"] as const);

  const placementPerformance = placementKeys.slice(0, 3).map((placement) => ({
    placement,
    clicks: Math.floor(Math.random() * 10) + 1,
    ctr: randomFloat(0.2, 10, 2),
    conversions: Math.floor(Math.random() * 10),
  }));

  return {
    performanceOverview: {
      impressions,
      clicks,
      ctr: randomFloat(0.2, 10, 2),
      cpc: randomFloat(0.1, 10, 2),
      conversions,
      roas: randomFloat(0.5, 10, 2),
    },
    conversionFunnel: {
      impressions,
      clicks,
      conversions,
    },
    placementPerformance,
  };
};

const createCampaign = async (userId: string, data: CampaignCreateInput) => {
  await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });

  const totalBudget = toNumber(data.totalBudget);
  const campaignDuration = toNumber(data.campaignDuration);
  const dailySpendCap = toNumber(data.dailySpendCap);

  if (!totalBudget || totalBudget <= 0) {
    throw new ApiError(400, "Total budget must be greater than 0");
  }

  if (!campaignDuration || campaignDuration <= 0) {
    throw new ApiError(400, "Campaign duration must be greater than 0");
  }

  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new ApiError(400, "Invalid start date or end date");
  }

  if (startDate > endDate) {
    throw new ApiError(400, "Start date cannot be greater than end date");
  }

  if (dailySpendCap !== undefined && dailySpendCap <= 0) {
    throw new ApiError(400, "Daily spend cap must be greater than 0");
  }

  if (data.categoryId) {
    await prisma.category.findUniqueOrThrow({
      where: { id: data.categoryId },
    });
  }

  const selectedListingIds = Array.isArray(data.selectedListingIds)
    ? Array.from(new Set(data.selectedListingIds.filter(Boolean)))
    : [];

  if (
    data.listingScope === "SpecificListings" &&
    selectedListingIds.length === 0
  ) {
    throw new ApiError(
      400,
      "selectedListingIds is required for specific listings campaign",
    );
  }

  if (selectedListingIds.length > 0) {
    const products = await prisma.product.findMany({
      where: {
        id: { in: selectedListingIds },
        userId,
        ...(data.categoryId ? { categoryId: data.categoryId } : {}),
      },
      select: { id: true },
    });

    if (products.length !== selectedListingIds.length) {
      throw new ApiError(
        400,
        "Some selected listings are invalid or not owned by this brand",
      );
    }
  }

  const campaign = await prisma.campaign.create({
    data: {
      userId,
      campaignName: data.campaignName,
      objective: data.objective,
      totalBudget,
      campaignDuration: Math.floor(campaignDuration),
      startDate,
      endDate,
      dailySpendCap,
      listingScope: data.listingScope,
      categoryId: data.categoryId,
      selectedListingIds,
      placements: data.placements,
    },
    select: {
      id: true,
      campaignName: true,
      objective: true,
      totalBudget: true,
      campaignDuration: true,
      startDate: true,
      endDate: true,
      dailySpendCap: true,
      listingScope: true,
      categoryId: true,
      selectedListingIds: true,
      placements: true,
      status: true,
      createdAt: true,
    },
  });

  return campaign;
};

const myCampaigns = async (userId: string) => {
  const campaigns = await prisma.campaign.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      campaignName: true,
      objective: true,
      totalBudget: true,
      campaignDuration: true,
      dailySpendCap: true,
      listingScope: true,
      placements: true,
      status: true,
      startDate: true,
      endDate: true,
      createdAt: true,
    },
  });

  return campaigns.map((campaign) => ({
    ...campaign,
    ...generateCampaignMetrics(),
  }));
};

const getCampaignById = async (userId: string, id: string) => {
  const campaign = await prisma.campaign.findFirst({
    where: {
      id,
      userId,
    },
    select: {
      id: true,
      campaignName: true,
      objective: true,
      totalBudget: true,
      campaignDuration: true,
      startDate: true,
      endDate: true,
      dailySpendCap: true,
      listingScope: true,
      categoryId: true,
      selectedListingIds: true,
      placements: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!campaign) {
    throw new ApiError(404, "Campaign not found");
  }

  return {
    ...campaign,
    ...generateCampaignMetrics(),
    analytics: buildFallbackCampaignDetailsAnalytics(campaign.placements),
  };
};

const deleteCampaign = async (id: string) => {
  await prisma.campaign.delete({
    where: {
      id,
    },
  });

  return;
};

export const campaignService = {
  createCampaign,
  myCampaigns,
  getCampaignById,
  deleteCampaign,
};
