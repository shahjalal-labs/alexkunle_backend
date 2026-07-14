import { z } from "zod";

const walletValidationSchema = z.object({
  amount: z.number().positive(),
  paymentMethodId: z.string(),
});
const withdrawValidationSchema = z.object({
  amount: z.number().positive(),
});
const transferValidationSchema = z.object({
  amount: z.number().positive(),
  payeeId: z.string(),
});

export const walletValidation = {
  walletValidationSchema,
  withdrawValidationSchema,
  transferValidationSchema,
};
