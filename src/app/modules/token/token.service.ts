import ApiError from "../../../errors/ApiErrors";
import {
  generateCoupon,
  getRandomRewardType,
  getRandomRewardValue,
} from "../../../helpers/generateOtp";
import { createStripePaymentIntent } from "../../../helpers/stripe.helper";
import prisma from "../../../shared/prisma";

const buyToken = async (userId: string, payload: any) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });

  const spinSetting = await prisma.spinSetting.findFirst({
    select: {
      perDollarToken: true,
    },
  });

  const paymentIntent = await createStripePaymentIntent(
    user.id,
    payload.paymentMethodId,
    payload.amount * 100,
  );

  if (paymentIntent.status !== "succeeded") {
    throw new ApiError(400, "Payment failed. Please try again.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.tokenTransaction.create({
      data: {
        userId,
        transactionType: "Purchase",
        amount: payload.amount,
        token: payload.amount * spinSetting?.perDollarToken!,
        title: `Bought tokens`,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        tokens: {
          increment: payload.amount * spinSetting?.perDollarToken!,
        },
      },
    });
  });

  return;
};

const getMyTokenHistory = async (userId: string) => {
  const availableToken = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      tokens: true,
    },
  });

  const tokenTransactions = await prisma.tokenTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return { availableToken, tokenTransactions };
};

const spinNow = async (userId: string) => {
  const rewardType = getRandomRewardType();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      tokens: true,
    },
  });

  // const spinSetting = await prisma.spinSetting.findFirst({});

  // if (user.tokens < spinSetting?.spinCost!) {
  //   throw new ApiError(400, "Not enough tokens to spin the wheel.");
  // }

  if (user.tokens < 10) {
    throw new ApiError(400, "Not enough tokens to spin the wheel.");
  }

  let coupon: string | undefined;
  let point: number | undefined;
  let token: number | undefined;

  if (rewardType === "coupon") {
    coupon = generateCoupon();
  }

  if (rewardType === "point") {
    point = getRandomRewardValue();
  }
  if (rewardType === "token") {
    token = getRandomRewardValue();
  }

  await prisma.$transaction(async (tx) => {
    await tx.tokenTransaction.create({
      data: {
        userId,
        transactionType: "Spin",
        amount: 0,
        token: 10,
        title: `Used for spin and win`,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: { tokens: { decrement: 10 } },
    });

    if (rewardType === "point") {
      await tx.user.update({
        where: { id: userId },
        data: { points: { increment: point } },
      });
    }

    if (rewardType === "token") {
      await tx.user.update({
        where: { id: userId },
        data: { tokens: { increment: token } },
      });
    }
  });

  return {
    rewardType,
    rewardValue:
      rewardType === "coupon" ? coupon : rewardType === "point" ? point : token,
  };
};

export const tokenService = {
  buyToken,
  getMyTokenHistory,
  spinNow,
};
