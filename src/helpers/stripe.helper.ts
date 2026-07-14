import prisma from "../shared/prisma";
import Stripe from "stripe";
import config from "../config";

const stripe = new Stripe(config.stripe.stripe_secret as string);

const createCustomerStripeAccount = async (name: string, email: string) => {
  const account = await stripe.customers.create({
    email,
    name,
  });
  return account;
};

export const createStripePaymentIntent = async (
  userId: string,
  paymentMethodId: string,
  amount: number,
) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
  });

  let account = null;

  if (!user.stripeCustomerId) {
    account = await createCustomerStripeAccount(user.fullName, user.email);
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        stripeCustomerId: account.id,
      },
    });
  }

  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: user.stripeCustomerId || (account?.id as string),
  });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: "usd",
    customer: user.stripeCustomerId || (account?.id as string),
    payment_method: paymentMethodId,
    confirm: true,
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: "never",
    },
  });

  return paymentIntent;
};

export const createStripeRefund = async (
  paymentIntentId: string,
  amount: number,
) => {
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: Math.floor(amount * 100),
  });

  return refund;
};

export const checkStripeAccountStatus = async (userId: string) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });

  if (!user.stripeAccountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: user.email ?? undefined,
    });

    await prisma.user.update({
      where: { id: userId },
      data: { stripeAccountId: account.id },
    });

    const link = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: "https://yourdomain.com/reauth",
      return_url: "http://72.60.125.50:5003/account/connect/success",
      type: "account_onboarding",
    });

    return {
      status: false,
      link : link.url,
    };
  }

  const account = await stripe.accounts.retrieve(
    user.stripeAccountId as string,
  );
  if (!account.charges_enabled) {
    const link = await stripe.accountLinks.create({
      account: user.stripeAccountId as string,
      refresh_url: "https://yourdomain.com/reauth",
      return_url: "http://72.60.125.50:5003/account/connect/success",
      type: "account_onboarding",
    });

    return {
      status: false,
      link : link.url,
    };
  }

  return {
    status: true,
  };
};

export const transferMoneyToConnectedWorker = async (
  stripeAccountId: string,
  amount: number
) => {
  const transfer = await stripe.transfers.create({
    amount: Math.round(amount * 100),
    currency: "usd",
    destination: stripeAccountId,
  });

  return transfer;
};
