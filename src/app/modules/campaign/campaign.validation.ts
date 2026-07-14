import { z } from "zod";

const objectiveEnum = z.enum([
  "BrandAwareness",
  "DriveTraffic",
  "BoostConversions",
]);

const listingScopeEnum = z.enum(["AllListings", "SpecificListings"]);

const placementEnum = z.enum([
  "HomeFeed",
  "SearchResults",
  "CategoryPages",
  "BrandPages",
]);

const createCampaignValidationSchema = z.object({
  campaignName: z.string().min(1),
  objective: objectiveEnum,
  totalBudget: z.union([z.number().positive(), z.string().min(1)]),
  campaignDuration: z.union([z.number().int().positive(), z.string().min(1)]),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  dailySpendCap: z.union([z.number().positive(), z.string().min(1)]).optional(),
  listingScope: listingScopeEnum,
  categoryId: z.string().optional(),
  selectedListingIds: z.array(z.string()).optional(),
  placements: z.array(placementEnum).min(1),
});

export const campaignValidation = {
  createCampaignValidationSchema,
};
