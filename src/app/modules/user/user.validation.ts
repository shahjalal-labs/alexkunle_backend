import { z } from "zod";

const userRegisterValidationSchema = z.object({
  fullName: z.string().min(1, "Full name must be at least 1 characters long"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Phone Number at least 10 Digit long"),
  countryCode: z.string().min(1, "Country code is required"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

const verificationSchema = z.object({
  email: z.string().min(10, "Phone Number min 10 Digit"),
  otp: z.string().min(4, "OTP must be at least 4 characters long"),
});
const resendOtpValidationSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const setupProfileValidationSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters long")
    .optional(),
  address: z.string(),
  referCode: z.string().optional(),
  gender: z.enum(["Male", "Female", "Others"]),
});
const setupBusinessValidationSchema = z.object({
  businessName: z
    .string()
    .min(2, "Business name must be at least 2 characters long"),
});

export const userValidation = {
  userRegisterValidationSchema,
  verificationSchema,
  resendOtpValidationSchema,
  setupProfileValidationSchema,
  setupBusinessValidationSchema,
};
