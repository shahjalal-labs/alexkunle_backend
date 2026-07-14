import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { stockService } from "./stock.service";

const createStock = catchAsync(async (req, res) => {
  await stockService.createStockInDB(req.user.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Product added to stock successfully",
  });
});
const createDirectStock = catchAsync(async (req, res) => {
  await stockService.createDirectStockWithoutCart(req.user.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Product added to stock successfully",
  });
});

const buyerWiseStocks = catchAsync(async (req, res) => {
  const stocks = await stockService.getUserWiseStocksFromDB(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Stocks retrieved successfully",
    data: stocks,
  });
});

const getStockDetails = catchAsync(async (req, res) => {
  const stock = await stockService.stockDetails(req.params.id, req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Stock details retrieved successfully",
    data: stock,
  });
});

export const stockController = {
  createStock,
  buyerWiseStocks,
  getStockDetails,
  createDirectStock,
};
