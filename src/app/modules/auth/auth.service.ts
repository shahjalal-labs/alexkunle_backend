import prisma from "../../../shared/prisma";
import bcrypt from "bcryptjs";
import ApiError from "../../../errors/ApiErrors";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import config from "../../../config";
import { Request } from "express";
import generateOTP from "../../../helpers/generateOtp";
import { uploadInSpace } from "../../../helpers/uploadInSpace";
import sendEmail from "../../../helpers/sendEmail";
import { formHtml } from "../../../helpers/formHtml";
import sendFormInfo from "../../../helpers/sendFormInfo";

const loginWithEmail = async (payload: {
  email: string;
  password: string;
  fcmToken?: string;
}) => {
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
    include: { businesses: true },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.status === "Blocked") {
    throw new ApiError(
      403,
      "Your account has been blocked. Please contact support.",
    );
  }

  const isPasswordValid = await bcrypt.compare(
    payload.password,
    user?.password,
  );

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const todayDate = new Date();

  if (todayDate.getDate() !== user.lastLogin?.getDate()) {
    await prisma.user.update({
      where: { id: user.id },
      data: { tokens: { increment: 5 } },
    });
    await prisma.tokenTransaction.create({
      data: {
        userId: user.id,
        transactionType: "Reward",
        token: 5,
        amount: null,
        title: "Daily login bonus",
      },
    });
  }

  if (payload.fcmToken) {
    await prisma.user.update({
      where: { id: user.id },
      data: { fcmToken: payload.fcmToken },
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: todayDate },
  });

  const accessToken = jwtHelpers.generateToken(
    { id: user.id, role: user.role },
    config.jwt.jwt_secret as string,
    config.jwt.expires_in as string,
  );

  return {
    id: user.id,
    accessToken,
    role: user.role,
    isSetupCompleted: user.isSetupCompleted,
    isBrandProfileCompleted: user.businesses.length > 0 ? true : false,
  };
};

const loginWithPhone = async (payload: {
  phoneNumber: string;
  password: string;
  fcmToken?: string;
}) => {
  const user = await prisma.user.findUnique({
    where: {
      phoneNumber: payload.phoneNumber,
    },
    include: { businesses: true },
  });

  if (!user) throw new ApiError(404, "User not found");

  if (user.status === "Blocked") {
    throw new ApiError(
      403,
      "Your account has been blocked. Please contact support.",
    );
  }

  const isPasswordValid = await bcrypt.compare(
    payload.password,
    user?.password,
  );

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const todayDate = new Date();

  if (todayDate.getDate() !== user.lastLogin?.getDate()) {
    await prisma.user.update({
      where: { id: user.id },
      data: { tokens: { increment: 5 } },
    });

    await prisma.tokenTransaction.create({
      data: {
        userId: user.id,
        transactionType: "Reward",
        token: 5,
        amount: null,
        title: "Daily login bonus",
      },
    });
  }

  if (payload.fcmToken) {
    await prisma.user.update({
      where: { id: user.id },
      data: { fcmToken: payload.fcmToken },
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: todayDate },
  });

  const accessToken = jwtHelpers.generateToken(
    { id: user.id, role: user.role },
    config.jwt.jwt_secret as string,
    config.jwt.expires_in as string,
  );

  return {
    id: user.id,
    role: user.role,
    accessToken,
    isSetupCompleted: user.isSetupCompleted,
    isBrandProfileCompleted: user.businesses.length > 0 ? true : false,
  };
};

const sendForgotPasswordOtpDB = async (email: string) => {
  const existringUser = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
  if (!existringUser) {
    throw new ApiError(404, "User not found");
  }
  const otp = generateOTP();

  await prisma.otp.upsert({
    where: { email },
    update: { otp, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
    create: { email, otp, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
  });

  const emailSubject = "Your Password Reset OTP";
  const emailHtml = `<div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Password Reset Request</h2>
        <p>Hi <b>${existringUser.fullName}</b>,</p>
        <p>Your OTP for password reset is:</p>
        <h1 style="color: #007BFF;">${otp}</h1>
        <p>This OTP is valid for <b>5 minutes</b>. If you did not request this, please ignore this email.</p>
        <p>Thanks, <br>The Support Team</p>
      </div>`;

  await sendEmail(email, emailSubject, emailHtml);

  return otp;
};

const formInfo = async (payload: any) => {
  const emailSubject = "New Form Submission";
  const emailHtml = formHtml(payload);

  await sendFormInfo("info@uenal-immobilien.de", emailSubject, emailHtml);
};

const verifyForgotPasswordOtpCodeDB = async (payload: {
  email: string;
  otp: string;
}) => {
  const { email, otp } = payload;

  const user = await prisma.user.findUnique({ where: { email: email } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const userId = user.id;

  const savedOtpRecord = await prisma.otp.findUnique({ where: { email } });
  if (!savedOtpRecord) {
    throw new ApiError(400, "OTP not found. Please request a new one.");
  }
  if (new Date() > savedOtpRecord.expiresAt) {
    await prisma.otp.delete({ where: { email } });
    throw new ApiError(400, "OTP has expired. Please request a new one.");
  }

  if (otp !== savedOtpRecord.otp) {
    throw new ApiError(401, "Invalid OTP.");
  }

  const forgetToken = jwtHelpers.generateToken(
    { id: userId },
    config.jwt.jwt_secret as string,
    config.jwt.expires_in as string,
  );

  return { forgetToken };
};

const resetForgotPasswordDB = async (newPassword: string, userId: string) => {
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) {
    throw new ApiError(404, "user not found");
  }
  const email = existingUser.email as string;
  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.jwt.gen_salt),
  );

  await prisma.user.update({
    where: {
      email: email,
    },
    data: {
      password: hashedPassword,
    },
  });
  return;
};

const myProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      gender: true,
      role: true,
      address: true,
      phoneNumber: true,
      profileImage: true,
      email: true,
      referralCode: true,
      wallet: true,
      points: true,
      _count: {
        select: {
          referrer: true,
        },
      },
      businesses: {
        select: {
          id: true,
          businessName: true,
          NIDFront: true,
          NIDBack: true,
          tradeLicense: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });
  if (!user) throw new ApiError(404, "User not found!");

  const buyerProfileCompleted =
    user.gender && user.address && user.profileImage ? true : false;

  const brandProfileCompleted =
    user.businesses && user.gender && user.profileImage ? true : false;

  const isPickUpaddressExists = await prisma.deliveryAddress.findFirst({
    where: {
      userId: userId,
      isCampusAddress: true,
    },
  });

  const returnUser = {
    ...user,
    isSetupCompleted: buyerProfileCompleted,
    isBrandProfileCompleted: brandProfileCompleted,
    isPickUpaddressExists: isPickUpaddressExists ? true : false,
  };

  return returnUser;
};

const updateProfileIntoDB = async (req: Request) => {
  const userId = req.user.id;
  const payload = req.body;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });

  const business = await prisma.business.findFirst({
    where: { ownerId: userId },
  });

  const processImages = async (
    files: Express.Multer.File[],
    folder: string,
  ) => {
    if (!files || files.length === 0) return null;
    return Promise.all(
      files.map((file) => uploadInSpace(file, `posts/${folder}`)),
    );
  };

  const [tradeLicense, NIDBack, NIDFront, profileImage] = await Promise.all([
    processImages(files?.tradeLicense, "tradeLicense"),
    processImages(files?.NIDBack, "NIDBack"),
    processImages(files?.NIDFront, "NIDFront"),
    processImages(files?.profileImage, "profileImage"),
  ]);

  await prisma.user.update({
    where: { id: userId },
    data: {
      profileImage: profileImage ? profileImage[0] : user.profileImage,
      fullName: payload.fullName ? payload.fullName : user.fullName,
      gender: payload.gender ? payload.gender : user.gender,
      address: payload.address ? payload.address : user.address,
    },
  });

  if (business) {
    await prisma.business.update({
      where: { id: business.id },
      data: {
        tradeLicense: tradeLicense ? tradeLicense[0] : business.tradeLicense,
        NIDBack: NIDBack ? NIDBack[0] : business.NIDBack,
        NIDFront: NIDFront ? NIDFront[0] : business.NIDFront,
        businessName: payload.businessName
          ? payload.businessName
          : business.businessName,
      },
    });
  }

  return;
};

const changePassword = async (
  userId: string,
  payload: { oldPassword: string; newPassword: string },
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");

  const isPasswordValid = await bcrypt.compare(
    payload.oldPassword,
    user.password,
  );

  if (!isPasswordValid) throw new ApiError(401, "Wrong old password");

  const hashedPassword = await bcrypt.hash(
    payload.newPassword,
    Number(config.jwt.gen_salt),
  );

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      password: hashedPassword,
    },
  });
  return;
};

const deleteAccount = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");

  await prisma.user.delete({
    where: {
      id: userId,
    },
  });
  return;
};

export const authService = {
  loginWithEmail,
  loginWithPhone,
  myProfile,
  updateProfileIntoDB,
  sendForgotPasswordOtpDB,
  verifyForgotPasswordOtpCodeDB,
  resetForgotPasswordDB,
  changePassword,
  deleteAccount,
  formInfo,
};
