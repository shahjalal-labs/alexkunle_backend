import { z } from "zod";

const tokenSchema = z.object({
  amount: z.number(),
  paymentMethodId: z.string({
    required_error: "Payment method is required",
  }),
});

export const tokenValidation = {
  tokenSchema,
};
