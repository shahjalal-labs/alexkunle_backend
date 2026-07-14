import ApiError from "../../../errors/ApiErrors";
import {
  checkStripeAccountStatus,
  createStripePaymentIntent,
  transferMoneyToConnectedWorker,
} from "../../../helpers/stripe.helper";
import prisma from "../../../shared/prisma";

const addFundsToWallet = async (
  userId: string,
  amount: number,
  paymentMethodId: string,
) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
  });

  const paymentIntent = await createStripePaymentIntent(
    user.id,
    paymentMethodId,
    amount,
  );

  if (paymentIntent.status !== "succeeded") {
    throw new ApiError(400, "Payment failed");
  }

  await prisma.transaction.create({
    data: {
      userId,
      transactionType: "TopUp",
      amount,
      title: "Wallet Top-Up",
    },
  });

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      wallet: { increment: amount },
    },
  });
};

const withdrawFundsFromWallet = async (amount: number, userId: string) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
  });

  if (user.wallet < amount) {
    throw new ApiError(400, "Insufficient funds in wallet");
  }

  const response = await checkStripeAccountStatus(userId);

  if (response.status == false) {
    return {
      status: false,
      message:
        "Stripe account not connected. Please connect your Stripe account to withdraw funds.",
      link: response.link,
    };
  }

  const transfer = await transferMoneyToConnectedWorker(
    user.stripeAccountId as string,
    amount,
  );

  if (!transfer || transfer.reversed) {
    throw new ApiError(400, "Stripe transfer failed");
  }

  await prisma.withdraw.create({
    data: {
      userId,
      amount,
    },
  });

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      wallet: { decrement: amount },
    },
  });

  await prisma.transaction.create({
    data: {
      userId,
      transactionType: "Withdraw",
      amount,
      title: "Withdraw",
      status: "Active",
    },
  });

  return {
    status: true,
    message:
      "Withdrawal request successful. Funds will be transferred to your connected Stripe account shortly.",
  };
};

const getMyWallet = async (userId: string) => {
  const spentThisMonth = await prisma.transaction.aggregate({
    where: {
      userId,
      transactionType: "Purchase",
      createdAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    },
    _sum: {
      amount: true,
    },
  });
  const earnThisMonth = await prisma.orderItem.aggregate({
    where: {
      product: {
       userId
      },
      status: "Delivered",
    },
    _sum: { subtotal: true },
  });

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      wallet: true,
      canTransfer: true,
    },
  });

  return {
    walletBalance: user.wallet,
    spentThisMonth: spentThisMonth?._sum.amount || 0,
    earnThisMonth: earnThisMonth?._sum.subtotal || 0,
    resell: user.wallet * 40 / 100  ,
    autoPilot: user.wallet * 60 / 100,
    canTransfer: user.canTransfer,
  };
};

const getAllTransactions = async (userId: string) => {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
    },
    omit: {
      transactionImage: true,
      status: true,
      updatedAt: true,
      userId: true,
    },
  });

  return transactions;
};

const transferFund = async (
  payerId: string,
  payeeId: string,
  amount: number,
) => {
  if (payerId === payeeId) {
    throw new ApiError(400, "Cannot transfer funds to yourself");
  }

  const payer = await prisma.user.findUniqueOrThrow({
    where: {
      id: payerId,
    },
    select: {
      id: true,
      wallet: true,
      canTransfer: true,
    },
  });

  if (!payer.canTransfer) {
    throw new ApiError(403, "User is not allowed to transfer funds");
  }

  if (payer.wallet < amount) {
    throw new ApiError(400, "Insufficient funds in wallet");
  }
  await prisma.user.findUniqueOrThrow({
    where: {
      id: payeeId,
    },
  });

  await prisma.user.update({
    where: {
      id: payerId,
    },
    data: {
      wallet: { decrement: amount },
    },
  });

  await prisma.user.update({
    where: {
      id: payeeId,
    },
    data: {
      wallet: { increment: amount },
    },
  });

  return;
};

const getAllUsersFromDB = async (userId: string) => {
  const users = await prisma.user.findMany({
    where: {
      id: {
        not: userId,
      },
      role: {
        not: "Admin",
      },
    },
    select: {
      id: true,
      fullName: true,
      profileImage: true,
    },
  });

  return users;
};

export const walletService = {
  addFundsToWallet,
  withdrawFundsFromWallet,
  getMyWallet,
  getAllTransactions,
  transferFund,
  getAllUsersFromDB,
};
