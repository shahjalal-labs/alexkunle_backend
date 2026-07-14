import { z } from "zod";

const addressValidationSchema = z.object({
  fullName: z.string(),
  phoneNumber: z.string().regex(/^\+?[0-9]{10,15}$/, "Invalid phone number"),
  postCode: z.string(),
  houseNo: z.string(),
  street: z.string(),
  city: z.string(),
  country: z.string(),
  toNeighbor: z.boolean().optional(),
  neighborName: z.string().optional(),
  neighborPhone: z
    .string()
    .regex(/^\+?[0-9]{8,15}$/, "Invalid phone number")
    .optional(),
  neighborHouse: z.string().optional(),
});

export const addressValidation = {
  addressValidationSchema,
};
