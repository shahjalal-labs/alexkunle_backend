import { User } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import bcrypt from "bcryptjs";
import prisma from "../../../shared/prisma";
import generateOTP from "../../../helpers/generateOtp";
import config from "../../../config";
import sendEmail from "../../../helpers/sendEmail";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import { Request } from "express";
import { uploadInSpace } from "../../../helpers/uploadInSpace";

const createUser = async (payload: User) => {
  const existingEmail = await prisma.user.findUnique({
    where: { email: payload.email },
  });
  if (existingEmail) {
    throw new ApiError(409, "User already exists using this email.");
  }

  const existingPhone = await prisma.user.findUnique({
    where: { phoneNumber: payload.phoneNumber },
  });
  if (existingPhone) {
    throw new ApiError(409, "User already exists using this phone number.");
  }

  const hashedPassword = await bcrypt.hash(
    payload.password,
    Number(config.jwt.gen_salt),
  );

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.pendingUser.upsert({
      where: { email: payload.email },
      update: {
        email: payload.email,
        fullName: payload.fullName,
        password: hashedPassword,
        phoneNumber: payload.phoneNumber,
        countryCode: payload.countryCode,
      },
      create: {
        email: payload.email,
        fullName: payload.fullName,
        password: hashedPassword,
        phoneNumber: payload.phoneNumber,
        countryCode: payload.countryCode,
      },
    });

    await tx.otp.upsert({
      where: { email: payload.email },
      update: { otp, expiresAt },
      create: { email: payload.email, otp, expiresAt },
    });
  });

  const emailSubject = "Signup Verification";
  const emailHtml = `<div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Account verification</h2>
          <p>Hi <b>${payload.fullName}</b>,</p>
          <p>Your OTP for account verification is:</p>
          <h1 style="color: #007BFF;">${otp}</h1>
          <p>This OTP is valid for <b>5 minutes</b>. If you did not request this, please ignore this email.</p>
          <p>Thanks, <br>The Support Team</p>
        </div>`;
  await sendEmail(payload.email, emailSubject, emailHtml);

  return otp;
};

const resendOTP = async (email: string) => {
  const pendingUser = await prisma.pendingUser.findUnique({
    where: { email },
  });
  if (!pendingUser) {
    throw new ApiError(404, "No pending user found. Please sign up again.");
  }

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.otp.update({
    where: { email },
    data: { otp, expiresAt },
  });

  const emailSubject = "OTP Resend";
  const emailHtml = `<div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Resend OTP</h2>
          <p>Hi <b>${pendingUser.fullName}</b>,</p>
          <p>Your new OTP for account verification is:</p>
          <h1 style="color: #007BFF;">${otp}</h1>
          <p>This OTP is valid for <b>5 minutes</b>. If you did not request this, please ignore this email.</p>
          <p>Thanks, <br>The Support Team</p>
        </div>`;
  await sendEmail(email, emailSubject, emailHtml);

  return otp;
};

const signupVerification = async (payload: {
  email: string;
  otp: string;
  fcmToken?: string;
}) => {
  const { email, otp } = payload;

  const pendingUser = await prisma.pendingUser.findUnique({
    where: { email },
  });
  if (!pendingUser) {
    throw new ApiError(404, "No pending user found. Please sign up again.");
  }

  const otpRecord = await prisma.otp.findUnique({ where: { email } });
  if (!otpRecord) {
    throw new ApiError(400, "OTP not found. Please sign up again.");
  }

  if (new Date() > otpRecord.expiresAt) {
    await prisma.otp.delete({ where: { email } });
    throw new ApiError(400, "OTP has expired. Please sign up again.");
  }

  if (otp !== otpRecord.otp) {
    throw new ApiError(401, "Invalid OTP.");
  }

  const user = await prisma.$transaction(async (tx) => {
    const user = await prisma.user.create({
      data: {
        email: pendingUser.email,
        fullName: pendingUser.fullName,
        password: pendingUser.password,
        phoneNumber: pendingUser.phoneNumber,
        countryCode: pendingUser.countryCode,
        referralCode: `YOUTH${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        fcmToken: payload.fcmToken || null,
      },
    });
    await tx.pendingUser.delete({ where: { email } });
    await tx.otp.delete({ where: { email } });
    return user;
  });

  const accessToken = jwtHelpers.generateToken(
    { id: user.id, role: user.role },
    config.jwt.jwt_secret as string,
    config.jwt.expires_in as string,
  );

  return { id: user.id, role: user.role, accessToken };
};

const setupProfileIntoDB = async (req: Request) => {
  const userId = req.user.id;
  const payload = req.body;
  const file = req.file;

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, isSetupCompleted: true, referralCode: true },
  });

  if (user.isSetupCompleted) {
    throw new ApiError(400, "Profile setup is already completed.");
  }

  const processImage = async (file: Express.Multer.File, folder: string) => {
    if (!file) return null;
    return uploadInSpace(file, `courses/${folder}`);
  };

  const profileImage = file ? await processImage(file, "profileImage") : null;

  if (!profileImage) {
    throw new ApiError(404, "Image is required");
  }

  if (payload.referCode) {
    if (user.referralCode === payload.referCode) {
      throw new ApiError(400, "You cannot use your own referral code");
    }

    const referrer = await prisma.user.findUnique({
      where: { referralCode: payload.referCode },
    });
    if (!referrer) {
      throw new ApiError(404, "Invalid referral code");
    }

    const affiliateSetting = await prisma.affiliateSetting.findFirst({
      select: {
        referralReward: true,
      },
    });

    await prisma.usedReferral.create({
      data: {
        referrerId: referrer.id,
        refereeId: userId,
        referCode: payload.referCode,
        commission: affiliateSetting?.referralReward || 10,
      },
    });

    await prisma.user.update({
      where: { id: referrer.id },
      data: { wallet: { increment: affiliateSetting?.referralReward || 10 } },
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      profileImage,
      isSetupCompleted: true,
      address: payload.address,
      fullName: payload.fullName,
      gender: payload.gender,
    },
  });

  return;
};
const setupBrandProfileIntoDB = async (req: Request) => {
  const userId = req.user.id;
  const payload = req.body;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, businesses: true },
  });

  if (user.businesses.length > 0) {
    throw new ApiError(400, "Brand profile setup is already completed.");
  }

  const processImages = async (
    files: Express.Multer.File[],
    folder: string,
  ) => {
    if (!files || files.length === 0) return null;
    return Promise.all(
      files.map((file) => uploadInSpace(file, `posts/${folder}`)),
    );
  };

  const [tradeLicense, NIDBack, NIDFront] = await Promise.all([
    processImages(files?.tradeLicense, "tradeLicense"),
    processImages(files?.NIDBack, "NIDBack"),
    processImages(files?.NIDFront, "NIDFront"),
  ]);

  if (!tradeLicense || !NIDBack || !NIDFront) {
    throw new ApiError(404, "All documents are required");
  }

  await prisma.business.create({
    data: {
      ownerId: userId,
      businessName: payload.businessName,
      tradeLicense: tradeLicense[0],
      NIDBack: NIDBack[0],
      NIDFront: NIDFront[0],
    },
  });

  return;
};

const getMyAffiliatesFromDB = async (userId: string) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true },
  });

  const totalCommission = await prisma.usedReferral.aggregate({
    where: { referrerId: user.id },
    _sum: { commission: true },
  });

  const myAffiliates = await prisma.usedReferral.findMany({
    where: { referrerId: user.id },
    select: {
      id: true,
      createdAt: true,
      referCode: true,
      commission: true,
      referee: {
        select: {
          fullName: true,
          profileImage: true,
        },
      },
    },
  });
  return { totalCommission: totalCommission._sum.commission, myAffiliates };
};

const switchUserRole = async (userId: string) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, role: true, businesses: true },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      role: user.role === "Buyer" ? "Brand" : "Buyer",
    },
  });

  const accessToken = jwtHelpers.generateToken(
    { id: user.id, role: user.role === "Buyer" ? "Brand" : "Buyer" },
    config.jwt.jwt_secret as string,
    config.jwt.expires_in as string,
  );

  return {
    id: user.id,
    role: user.role === "Buyer" ? "Brand" : "Buyer",
    accessToken,
    isBrandProfileCompleted: user.businesses.length > 0 ? true : false,
  };
};

export const userService = {
  createUser,
  signupVerification,
  resendOTP,
  getMyAffiliatesFromDB,
  switchUserRole,
  setupProfileIntoDB,
  setupBrandProfileIntoDB,
};
