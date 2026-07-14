import * as z from "zod";

export const createAuctionSchema = z.object({
  userId: z.string().optional(),
  stockId: z.string(),
  quantity: z.number().int().positive(),
  startTime: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  endTime: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  startingBid: z.number().positive(),
});

export const AuctionSchemaValidation = {
  createAuctionSchema,
};
