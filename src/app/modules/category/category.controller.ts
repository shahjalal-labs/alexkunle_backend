import { categoryServices } from "./category.service";
import sendResponse from "../../../shared/sendResponse";
import catchAsync from "../../../shared/catchAsync";

const createCategory = catchAsync(async (req, res) => {
  await categoryServices.createCategory(
    req.body,
    req.file as Express.Multer.File,
  );
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "The category has been created successfully",
  });
});

const getAllCategorys = catchAsync(async (req, res) => {
  const result = await categoryServices.getAllCategorys();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All categorys has been retrived successfully",
    data: result,
  });
});

const getCategoryById = catchAsync(async (req, res) => {
  const result = await categoryServices.getCategoryById(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "category has been retrived successfully",
    data: result,
  });
});

const updateCategory = catchAsync(async (req, res) => {
  await categoryServices.updateCategory(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "category has been updated successfully",
  });
});

const deleteCategory = catchAsync(async (req, res) => {
  await categoryServices.deleteCategory(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "category has been deleted successfully",
  });
});
const allCategoryWithTotalProduct = catchAsync(async (req, res) => {
  const results = await categoryServices.allCategoryWithTotalProduct();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Categories with total products retrieved successfully",
    data: results,
  });
});



export const categoryControllers = {
  createCategory,
  getAllCategorys,
  getCategoryById,
  updateCategory,
  deleteCategory,
  allCategoryWithTotalProduct
};
