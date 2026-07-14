import { Message } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import { uploadInSpace } from "../../../helpers/uploadInSpace";

export const createManyMessage = async (data: Message) => {
  await prisma.message.create({ data });
  return;
};

const generateUrls = async (files: { urls: Express.Multer.File[] }) => {
  const processedFiles = await Promise.all(
    files.urls.map(async (file) => {
      const url = await uploadInSpace(file, "messages");
      return { originalName: file.originalname, url };
    }),
  );
  return processedFiles;
};

const getAllMessages = async () => {
  const results = await prisma.message.findMany();
  return results;
};

const blockRoom = async (roomId: string, userId: string) => {
  const room = await prisma.chatRoom.findUnique({
    where: { id: roomId },
    select: { userIds: true },
  });

  if (!room) throw new ApiError(404, "Room not found");
  const roomMemberIds = room.userIds.split("|").filter(Boolean);
  if (!roomMemberIds.includes(userId)) {
    throw new ApiError(403, "Room not found or access denied");
  }

  await prisma.chatRoom.update({
    where: { id: roomId },
    data: { status: "Blocked" },
  });

  return;
};

const deleteRoom = async (roomId: string, userId: string) => {
  const room = await prisma.chatRoom.findUnique({
    where: { id: roomId },
    select: { userIds: true },
  });

  if (!room) {
    throw new ApiError(404, "Room not found");
  }

  const roomMemberIds = room.userIds.split("|").filter(Boolean);
  if (!roomMemberIds.includes(userId)) {
    throw new ApiError(403, "Room not found or access denied");
  }

  await prisma.chatRoom.delete({
    where: { id: roomId },
  });

  return;
};

export const messageServices = {
  createManyMessage,
  generateUrls,
  getAllMessages,
  blockRoom,
  deleteRoom,
};
