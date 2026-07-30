import { DeliveryAddress } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";

const createNewDeliveryAddress = async (
  userId: string,
  payload: DeliveryAddress,
) => {
  await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
  });

  if (payload.toNeighbor === true && !payload.neighborName) {
    throw new ApiError(
      400,
      "Neighbor name is required when to neighbor is true",
    );
  }

  await prisma.deliveryAddress.create({
    data: {
      userId,
      city: payload.city,
      country: payload.country,
      postCode: payload.postCode,
      street: payload.street,
      fullName: payload.fullName,
      houseNo: payload.houseNo,
      phoneNumber: payload.phoneNumber,
      toNeighbor: payload.toNeighbor,
      neighborName: payload.neighborName,
      neighborPhone: payload.neighborPhone,
      neighborHouse: payload.neighborHouse,
    },
  });

  return;
};

const getUserDeliveryAddresses = async (userId: string) => {
  await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
      role: "Buyer",
    },
  });

  const address = await prisma.deliveryAddress.findMany({
    where: {
      userId,
      isCampusAddress: false,
    },
    select: {
      id: true,
      fullName: true,
      houseNo: true,
      street: true,
      city: true,
      country: true,
      phoneNumber: true,
    },
  });

  return address;
};

const createCampusAddress = async (
  userId: string,
  payload: DeliveryAddress,
) => {
  await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
  });

  await prisma.deliveryAddress.create({
    data: {
      userId,
      city: payload.city,
      country: payload.country,
      postCode: payload.postCode,
      street: payload.street,
      fullName: payload.fullName,
      houseNo: payload.houseNo,
      phoneNumber: payload.phoneNumber,
      toNeighbor: false,
      isCampusAddress: true,
    },
  });

  return;
};

const getBrandPickupAddress = async (userId: string) => {
  await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
      role: "Brand",
    },
  });

  const address = await prisma.deliveryAddress.findMany({
    where: {
      userId,
      isCampusAddress: true,
    },
    select: {
      id: true,
      fullName: true,
      houseNo: true,
      street: true,
      city: true,
      country: true,
      phoneNumber: true,
    },
  });

  return address;
};

const updatePickupAddress = async (payload: any) => {
  const address = await prisma.deliveryAddress.findUnique({
    where: {
      id: payload.addressId,
      isCampusAddress: true,
    },
  });

  if (!address) {
    throw new ApiError(404, "Pickup address not found");
  }

  await prisma.deliveryAddress.update({
    where: {
      id: payload.addressId,
    },
    data: {
      fullName: payload.fullName || address.fullName,
      houseNo: payload.houseNo || address.houseNo,
      street: payload.street || address.street,
      city: payload.city || address.city,
      country: payload.country || address.country,
      phoneNumber: payload.phoneNumber || address.phoneNumber,
    },
  });

  return;
};

export const addressService = {
  createNewDeliveryAddress,
  getUserDeliveryAddresses,
  createCampusAddress,
  getBrandPickupAddress,
  updatePickupAddress,
};
