import { z } from "zod";

const approveRejectBrandSchema = z.object({
  brandId: z.string(),
  isApprove: z.boolean(),
});
const approveRejectProductSchema = z.object({
  productId: z.string(),
  isApprove: z.boolean(),
});

export const adminValidation = {
  approveRejectBrandSchema,
  approveRejectProductSchema,
};
