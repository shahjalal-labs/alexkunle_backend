import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { walletService } from "./wallet.service";

const addFunds = catchAsync(async (req, res) => {
  const { amount, paymentMethodId } = req.body;
  await walletService.addFundsToWallet(req.user.id, amount, paymentMethodId);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Funds added to wallet successfully",
  });
});
const withdrawFunds = catchAsync(async (req, res) => {
  const { amount } = req.body;
  const result = await walletService.withdrawFundsFromWallet(
    amount,
    req.user.id,
  );
  sendResponse(res, {
    success: result.status,
    statusCode: 201,
    message: result.message,
    data: result.link,
  });
});
const getWalletBalance = catchAsync(async (req, res) => {
  const result = await walletService.getMyWallet(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Wallet balance retrieved successfully",
    data: result,
  });
});
const allTransactions = catchAsync(async (req, res) => {
  const result = await walletService.getAllTransactions(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All transactions retrieved successfully",
    data: result,
  });
});
const transferFund = catchAsync(async (req, res) => {
  const { payeeId, amount } = req.body;
  await walletService.transferFund(req.user.id, payeeId, amount);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Funds transferred successfully",
  });
});
const allUsers = catchAsync(async (req, res) => {
  const result = await walletService.getAllUsersFromDB(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All users retrieved successfully",
    data: result,
  });
});

export const walletController = {
  addFunds,
  withdrawFunds,
  getWalletBalance,
  allTransactions,
  transferFund,
  allUsers,
};
