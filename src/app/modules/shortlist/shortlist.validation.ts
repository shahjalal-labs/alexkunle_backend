import { z } from "zod";

const wishlistValidationSchema = z.object({
  productId: z.string(),
});

const cartQuantityValidationSchema = z.object({
  cartId: z.string(),
  isIncrease: z.boolean(),
});

export const shortlistValidation = {
  wishlistValidationSchema,
  cartQuantityValidationSchema,
};
