import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";

const addProductToWishlist = async (userId: string, productId: string) => {
  await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
  });

  await prisma.product.findUniqueOrThrow({
    where: {
      id: productId,
    },
  });

  const myWishlist = await prisma.wishlist.findFirst({
    where: {
      userId,
      productId,
    },
  });

  if (myWishlist) {
    throw new ApiError(404, "This product is already in your wishlist");
  }

  await prisma.wishlist.create({
    data: {
      userId,
      productId,
    },
  });

  return;
};

const getMyWishlist = async (userId: string) => {
  const myWishlist = await prisma.wishlist.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      product: {
        select: {
          id: true,
          productName: true,
          productImages: true,
          rating: true,
          reviews: true,
          price: true,
          youthPrice: true,
          investIncrease: true,
          category: {
            select: {
              categoryName: true,
            },
          },
        },
      },
    },
  });

  return myWishlist;
};

const deleteProductFromWishlist = async (userId: string, productId: string) => {
  const myWishlist = await prisma.wishlist.findFirst({
    where: {
      userId,
      productId,
    },
    select: {
      id: true,
    },
  });

  if (!myWishlist) {
    throw new ApiError(404, "Product not found in wishlist");
  }

  await prisma.wishlist.delete({
    where: {
      id: myWishlist.id,
    },
  });

  return;
};

const addProductToCartInDB = async (userId: string, productId: string) => {
  await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
  });

  const product = await prisma.product.findUniqueOrThrow({
    where: {
      id: productId,
    },
    include: {
      category: {
        select: {
          categoryName: true,
        },
      },
      variants: true,
    },
  });

  if (product.totalStock === 0) {
    throw new ApiError(404, "This product is out of stock");
  }

  const myCart = await prisma.cart.findFirst({
    where: {
      userId,
      productId,
    },
  });

  if (myCart) {
    throw new ApiError(404, "This product is already in your cart");
  }

  const cart = await prisma.cart.create({
    data: {
      userId,
      productId,
    },
  });

  await prisma.wishlist.deleteMany({
    where: {
      userId,
      productId,
    },
  });

  return {
    cart,
    product,
  };
};

const getBuyerWiseCartFromDB = async (userId: string) => {
  const myCart = await prisma.cart.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      quantity: true,
      product: {
        select: {
          id: true,
          productName: true,
          productImages: true,
          rating: true,
          reviews: true,
          price: true,
          youthPrice: true,
          variants: {
            select: {
              color: true,
              size: true,
            },
          },
          category: {
            select: {
              categoryName: true,
            },
          },
        },
      },
    },
  });

  return myCart;
};

const deleteProductFromCart = async (cartId: string) => {
  await prisma.cart.delete({
    where: {
      id: cartId,
    },
  });

  return;
};

const updateCartQuantity = async (cartId: string, isIncrease: boolean) => {
  const cartItem = await prisma.cart.findUniqueOrThrow({
    where: {
      id: cartId,
    },
  });

  const product = await prisma.product.findUniqueOrThrow({
    where: {
      id: cartItem.productId,
    },
  });

  if (isIncrease) {
    if (cartItem.quantity >= product.totalStock) {
      throw new ApiError(400, "Cannot increase quantity. Stock limit reached.");
    }

    await prisma.cart.update({
      where: {
        id: cartId,
      },
      data: {
        quantity: { increment: 1 },
      },
    });

    return;
  }

  if (cartItem.quantity <= 1) {
    throw new ApiError(400, "Cannot decrease quantity. Minimum quantity is 1.");
  }

  await prisma.cart.update({
    where: {
      id: cartId,
    },
    data: {
      quantity: { decrement: 1 },
    },
  });

  return;
};

export const shortlistService = {
  addProductToWishlist,
  getMyWishlist,
  deleteProductFromWishlist,
  addProductToCartInDB,
  getBuyerWiseCartFromDB,
  deleteProductFromCart,
  updateCartQuantity,
};
