import { z } from "zod";

const reviewValidationSchema = z.object({
  itemId: z.string(),
  rating: z
    .number({
      required_error: "Rating is required",
      invalid_type_error: "Rating must be a number",
    })
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5"),
  comment: z.string({
    required_error: "Comment is required",
  }),
});

export const orderSchema = {
  reviewValidationSchema,
};
