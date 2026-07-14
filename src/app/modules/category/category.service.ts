import { Category } from "@prisma/client";
import prisma from "../../../shared/prisma";
import { uploadInSpace } from "../../../helpers/uploadInSpace";

const createCategory = async (data: Category, file: Express.Multer.File) => {
  let thumbnail;
  if (file) {
    thumbnail = await uploadInSpace(file, "category-thumbnails");
  }
  await prisma.category.create({
    data: {
      ...data,
      thumbnail: thumbnail || "",
    },
  });
  return;
};

const getAllCategorys = async () => {
  const results = await prisma.category.findMany();
  return results;
};

const getCategoryById = async (id: string) => {
  const result = await prisma.category.findUnique({ where: { id } });
  return result;
};

const updateCategory = async (id: string, data: any) => {
  await prisma.category.update({ where: { id }, data });
  return;
};

const deleteCategory = async (id: string) => {
  await prisma.category.delete({ where: { id } });
  return;
};

const allCategoryWithTotalProduct = async () => {
  const results = await prisma.category.findMany({
    select: {
      id: true,
      categoryName: true,
      thumbnail: true,
      _count: {
        select: { products: true },
      },
    },
  });

  return results;
};

export const categoryServices = {
  createCategory,
  getAllCategorys,
  getCategoryById,
  updateCategory,
  deleteCategory,
  allCategoryWithTotalProduct,
};
