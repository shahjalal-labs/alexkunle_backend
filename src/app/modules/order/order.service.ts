import ApiError from "../../../errors/ApiErrors";
import {
  generateOrderId,
  generateTrackingId,
} from "../../../helpers/generateOtp";
import {
  createStripePaymentIntent,
  createStripeRefund,
} from "../../../helpers/stripe.helper";
import prisma from "../../../shared/prisma";
import { sendSingleNotification } from "../notifications/notification.services";

type OrderItemInput = {
  productId: string;
  variantId: string;
  quantity: number;
};

type CreateOrderInput = {
  shippingAddressId?: string;
  isUsingWallet?: boolean;
  paymentMethodId?: string;
  items?: OrderItemInput[];
};

const toNumber = (value: unknown) => {
  const parsedValue = Number(value);
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
};

const createNewOrderInDB = async (
  userId: string,
  orderData: CreateOrderInput,
) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
  });

  const rawCartIds = (orderData as any).cartIds;
  const cartIds = Array.isArray(rawCartIds)
    ? Array.from(new Set(rawCartIds.filter(Boolean)))
    : [];
  const isUsingWallet = orderData.isUsingWallet;

  if (cartIds.length === 0) {
    throw new ApiError(400, "cart Ids must contain at least one cart id");
  }

  const carts = await prisma.cart.findMany({
    where: {
      userId,
      id: {
        in: cartIds,
      },
    },
    select: {
      id: true,
      quantity: true,
      product: {
        select: {
          id: true,
          price: true,
          totalStock: true,
          variants: {
            select: {
              id: true,
              stock: true,
            },
          },
        },
      },
    },
  });

  if (carts.length !== cartIds.length) {
    throw new ApiError(
      400,
      "Some cart ids are invalid or do not belong to this user",
    );
  }

  // await prisma.deliveryAddress.findFirst({
  //   where: {
  //     id: orderData.shippingAddressId,
  //     userId: user.id,
  //   },
  // });

  const productIds = carts.map((cart) => cart.product.id);

  const product = await prisma.product.findUniqueOrThrow({
    where: {
      id: productIds[0],
    },
  });

  const pickupAddress = await prisma.deliveryAddress.findFirst({
    where: {
      userId: product.userId,
      isCampusAddress: true,
    },
  });

  if (!pickupAddress && !orderData.shippingAddressId) {
    throw new ApiError(400, "This brand does not have a pickup address. Please contact the brand");
  }

  const shippingAddressId = orderData.shippingAddressId ?? pickupAddress!.id;

  const normalizedItems = carts.map((cart) => {
    const quantity = toNumber(cart.quantity);
    if (quantity <= 0) {
      throw new ApiError(400, "Item quantity must be greater than 0");
    }

    const firstVariant = cart.product.variants[0];
    if (!firstVariant) {
      throw new ApiError(400, "Product has no variant available");
    }

    if (quantity > firstVariant.stock || quantity > cart.product.totalStock) {
      throw new ApiError(400, "Requested quantity exceeds available stock");
    }

    const subtotal = cart.product.price * quantity;

    return {
      cartId: cart.id,
      productId: cart.product.id,
      variantId: firstVariant.id,
      quantity,
      subtotal,
    };
  });

  const totalAmount = normalizedItems.reduce(
    (total, item) => total + toNumber(item.subtotal),
    0,
  );

  if (totalAmount <= 0) {
    throw new ApiError(400, "Total amount must be greater than 0");
  }

  let stripePaymentIntentId: string | null = null;
  let paymentMethodId: string | null = null;
  let createdOrderCreatedAt: Date | null = null;
  let createdOrderItems: any[] = [];

  if (!isUsingWallet) {
    if (!orderData.paymentMethodId) {
      throw new ApiError(
        400,
        "Payment method is required when wallet is not used",
      );
    }

    const paymentIntent = await createStripePaymentIntent(
      user.id,
      orderData.paymentMethodId,
      totalAmount,
    );

    if (paymentIntent.status !== "succeeded") {
      throw new ApiError(400, "Payment failed. Please try again.");
    }

    stripePaymentIntentId = paymentIntent.id;
    paymentMethodId = orderData.paymentMethodId;
  }

  await prisma.$transaction(async (tx) => {
    if (isUsingWallet) {
      const walletUser = await tx.user.findUniqueOrThrow({
        where: {
          id: user.id,
        },
      });

      if (walletUser.wallet < totalAmount) {
        throw new ApiError(400, "Insufficient funds in wallet");
      }

      await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          wallet: { decrement: totalAmount },
        },
      });
    }

    const newOrder = await tx.order.create({
      data: {
        buyerId: user.id,
        totalAmount,
        status: "Active",
        stripePaymentIntentId,
        orderId: generateOrderId(),
        paymentMethodId,
        shippingAddressId: shippingAddressId,
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    createdOrderCreatedAt = newOrder.createdAt;

    await tx.orderItem.createMany({
      data: normalizedItems.map((item) => ({
        orderId: newOrder.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        subtotal: item.subtotal,
        trackingId: generateTrackingId(),
      })),
    });

    createdOrderItems = await tx.orderItem.findMany({
      where: {
        orderId: newOrder.id,
      },
      select: {
        id: true,
        trackingId: true,
        quantity: true,
        subtotal: true,
        status: true,
        createdAt: true,
        product: {
          select: {
            productName: true,
            productImages: true,
            category: {
              select: {
                categoryName: true,
              },
            },
          },
        },
        variant: {
          select: {
            color: true,
            size: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    await Promise.all(
      normalizedItems.map(async (item) => {
        const updatedVariant = await tx.variant.updateMany({
          where: {
            id: item.variantId,
            stock: {
              gte: item.quantity,
            },
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        if (updatedVariant.count === 0) {
          throw new ApiError(
            400,
            "Stock changed. Please place the order again",
          );
        }

        const updatedProduct = await tx.product.updateMany({
          where: {
            id: item.productId,
            totalStock: {
              gte: item.quantity,
            },
          },
          data: {
            totalStock: {
              decrement: item.quantity,
            },
          },
        });

        if (updatedProduct.count === 0) {
          throw new ApiError(
            400,
            "Product stock changed. Please place the order again",
          );
        }
      }),
    );

    await tx.cart.deleteMany({
      where: {
        userId,
        id: {
          in: normalizedItems.map((item) => item.cartId),
        },
      },
    });
  });

  return {
    orderItem: createdOrderItems,
    totalAmount,
    transactionId: isUsingWallet ? "From Wallet" : stripePaymentIntentId,
    createdAt: createdOrderCreatedAt,
  };
};

// const createNewOrderInDB = async (
//   userId: string,
//   orderData: CreateOrderInput,
// ) => {
//   const user = await prisma.user.findUniqueOrThrow({
//     where: {
//       id: userId,
//     },
//   });

//   const rawCartIds = (orderData as any).cartIds;
//   const cartIds = Array.isArray(rawCartIds)
//     ? Array.from(new Set(rawCartIds.filter(Boolean)))
//     : [];
//   const isUsingWallet = orderData.isUsingWallet;

//   if (cartIds.length === 0) {
//     throw new ApiError(400, "cart Ids must contain at least one cart id");
//   }

//   await prisma.deliveryAddress.findFirstOrThrow({
//     where: {
//       id: orderData.shippingAddressId,
//       userId: user.id,
//     },
//   });

//   const carts = await prisma.cart.findMany({
//     where: {
//       userId,
//       id: {
//         in: cartIds,
//       },
//     },
//     select: {
//       id: true,
//       quantity: true,
//       product: {
//         select: {
//           id: true,
//           price: true,
//           totalStock: true,
//           variants: {
//             select: {
//               id: true,
//               stock: true,
//             },
//           },
//         },
//       },
//     },
//   });

//   if (carts.length !== cartIds.length) {
//     throw new ApiError(
//       400,
//       "Some cart ids are invalid or do not belong to this user",
//     );
//   }

//   const normalizedItems = carts.map((cart) => {
//     const quantity = toNumber(cart.quantity);
//     if (quantity <= 0) {
//       throw new ApiError(400, "Item quantity must be greater than 0");
//     }

//     const firstVariant = cart.product.variants[0];
//     if (!firstVariant) {
//       throw new ApiError(400, "Product has no variant available");
//     }

//     if (quantity > firstVariant.stock || quantity > cart.product.totalStock) {
//       throw new ApiError(400, "Requested quantity exceeds available stock");
//     }

//     const subtotal = cart.product.price * quantity;

//     return {
//       cartId: cart.id,
//       productId: cart.product.id,
//       variantId: firstVariant.id,
//       quantity,
//       subtotal,
//     };
//   });

//   const totalAmount = normalizedItems.reduce(
//     (total, item) => total + toNumber(item.subtotal),
//     0,
//   );

//   if (totalAmount <= 0) {
//     throw new ApiError(400, "Total amount must be greater than 0");
//   }

//   let stripePaymentIntentId: string | null = null;
//   let paymentMethodId: string | null = null;

//   if (!isUsingWallet) {
//     if (!orderData.paymentMethodId) {
//       throw new ApiError(
//         400,
//         "Payment method is required when wallet is not used",
//       );
//     }

//     const paymentIntent = await createStripePaymentIntent(
//       user.id,
//       orderData.paymentMethodId,
//       totalAmount,
//     );

//     if (paymentIntent.status !== "succeeded") {
//       throw new ApiError(400, "Payment failed. Please try again.");
//     }

//     stripePaymentIntentId = paymentIntent.id;
//     paymentMethodId = orderData.paymentMethodId;
//   }

//   await prisma.$transaction(async (tx) => {
//     if (isUsingWallet) {
//       const walletUser = await tx.user.findUniqueOrThrow({
//         where: {
//           id: user.id,
//         },
//       });

//       if (walletUser.wallet < totalAmount) {
//         throw new ApiError(400, "Insufficient funds in wallet");
//       }

//       await tx.user.update({
//         where: {
//           id: user.id,
//         },
//         data: {
//           wallet: { decrement: totalAmount },
//         },
//       });

//       await tx.transaction.create({
//         data: {
//           userId: user.id,
//           transactionType: "Purchase",
//           amount: totalAmount,
//           title: "Order Payment (Wallet)",
//           status: "Active",
//         },
//       });
//     }

//     const newOrder = await tx.order.create({
//       data: {
//         buyerId: user.id,
//         totalAmount,
//         status: "Active",
//         stripePaymentIntentId,
//         orderId: generateOrderId(),
//         paymentMethodId,
//         shippingAddressId: orderData.shippingAddressId,
//       },
//     });

//     await tx.orderItem.createMany({
//       data: normalizedItems.map((item) => ({
//         orderId: newOrder.id,
//         productId: item.productId,
//         variantId: item.variantId,
//         quantity: item.quantity,
//         subtotal: item.subtotal,
//         trackingId: generateTrackingId(),
//       })),
//     });

//     await Promise.all(
//       normalizedItems.map(async (item) => {
//         const updatedVariant = await tx.variant.updateMany({
//           where: {
//             id: item.variantId,
//             stock: {
//               gte: item.quantity,
//             },
//           },
//           data: {
//             stock: {
//               decrement: item.quantity,
//             },
//           },
//         });

//         if (updatedVariant.count === 0) {
//           throw new ApiError(
//             400,
//             "Stock changed. Please place the order again",
//           );
//         }

//         const updatedProduct = await tx.product.updateMany({
//           where: {
//             id: item.productId,
//             totalStock: {
//               gte: item.quantity,
//             },
//           },
//           data: {
//             totalStock: {
//               decrement: item.quantity,
//             },
//           },
//         });

//         if (updatedProduct.count === 0) {
//           throw new ApiError(
//             400,
//             "Product stock changed. Please place the order again",
//           );
//         }
//       }),
//     );

//     await tx.cart.deleteMany({
//       where: {
//         userId,
//         id: {
//           in: normalizedItems.map((item) => item.cartId),
//         },
//       },
//     });

//     return;
//   });

//   return;
// };

const createDirectOrderWithoutCart = async (userId: string, payload: any) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
  });

  if (user.referralCode == payload.referralCode) {
    throw new ApiError(400, "You cannot use your own referral code");
  }

  const product = await prisma.product.findUniqueOrThrow({
    where: {
      id: payload.productId,
    },
    include: {
      variants: true,
    },
  });

  const pickupAddress = await prisma.deliveryAddress.findFirst({
    where: {
      userId: product.userId,
      isCampusAddress: true,
    },
  });

  // await prisma.deliveryAddress.findFirstOrThrow({
  //   where: {
  //     id: payload.shippingAddressId,
  //     userId: user.id,
  //   },
  // });

  if (payload.quantity <= 0) {
    throw new ApiError(400, "Item quantity must be greater than 0");
  }

  const quantity = toNumber(payload.quantity);
  const isUsingWallet = Boolean(payload.isUsingWallet);
  const selectedVariant = product.variants[0];

  if (!selectedVariant) {
    throw new ApiError(400, "Product has no variant available");
  }

  if (quantity > selectedVariant.stock || quantity > product.totalStock) {
    throw new ApiError(400, "Requested quantity exceeds available stock");
  }

  const totalAmount = toNumber(product.price) * quantity;
  if (totalAmount <= 0) {
    throw new ApiError(400, "Total amount must be greater than 0");
  }

  let stripePaymentIntentId: string | null = null;
  let paymentMethodId: string | null = null;

  if (!isUsingWallet) {
    if (!payload.paymentMethodId) {
      throw new ApiError(
        400,
        "Payment method is required when wallet is not used",
      );
    }

    const paymentIntent = await createStripePaymentIntent(
      user.id,
      payload.paymentMethodId,
      totalAmount,
    );

    if (paymentIntent.status !== "succeeded") {
      throw new ApiError(400, "Payment failed. Please try again.");
    }

    stripePaymentIntentId = paymentIntent.id;
    paymentMethodId = payload.paymentMethodId;
  }

  await prisma.$transaction(async (tx) => {
    if (isUsingWallet) {
      const walletUser = await tx.user.findUniqueOrThrow({
        where: {
          id: user.id,
        },
      });

      if (walletUser.wallet < totalAmount) {
        throw new ApiError(400, "Insufficient funds in wallet");
      }

      await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          wallet: { decrement: totalAmount },
        },
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          transactionType: "Purchase",
          amount: totalAmount,
          title: "Order Payment (Wallet)",
          status: "Active",
        },
      });
    }

    const newOrder = await tx.order.create({
      data: {
        buyerId: user.id,
        totalAmount,
        status: "Active",
        stripePaymentIntentId,
        orderId: generateOrderId(),
        paymentMethodId,
        shippingAddressId: payload.shippingAddressId
          ? payload.shippingAddressId
          : pickupAddress?.id,
      },
    });

    await tx.orderItem.create({
      data: {
        orderId: newOrder.id,
        productId: product.id,
        quantity,
        subtotal: totalAmount,
        variantId: selectedVariant.id,
        trackingId: generateTrackingId(),
      },
    });

    const updatedVariant = await tx.variant.updateMany({
      where: {
        id: selectedVariant.id,
        stock: {
          gte: quantity,
        },
      },
      data: {
        stock: {
          decrement: quantity,
        },
      },
    });

    if (updatedVariant.count === 0) {
      throw new ApiError(400, "Stock changed. Please place the order again");
    }

    const updatedProduct = await tx.product.updateMany({
      where: {
        id: product.id,
        totalStock: {
          gte: quantity,
        },
      },
      data: {
        totalStock: {
          decrement: quantity,
        },
      },
    });

    if (updatedProduct.count === 0) {
      throw new ApiError(
        400,
        "Product stock changed. Please place the order again",
      );
    }
  });

  return;
};

const getBrandWiseOrderItems = async (userId: string) => {
  const orderItems = await prisma.orderItem.findMany({
    where: {
      product: {
        userId,
      },
    },
    select: {
      id: true,
      trackingId: true,
      quantity: true,
      status: true,
      product: {
        select: {
          productImages: true,
          productName: true,
          price: true,
          user: {
            select: {
              fullName: true,
            },
          },
        },
      },
      order: {
        select: {
          orderId: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return orderItems;
};

const acceptOrderInDB = async (itemId: string) => {
  const orderItem = await prisma.orderItem.findUnique({
    where: {
      id: itemId,
    },
    include: {
      product: {
        select: {
          productName: true,
        },
      },
    },
  });

  const order = await prisma.order.findUnique({
    where: {
      id: orderItem?.orderId,
    },
  });

  if (orderItem?.status !== "Pending") {
    throw new ApiError(400, "Only pending orders can be accepted");
  }

  await prisma.orderItem.update({
    where: {
      id: itemId,
    },
    data: {
      status: "Active",
    },
  });

  try {
    await sendSingleNotification(
      order?.buyerId as string,
      `Your order for ${orderItem.quantity} x ${orderItem.product.productName} has been accepted by the seller. It will soon be marked as delivered once the seller confirms delivery.`,
      orderItem.productId,
      "Order Accepted",
      "Order",
    );
  } catch (notificationError) {
    console.error("Notification failed:", notificationError);
  }

  return;
};

const rejectOrderInDB = async (itemId: string) => {
  const orderItem = await prisma.orderItem.findUnique({
    where: {
      id: itemId,
    },
  });

  if (orderItem?.status !== "Pending") {
    throw new ApiError(400, "Only pending orders can be rejected");
  }

  const order = await prisma.order.findUnique({
    where: {
      id: orderItem.orderId,
    },
  });

  const remainingItemCount = await prisma.orderItem.count({
    where: {
      orderId: order?.id,
      status: { in: ["Pending", "Active"] },
      id: {
        not: itemId,
      },
    },
  });

  if (order?.stripePaymentIntentId) {
    const response = await createStripeRefund(
      order.stripePaymentIntentId,
      orderItem.subtotal,
    );

    if (response.status !== "succeeded") {
      throw new ApiError(400, "Refund failed. Please contact support.");
    }

    await prisma.orderItem.update({
      where: {
        id: itemId,
      },
      data: {
        status: "Cancelled",
      },
    });

    if (remainingItemCount === 0) {
      await prisma.order.update({
        where: {
          id: order?.id,
        },
        data: {
          status: "Cancelled",
        },
      });
    }

    return;
  }

  if (!order?.stripePaymentIntentId) {
    await prisma.user.update({
      where: {
        id: order?.buyerId,
      },
      data: { wallet: { increment: orderItem.subtotal } },
    });

    await prisma.orderItem.update({
      where: {
        id: itemId,
      },
      data: {
        status: "Cancelled",
      },
    });

    if (remainingItemCount === 0) {
      await prisma.order.update({
        where: {
          id: order?.id,
        },
        data: {
          status: "Cancelled",
        },
      });
    }

    return;
  }
};

const cancelOrderInDB = async (payload: any) => {
  const orderItem = await prisma.orderItem.findUnique({
    where: {
      id: payload.itemId,
    },
    include: {
      product: {
        select: {
          productName: true,
        },
      },
    },
  });

  if (orderItem?.status !== "Active") {
    throw new ApiError(400, "Only active orders can be cancelled");
  }

  const order = await prisma.order.findUnique({
    where: {
      id: orderItem.orderId,
    },
  });

  const remainingItemCount = await prisma.orderItem.count({
    where: {
      orderId: order?.id,
      status: { in: ["Pending", "Active"] },
      id: {
        not: payload.itemId,
      },
    },
  });

  if (order?.stripePaymentIntentId) {
    const response = await createStripeRefund(
      order.stripePaymentIntentId,
      orderItem.subtotal,
    );

    if (response.status !== "succeeded") {
      throw new ApiError(400, "Refund failed. Please contact support.");
    }

    await prisma.orderItem.update({
      where: {
        id: payload.itemId,
      },
      data: {
        status: "Cancelled",
        cancelReason: payload.reason,
      },
    });

    if (remainingItemCount === 0) {
      await prisma.order.update({
        where: {
          id: order?.id,
        },
        data: {
          status: "Cancelled",
        },
      });
    }

    try {
      await sendSingleNotification(
        order.buyerId,
        `You order for ${orderItem.quantity} x ${orderItem.product.productName} has been cancelled. Reason: ${payload.reason}. Order payment refund is being processed.`,
        orderItem.productId,
        "Order Cancelled",
        "Order",
      );
    } catch (notificationError) {
      console.error("Notification failed:", notificationError);
    }

    return;
  }

  if (!order?.stripePaymentIntentId) {
    await prisma.user.update({
      where: {
        id: order?.buyerId,
      },
      data: { wallet: { increment: orderItem.subtotal } },
    });

    await prisma.orderItem.update({
      where: {
        id: payload.itemId,
      },
      data: {
        status: "Cancelled",
        cancelReason: payload.reason,
      },
    });

    if (remainingItemCount === 0) {
      await prisma.order.update({
        where: {
          id: order?.id,
        },
        data: {
          status: "Cancelled",
        },
      });
    }

    try {
      await sendSingleNotification(
        order?.buyerId as string,
        `You order for ${orderItem.quantity} x ${orderItem.product.productName} has been cancelled. Reason: ${payload.reason}. Refund of ${orderItem.subtotal} to your wallet has been processed.`,
        orderItem.productId,
        "Order Cancelled",
        "Order",
      );
    } catch (notificationError) {
      console.error("Notification failed:", notificationError);
    }

    return;
  }
};

const deliverOrderInDB = async (itemId: string) => {
  const orderItem = await prisma.orderItem.findUnique({
    where: {
      id: itemId,
    },
  });

  if (orderItem?.status !== "Active") {
    throw new ApiError(400, "Only active orders can be marked as delivered");
  }

  const product = await prisma.product.findUnique({
    where: {
      id: orderItem.productId,
    },
  });

  await prisma.orderItem.update({
    where: {
      id: itemId,
    },
    data: {
      status: "Delivered",
    },
  });

  await prisma.user.update({
    where: { id: product?.userId },
    data: {
      wallet: { increment: orderItem.subtotal },
    },
  });

  return;
};

const getBuyerWiseOrderItems = async (userId: string) => {
  const orderItems = await prisma.order.findMany({
    where: {
      buyerId: userId,
    },
    select: {
      orderId: true,
      items: {
        select: {
          id: true,
          trackingId: true,
          subtotal: true,
          status: true,
          createdAt: true,
          isReviewed: true,
          quantity: true,
          product: {
            select: {
              productName: true,
              productImages: true,
              user: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return orderItems;
};

const getOrderDetails = async (itemId: string) => {
  const orderItem = await prisma.orderItem.findUnique({
    where: { id: itemId },
    select: {
      id: true,
      trackingId: true,
      quantity: true,
      subtotal: true,
      status: true,
      isReviewed: true,
      createdAt: true,
      order: {
        select: {
          orderId: true,
          deliveryAddress: {
            select: {
              city: true,
              street: true,
              houseNo: true,
              country: true,
              postCode: true,
            },
          },
        },
      },
      product: {
        select: {
          productName: true,
          productImages: true,
          category: {
            select: {
              categoryName: true,
            },
          },
          user: {
            select: {
              id: true,
            },
          },
          variants: {
            select: {
              color: true,
              size: true,
            },
          },
        },
      },
    },
  });

  return orderItem;
};

const createReviewForOrderItem = async (userId: string, payload: any) => {
  const orderItem = await prisma.orderItem.findUnique({
    where: {
      id: payload.itemId,
    },
  });

  if (!orderItem) {
    throw new ApiError(404, "Order item not found");
  }

  if (orderItem.status !== "Delivered") {
    throw new ApiError(400, "Only delivered items can be reviewed");
  }

  if (orderItem.isReviewed) {
    throw new ApiError(400, "Order item has already been reviewed");
  }

  await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: {
        id: orderItem.productId,
      },
      select: {
        rating: true,
        reviews: true,
      },
    });

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    const currentReviews = toNumber(product.reviews);
    const currentRating = toNumber(product.rating);
    const newRatingValue = toNumber(payload.rating);
    const updatedReviews = currentReviews + 1;
    const updatedAverageRating =
      (currentRating * currentReviews + newRatingValue) / updatedReviews;

    await tx.review.create({
      data: {
        userId,
        productId: orderItem.productId,
        rating: newRatingValue,
        comment: payload.comment,
      },
    });

    await tx.orderItem.update({
      where: {
        id: payload.itemId,
      },
      data: {
        isReviewed: true,
      },
    });

    await tx.product.update({
      where: {
        id: orderItem.productId,
      },
      data: {
        rating: updatedAverageRating,
        reviews: updatedReviews,
      },
    });
  });
};

export const orderService = {
  createNewOrderInDB,
  getBrandWiseOrderItems,
  acceptOrderInDB,
  rejectOrderInDB,
  cancelOrderInDB,
  deliverOrderInDB,
  createDirectOrderWithoutCart,
  getBuyerWiseOrderItems,
  getOrderDetails,
  createReviewForOrderItem,
};
