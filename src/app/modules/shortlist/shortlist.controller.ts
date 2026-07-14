import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { shortlistService } from "./shortlist.service";

const addProductToWishlist = catchAsync(async (req, res) => {
  await shortlistService.addProductToWishlist(req.user.id, req.body.productId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Product added to wishlist successfully",
  });
});
const getMyWishlist = catchAsync(async (req, res) => {
  const wishlist = await shortlistService.getMyWishlist(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Wishlist retrieved successfully",
    data: wishlist,
  });
});
const deleteProductFromWishlist = catchAsync(async (req, res) => {
  await shortlistService.deleteProductFromWishlist(req.user.id, req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Product removed from wishlist successfully",
  });
});
const addProductToCart = catchAsync(async (req, res) => {
  const result =await shortlistService.addProductToCartInDB(req.user.id, req.body.productId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Product added to cart successfully",
    data: result
  });
});

const getMyCart = catchAsync(async (req, res) => {
  const cart = await shortlistService.getBuyerWiseCartFromDB(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Cart retrieved successfully",
    data: cart,
  });
});

const deleteProductFromCart = catchAsync(async (req, res) => {
  await shortlistService.deleteProductFromCart(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Product removed from cart successfully",
  });
});
const updateCartQuantity = catchAsync(async (req, res) => {
  const { cartId, isIncrease } = req.body;
  await shortlistService.updateCartQuantity(cartId, isIncrease);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Cart quantity updated successfully",
  });
});

export const shortlistController = {
  addProductToWishlist,
  getMyWishlist,
  deleteProductFromWishlist,
  addProductToCart,
  getMyCart,
  deleteProductFromCart,
  updateCartQuantity,
};
