// import { WebSocket, WebSocketServer } from "ws";
// import { Request } from "express";
// import prisma from "../../../shared/prisma";
// import { verifyWebSocketToken } from "./socket.verifyToken";

// interface CustomWebSocket extends WebSocket {
//   userId?: string;
// }

// const roomUsers = new Map<string, Set<WebSocket>>();
// const connectedUsers = new Set<CustomWebSocket>();
// let wss: WebSocketServer | null = null;

// export function setupWebSocketServer(server: any) {
//   wss = new WebSocketServer({ server });

//   const getConnectedUserIds = () =>
//     new Set(
//       Array.from(connectedUsers)
//         .map((ws) => ws.userId)
//         .filter((id): id is string => Boolean(id)),
//     );

//   const getUserMap = async (memberIds: string[]) => {
//     if (memberIds.length === 0) return new Map<string, any>();
//     const users = await prisma.user.findMany({
//       where: { id: { in: memberIds } },
//       select: { id: true, fullName: true, profileImage: true },
//     });
//     return new Map(users.map((user) => [user.id, user]));
//   };

//   const createRoomKey = (firstUserId: string, secondUserId: string) =>
//     [firstUserId, secondUserId].sort().join("|");

//   const parseRoomMembers = (roomUserIds: string) =>
//     roomUserIds
//       .split("|")
//       .map((id) => id.trim())
//       .filter(Boolean);

//   const mapMessagesWithSender = async (
//     messages: Array<{
//       id: string;
//       content: string | null;
//       senderId: string;
//       roomId: string;
//       fileUrl: string[];
//       createdAt: Date;
//       updatedAt: Date;
//     }>,
//   ) => {
//     const senderIds = Array.from(new Set(messages.map((msg) => msg.senderId)));
//     const userMap = await getUserMap(senderIds);

//     return messages.map((msg) => ({
//       id: msg.id,
//       content: msg.content,
//       senderId: msg.senderId,
//       sender: userMap.get(msg.senderId)
//         ? {
//             id: userMap.get(msg.senderId).id,
//             fullName: userMap.get(msg.senderId).fullName,
//             profileImage: userMap.get(msg.senderId).profileImage,
//           }
//         : null,
//       roomId: msg.roomId,
//       fileUrl: msg.fileUrl,
//       createdAt: msg.createdAt.toISOString(),
//       updatedAt: msg.updatedAt.toISOString(),
//     }));
//   };

//   const buildConversations = async (targetUserId: string) => {
//     const rooms = await prisma.chatRoom.findMany({
//       where: {
//         userIds: { contains: targetUserId },
//       },
//       orderBy: { updatedAt: "desc" },
//     });

//     // Deduplicate rooms by ID in case of duplicate results
//     const uniqueRoomsMap = new Map<string, any>();
//     rooms.forEach((room) => {
//       if (!uniqueRoomsMap.has(room.id)) {
//         uniqueRoomsMap.set(room.id, room);
//       }
//     });
//     const uniqueRooms = Array.from(uniqueRoomsMap.values()).filter((room) =>
//       parseRoomMembers(room.userIds).includes(targetUserId),
//     );

//     const memberIds = Array.from(
//       new Set(uniqueRooms.flatMap((room) => parseRoomMembers(room.userIds))),
//     );
//     const userMap = await getUserMap(memberIds);
//     const connectedUserIds = getConnectedUserIds();

//     return Promise.all(
//       uniqueRooms.map(async (room) => {
//         const latestMsg = await prisma.message.findFirst({
//           where: { roomId: room.id },
//           orderBy: { createdAt: "desc" },
//           select: {
//             content: true,
//             fileUrl: true,
//             createdAt: true,
//             senderId: true,
//           },
//         });

//         const lastMessage = latestMsg
//           ? {
//               content:
//                 latestMsg.content ??
//                 (latestMsg.fileUrl?.length ? "sent file" : null),
//               createdAt: latestMsg.createdAt.toISOString(),
//               senderId: latestMsg.senderId ?? null,
//             }
//           : null;

//         const roomMemberIds = parseRoomMembers(room.userIds);

//         const members = roomMemberIds.map((memberId) => {
//           const member = userMap.get(memberId);
//           return {
//             id: memberId,
//             fullName: member?.fullName ?? null,
//             profileImage: member?.profileImage ?? null,
//             isActive: connectedUserIds.has(memberId),
//           };
//         });

//         const partner =
//           roomMemberIds.length === 2
//             ? members.find((m) => m.id !== targetUserId) || null
//             : null;

//         return {
//           roomId: room.id,
//           partner,
//           lastMessage,
//           updatedAt: room.updatedAt,
//         };
//       }),
//     );
//   };

//   const deduplicateConversationsByPartner = (
//     conversations: Array<{
//       roomId: string;
//       partner: any;
//       lastMessage: any;
//       updatedAt: any;
//     }>,
//   ) => {
//     const partnerMap = new Map<string, any>();

//     conversations.forEach((conv) => {
//       const partnerId = conv.partner?.id;
//       if (partnerId) {
//         const existing = partnerMap.get(partnerId);
//         // Keep the conversation with this partner that was updated most recently
//         if (
//           !existing ||
//           new Date(conv.updatedAt) > new Date(existing.updatedAt)
//         ) {
//           partnerMap.set(partnerId, conv);
//         }
//       }
//     });

//     // Remove updatedAt before returning (not needed in response)
//     return Array.from(partnerMap.values()).map((conv) => {
//       const { updatedAt, ...rest } = conv;
//       return rest;
//     });
//   };

//   wss.on("connection", async (ws: CustomWebSocket, req: Request) => {
//     const baseUrl = `http://${req.headers.host || "localhost"}`;
//     const url = new URL(req.url || "/", baseUrl);
//     let authToken =
//       url.searchParams.get("x-token") ?? (req.headers["x-token"] as string);

//     const decoded = verifyWebSocketToken(ws, authToken);
//     if (!decoded) {
//       ws.close();
//       return;
//     }

//     const userId = decoded.id;
//     ws.userId = userId;
//     connectedUsers.add(ws);

//     let roomId: string | null = null;

//     const interval = setInterval(() => {
//       if (ws.readyState === WebSocket.OPEN) ws.ping();
//     }, 30000);

//     ws.send(
//       JSON.stringify({
//         message: "Welcome to the WebSocket server!",
//       }),
//     );

//     ws.on("message", async (message: any) => {
//       try {
//         const { type, receiverId, content, fileUrl, messageId } = JSON.parse(
//           message.toString(),
//         );

//         switch (type) {
//           case "conversation": {
//             const conversations = await buildConversations(userId);
//             const dedupedConversations =
//               deduplicateConversationsByPartner(conversations);
//             ws.send(
//               JSON.stringify({
//                 type: "conversation",
//                 conversations: dedupedConversations,
//               }),
//             );
//             break;
//           }

//           case "subscribe": {
//             if (!receiverId) {
//               return ws.send(
//                 JSON.stringify({
//                   type: "error",
//                   message: "receiverId is required",
//                 }),
//               );
//             }

//             if (receiverId === userId) {
//               return ws.send(
//                 JSON.stringify({
//                   type: "error",
//                   message: "receiverId cannot be your own user id",
//                 }),
//               );
//             }

//             const receiverInfo = await prisma.user.findUnique({
//               where: { id: receiverId },
//               select: { id: true, fullName: true, profileImage: true },
//             });
//             if (!receiverInfo) {
//               return ws.send(
//                 JSON.stringify({
//                   type: "error",
//                   message: "Receiver not found",
//                 }),
//               );
//             }

//             const roomKey = createRoomKey(userId, receiverId);

//             const createdRoom = await prisma.chatRoom.upsert({
//               where: { userIds: roomKey },
//               update: { updatedAt: new Date() },
//               create: { userIds: roomKey },
//             });

//             if (!createdRoom) {
//               return ws.send(
//                 JSON.stringify({
//                   type: "error",
//                   message: "Unable to resolve room from receiverId",
//                 }),
//               );
//             }

//             const room = await prisma.chatRoom.findUnique({
//               where: { id: createdRoom.id },
//               select: { userIds: true },
//             });

//             const roomMemberIds = room ? parseRoomMembers(room.userIds) : [];

//             if (!room || !roomMemberIds.includes(userId)) {
//               return ws.send(
//                 JSON.stringify({
//                   type: "error",
//                   message: "Room not found or access denied",
//                 }),
//               );
//             }

//             roomId = createdRoom.id;

//             roomUsers.forEach((clients, key) => {
//               if (clients.has(ws)) {
//                 clients.delete(ws);
//                 if (clients.size === 0) roomUsers.delete(key);
//               }
//             });

//             if (!roomUsers.has(roomId)) {
//               roomUsers.set(roomId, new Set());
//             }
//             roomUsers.get(roomId)?.add(ws);

//             const dbMessages = await prisma.message.findMany({
//               where: { roomId },
//               orderBy: { createdAt: "asc" },
//             });

//             const messages = await mapMessagesWithSender(dbMessages);

//             const memberUserMap = await getUserMap(roomMemberIds);
//             const partnerId = roomMemberIds.find((id) => id !== userId);
//             const partnerUser = partnerId ? memberUserMap.get(partnerId) : null;
//             const partner = partnerId
//               ? {
//                   id: partnerId,
//                   fullName: partnerUser?.fullName ?? null,
//                   profileImage: partnerUser?.profileImage ?? null,
//                   isActive: getConnectedUserIds().has(partnerId),
//                 }
//               : null;

//             ws.send(
//               JSON.stringify({
//                 type: "subscribe",
//                 roomId,
//                 partner,
//                 messages,
//               }),
//             );

//             break;
//           }

//           case "send-message": {
//             if (!roomId) {
//               return ws.send(
//                 JSON.stringify({
//                   type: "error",
//                   message: "You are not subscribed to any room",
//                 }),
//               );
//             }

//             const room = await prisma.chatRoom.findUnique({
//               where: { id: roomId },
//               select: { userIds: true, status: true },
//             });

//             const roomMemberIds = room ? parseRoomMembers(room.userIds) : [];

//             if (!room || !roomMemberIds.includes(userId)) {
//               return ws.send(
//                 JSON.stringify({
//                   type: "error",
//                   message: "Room not found or access denied",
//                 }),
//               );
//             }

//             if (room.status === "Blocked") {
//               return ws.send(
//                 JSON.stringify({
//                   type: "error",
//                   message: "Room is blocked, you cannot send messages",
//                 }),
//               );
//             }

//             const senderInfo = await prisma.user.findUnique({
//               where: { id: userId },
//               select: { id: true, fullName: true, profileImage: true },
//             });

//             const createdMessage = await prisma.message.create({
//               data: {
//                 roomId,
//                 senderId: userId,
//                 content: content ?? null,
//                 fileUrl: Array.isArray(fileUrl) ? fileUrl : [],
//               },
//             });

//             const messagePayload = {
//               id: createdMessage.id,
//               content: createdMessage.content,
//               senderId: userId,
//               sender: senderInfo
//                 ? {
//                     id: senderInfo.id,
//                     fullName: senderInfo.fullName,
//                     profileImage: senderInfo.profileImage,
//                   }
//                 : null,
//               roomId,
//               fileUrl: createdMessage.fileUrl,
//               createdAt: createdMessage.createdAt.toISOString(),
//               updatedAt: createdMessage.updatedAt.toISOString(),
//             };

//             await prisma.chatRoom.update({
//               where: { id: roomId },
//               data: { updatedAt: new Date() },
//             });

//             Array.from(connectedUsers)
//               .filter(
//                 (client) =>
//                   client.userId && roomMemberIds.includes(client.userId),
//               )
//               .forEach((client) => {
//                 if (client.readyState === WebSocket.OPEN) {
//                   client.send(
//                     JSON.stringify({
//                       type: "receive-message",
//                       message: {
//                         id: messagePayload.id,
//                         content: messagePayload.content,
//                         senderId: messagePayload.senderId,
//                         sender: messagePayload.sender,
//                         roomId: messagePayload.roomId,
//                         fileUrl: messagePayload.fileUrl,
//                         createdAt: messagePayload.createdAt,
//                         updatedAt: messagePayload.updatedAt,
//                       },
//                     }),
//                   );
//                 }
//               });

//             for (const memberId of roomMemberIds) {
//               const memberSockets = Array.from(connectedUsers).filter(
//                 (client) => client.userId === memberId,
//               );

//               if (memberSockets.length > 0) {
//                 const conversations = await buildConversations(memberId);
//                 const dedupedConversations =
//                   deduplicateConversationsByPartner(conversations);
//                 memberSockets.forEach((socketClient) => {
//                   if (socketClient.readyState === WebSocket.OPEN) {
//                     socketClient.send(
//                       JSON.stringify({
//                         type: "conversation",
//                         conversations: dedupedConversations,
//                       }),
//                     );
//                   }
//                 });
//               }
//             }

//             break;
//           }

//           case "edit-message": {
//             if (!messageId) {
//               return ws.send(
//                 JSON.stringify({
//                   type: "error",
//                   message: "Message ID is required for editing",
//                 }),
//               );
//             }

//             const existingMessage = await prisma.message.findUnique({
//               where: { id: messageId },
//             });

//             if (!existingMessage) {
//               return ws.send(
//                 JSON.stringify({
//                   type: "error",
//                   message: "Message not found",
//                 }),
//               );
//             }

//             if (existingMessage.senderId !== userId) {
//               return ws.send(
//                 JSON.stringify({
//                   type: "error",
//                   message: "You can edit only your own message",
//                 }),
//               );
//             }

//             const room = await prisma.chatRoom.findUnique({
//               where: { id: existingMessage.roomId },
//               select: { userIds: true },
//             });

//             const roomMemberIds = room ? parseRoomMembers(room.userIds) : [];

//             if (!room || !roomMemberIds.includes(userId)) {
//               return ws.send(
//                 JSON.stringify({
//                   type: "error",
//                   message: "Room not found or access denied",
//                 }),
//               );
//             }

//             const senderInfo = await prisma.user.findUnique({
//               where: { id: userId },
//               select: { id: true, fullName: true, profileImage: true },
//             });

//             const updatedMessage = await prisma.message.update({
//               where: { id: messageId },
//               data: {
//                 content: content ?? null,
//               },
//             });

//             const messagePayload = {
//               id: updatedMessage.id,
//               content: updatedMessage.content,
//               senderId: userId,
//               sender: senderInfo
//                 ? {
//                     id: senderInfo.id,
//                     fullName: senderInfo.fullName,
//                     profileImage: senderInfo.profileImage,
//                   }
//                 : null,
//               roomId,
//               fileUrl: updatedMessage.fileUrl,
//               createdAt: updatedMessage.createdAt,
//               updatedAt: updatedMessage.updatedAt,
//             };

//             Array.from(connectedUsers)
//               .filter(
//                 (client) =>
//                   (client.userId &&
//                     roomMemberIds.includes(client.userId) &&
//                     client.userId === userId) ||
//                   (client.userId &&
//                     roomMemberIds.includes(client.userId) &&
//                     client.userId !== userId),
//               )
//               .forEach((client) => {
//                 if (client.readyState === WebSocket.OPEN) {
//                   client.send(
//                     JSON.stringify({
//                       type: "updated-message",
//                       message: {
//                         id: messagePayload.id,
//                         content: messagePayload.content,
//                         senderId: messagePayload.senderId,
//                         sender: messagePayload.sender,
//                         roomId: messagePayload.roomId,
//                         fileUrl: messagePayload.fileUrl,
//                         createdAt: messagePayload.createdAt,
//                         updatedAt: messagePayload.updatedAt,
//                       },
//                     }),
//                   );
//                 }
//               });

//             break;
//           }

//           case "delete-message": {
//             if (!messageId) {
//               return ws.send(
//                 JSON.stringify({
//                   type: "error",
//                   message: "You are not subscribed to any room",
//                 }),
//               );
//             }

//             const existingMessage = await prisma.message.findUnique({
//               where: { id: messageId },
//             });

//             if (!existingMessage) {
//               return ws.send(
//                 JSON.stringify({
//                   type: "error",
//                   message: "Message not found",
//                 }),
//               );
//             }

//             if (existingMessage.senderId !== userId) {
//               return ws.send(
//                 JSON.stringify({
//                   type: "error",
//                   message: "You can edit only your own message",
//                 }),
//               );
//             }

//             const room = await prisma.chatRoom.findUnique({
//               where: { id: existingMessage.roomId },
//               select: { userIds: true },
//             });

//             const roomMemberIds = room ? parseRoomMembers(room.userIds) : [];

//             if (!room || !roomMemberIds.includes(userId)) {
//               return ws.send(
//                 JSON.stringify({
//                   type: "error",
//                   message: "Room not found or access denied",
//                 }),
//               );
//             }

//             await prisma.message.delete({ where: { id: messageId } });

//             ws.send(
//               JSON.stringify({
//                 type: "message-deleted",
//                 message: "Message deleted successfully",
//                 messageId,
//               }),
//             );

//             break;
//           }

//           default:
//             ws.send(
//               JSON.stringify({
//                 type: "error",
//                 message: "Invalid message type",
//               }),
//             );
//         }
//       } catch (err: unknown) {
//         if (err instanceof SyntaxError) {
//           ws.send(JSON.stringify({ type: "error", message: "Bad JSON" }));
//         } else if (err instanceof Error) {
//           ws.send(JSON.stringify({ type: "error", message: err.message }));
//         } else {
//           ws.send(
//             JSON.stringify({ type: "error", message: "Unexpected error" }),
//           );
//         }
//       }
//     });

//     ws.on("close", async () => {
//       connectedUsers.delete(ws);

//       if (roomId) {
//         const clients = roomUsers.get(roomId);
//         clients?.delete(ws);
//         if (clients?.size === 0) roomUsers.delete(roomId);
//       }
//       clearInterval(interval);
//     });
//   });
// }

// export const socket = { wss, roomUsers };

import { WebSocket, WebSocketServer } from "ws";
import { Request } from "express";
import prisma from "../../../shared/prisma";
import { verifyWebSocketToken } from "./socket.verifyToken";

interface CustomWebSocket extends WebSocket {
  userId?: string;
  streamId?: string; // NEW: which live stream this socket is hosting or watching
}

const roomUsers = new Map<string, Set<WebSocket>>();
const connectedUsers = new Set<CustomWebSocket>();

// NEW: live stream rooms -> streamId -> { hostId, hostSocket, viewers }
const liveStreams = new Map<
  string,
  { hostId: string; hostSocket: CustomWebSocket; viewers: Set<CustomWebSocket> }
>();

let wss: WebSocketServer | null = null;

export function setupWebSocketServer(server: any) {
  wss = new WebSocketServer({ server });

  const getConnectedUserIds = () =>
    new Set(
      Array.from(connectedUsers)
        .map((ws) => ws.userId)
        .filter((id): id is string => Boolean(id)),
    );

  const getUserMap = async (memberIds: string[]) => {
    if (memberIds.length === 0) return new Map<string, any>();
    const users = await prisma.user.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, fullName: true, profileImage: true },
    });
    return new Map(users.map((user) => [user.id, user]));
  };

  const createRoomKey = (firstUserId: string, secondUserId: string) =>
    [firstUserId, secondUserId].sort().join("|");

  const parseRoomMembers = (roomUserIds: string) =>
    roomUserIds
      .split("|")
      .map((id) => id.trim())
      .filter(Boolean);

  const mapMessagesWithSender = async (
    messages: Array<{
      id: string;
      content: string | null;
      senderId: string;
      roomId: string;
      fileUrl: string[];
      createdAt: Date;
      updatedAt: Date;
    }>,
  ) => {
    const senderIds = Array.from(new Set(messages.map((msg) => msg.senderId)));
    const userMap = await getUserMap(senderIds);

    return messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      sender: userMap.get(msg.senderId)
        ? {
            id: userMap.get(msg.senderId).id,
            fullName: userMap.get(msg.senderId).fullName,
            profileImage: userMap.get(msg.senderId).profileImage,
          }
        : null,
      roomId: msg.roomId,
      fileUrl: msg.fileUrl,
      createdAt: msg.createdAt.toISOString(),
      updatedAt: msg.updatedAt.toISOString(),
    }));
  };

  const buildConversations = async (targetUserId: string) => {
    const rooms = await prisma.chatRoom.findMany({
      where: {
        userIds: { contains: targetUserId },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Deduplicate rooms by ID in case of duplicate results
    const uniqueRoomsMap = new Map<string, any>();
    rooms.forEach((room) => {
      if (!uniqueRoomsMap.has(room.id)) {
        uniqueRoomsMap.set(room.id, room);
      }
    });
    const uniqueRooms = Array.from(uniqueRoomsMap.values()).filter((room) =>
      parseRoomMembers(room.userIds).includes(targetUserId),
    );

    const memberIds = Array.from(
      new Set(uniqueRooms.flatMap((room) => parseRoomMembers(room.userIds))),
    );
    const userMap = await getUserMap(memberIds);
    const connectedUserIds = getConnectedUserIds();

    return Promise.all(
      uniqueRooms.map(async (room) => {
        const latestMsg = await prisma.message.findFirst({
          where: { roomId: room.id },
          orderBy: { createdAt: "desc" },
          select: {
            content: true,
            fileUrl: true,
            createdAt: true,
            senderId: true,
          },
        });

        const lastMessage = latestMsg
          ? {
              content:
                latestMsg.content ??
                (latestMsg.fileUrl?.length ? "sent file" : null),
              createdAt: latestMsg.createdAt.toISOString(),
              senderId: latestMsg.senderId ?? null,
            }
          : null;

        const roomMemberIds = parseRoomMembers(room.userIds);

        const members = roomMemberIds.map((memberId) => {
          const member = userMap.get(memberId);
          return {
            id: memberId,
            fullName: member?.fullName ?? null,
            profileImage: member?.profileImage ?? null,
            isActive: connectedUserIds.has(memberId),
          };
        });

        const partner =
          roomMemberIds.length === 2
            ? members.find((m) => m.id !== targetUserId) || null
            : null;

        return {
          roomId: room.id,
          partner,
          lastMessage,
          updatedAt: room.updatedAt,
        };
      }),
    );
  };

  const deduplicateConversationsByPartner = (
    conversations: Array<{
      roomId: string;
      partner: any;
      lastMessage: any;
      updatedAt: any;
    }>,
  ) => {
    const partnerMap = new Map<string, any>();

    conversations.forEach((conv) => {
      const partnerId = conv.partner?.id;
      if (partnerId) {
        const existing = partnerMap.get(partnerId);
        // Keep the conversation with this partner that was updated most recently
        if (
          !existing ||
          new Date(conv.updatedAt) > new Date(existing.updatedAt)
        ) {
          partnerMap.set(partnerId, conv);
        }
      }
    });

    // Remove updatedAt before returning (not needed in response)
    return Array.from(partnerMap.values()).map((conv) => {
      const { updatedAt, ...rest } = conv;
      return rest;
    });
  };

  wss.on("connection", async (ws: CustomWebSocket, req: Request) => {
    const baseUrl = `http://${req.headers.host || "localhost"}`;
    const url = new URL(req.url || "/", baseUrl);
    let authToken =
      url.searchParams.get("x-token") ?? (req.headers["x-token"] as string);

    const decoded = verifyWebSocketToken(ws, authToken);
    if (!decoded) {
      ws.close();
      return;
    }

    const userId = decoded.id;
    ws.userId = userId;
    connectedUsers.add(ws);

    let roomId: string | null = null;

    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.ping();
    }, 30000);

    ws.send(
      JSON.stringify({
        message: "Welcome to the WebSocket server!",
      }),
    );

    ws.on("message", async (message: any) => {
      try {
        const { type, receiverId, content, fileUrl, messageId, streamId } =
          JSON.parse(message.toString());

        switch (type) {
          case "conversation": {
            const conversations = await buildConversations(userId);
            const dedupedConversations =
              deduplicateConversationsByPartner(conversations);
            ws.send(
              JSON.stringify({
                type: "conversation",
                conversations: dedupedConversations,
              }),
            );
            break;
          }

          case "subscribe": {
            if (!receiverId) {
              return ws.send(
                JSON.stringify({
                  type: "error",
                  message: "receiverId is required",
                }),
              );
            }

            if (receiverId === userId) {
              return ws.send(
                JSON.stringify({
                  type: "error",
                  message: "receiverId cannot be your own user id",
                }),
              );
            }

            const receiverInfo = await prisma.user.findUnique({
              where: { id: receiverId },
              select: { id: true, fullName: true, profileImage: true },
            });
            if (!receiverInfo) {
              return ws.send(
                JSON.stringify({
                  type: "error",
                  message: "Receiver not found",
                }),
              );
            }

            const roomKey = createRoomKey(userId, receiverId);

            const createdRoom = await prisma.chatRoom.upsert({
              where: { userIds: roomKey },
              update: { updatedAt: new Date() },
              create: { userIds: roomKey },
            });

            if (!createdRoom) {
              return ws.send(
                JSON.stringify({
                  type: "error",
                  message: "Unable to resolve room from receiverId",
                }),
              );
            }

            const room = await prisma.chatRoom.findUnique({
              where: { id: createdRoom.id },
              select: { userIds: true },
            });

            const roomMemberIds = room ? parseRoomMembers(room.userIds) : [];

            if (!room || !roomMemberIds.includes(userId)) {
              return ws.send(
                JSON.stringify({
                  type: "error",
                  message: "Room not found or access denied",
                }),
              );
            }

            roomId = createdRoom.id;

            roomUsers.forEach((clients, key) => {
              if (clients.has(ws)) {
                clients.delete(ws);
                if (clients.size === 0) roomUsers.delete(key);
              }
            });

            if (!roomUsers.has(roomId)) {
              roomUsers.set(roomId, new Set());
            }
            roomUsers.get(roomId)?.add(ws);

            const dbMessages = await prisma.message.findMany({
              where: { roomId },
              orderBy: { createdAt: "asc" },
            });

            const messages = await mapMessagesWithSender(dbMessages);

            const memberUserMap = await getUserMap(roomMemberIds);
            const partnerId = roomMemberIds.find((id) => id !== userId);
            const partnerUser = partnerId ? memberUserMap.get(partnerId) : null;
            const partner = partnerId
              ? {
                  id: partnerId,
                  fullName: partnerUser?.fullName ?? null,
                  profileImage: partnerUser?.profileImage ?? null,
                  isActive: getConnectedUserIds().has(partnerId),
                }
              : null;

            ws.send(
              JSON.stringify({
                type: "subscribe",
                roomId,
                partner,
                messages,
              }),
            );

            break;
          }

          case "send-message": {
            if (!roomId) {
              return ws.send(
                JSON.stringify({
                  type: "error",
                  message: "You are not subscribed to any room",
                }),
              );
            }

            const room = await prisma.chatRoom.findUnique({
              where: { id: roomId },
              select: { userIds: true, status: true },
            });

            const roomMemberIds = room ? parseRoomMembers(room.userIds) : [];

            if (!room || !roomMemberIds.includes(userId)) {
              return ws.send(
                JSON.stringify({
                  type: "error",
                  message: "Room not found or access denied",
                }),
              );
            }

            if (room.status === "Blocked") {
              return ws.send(
                JSON.stringify({
                  type: "error",
                  message: "Room is blocked, you cannot send messages",
                }),
              );
            }

            const senderInfo = await prisma.user.findUnique({
              where: { id: userId },
              select: { id: true, fullName: true, profileImage: true },
            });

            const createdMessage = await prisma.message.create({
              data: {
                roomId,
                senderId: userId,
                content: content ?? null,
                fileUrl: Array.isArray(fileUrl) ? fileUrl : [],
              },
            });

            const messagePayload = {
              id: createdMessage.id,
              content: createdMessage.content,
              senderId: userId,
              sender: senderInfo
                ? {
                    id: senderInfo.id,
                    fullName: senderInfo.fullName,
                    profileImage: senderInfo.profileImage,
                  }
                : null,
              roomId,
              fileUrl: createdMessage.fileUrl,
              createdAt: createdMessage.createdAt.toISOString(),
              updatedAt: createdMessage.updatedAt.toISOString(),
            };

            await prisma.chatRoom.update({
              where: { id: roomId },
              data: { updatedAt: new Date() },
            });

            Array.from(connectedUsers)
              .filter(
                (client) =>
                  client.userId && roomMemberIds.includes(client.userId),
              )
              .forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(
                    JSON.stringify({
                      type: "receive-message",
                      message: {
                        id: messagePayload.id,
                        content: messagePayload.content,
                        senderId: messagePayload.senderId,
                        sender: messagePayload.sender,
                        roomId: messagePayload.roomId,
                        fileUrl: messagePayload.fileUrl,
                        createdAt: messagePayload.createdAt,
                        updatedAt: messagePayload.updatedAt,
                      },
                    }),
                  );
                }
              });

            for (const memberId of roomMemberIds) {
              const memberSockets = Array.from(connectedUsers).filter(
                (client) => client.userId === memberId,
              );

              if (memberSockets.length > 0) {
                const conversations = await buildConversations(memberId);
                const dedupedConversations =
                  deduplicateConversationsByPartner(conversations);
                memberSockets.forEach((socketClient) => {
                  if (socketClient.readyState === WebSocket.OPEN) {
                    socketClient.send(
                      JSON.stringify({
                        type: "conversation",
                        conversations: dedupedConversations,
                      }),
                    );
                  }
                });
              }
            }

            break;
          }

          case "edit-message": {
            if (!messageId) {
              return ws.send(
                JSON.stringify({
                  type: "error",
                  message: "Message ID is required for editing",
                }),
              );
            }

            const existingMessage = await prisma.message.findUnique({
              where: { id: messageId },
            });

            if (!existingMessage) {
              return ws.send(
                JSON.stringify({
                  type: "error",
                  message: "Message not found",
                }),
              );
            }

            if (existingMessage.senderId !== userId) {
              return ws.send(
                JSON.stringify({
                  type: "error",
                  message: "You can edit only your own message",
                }),
              );
            }

            const room = await prisma.chatRoom.findUnique({
              where: { id: existingMessage.roomId },
              select: { userIds: true },
            });

            const roomMemberIds = room ? parseRoomMembers(room.userIds) : [];

            if (!room || !roomMemberIds.includes(userId)) {
              return ws.send(
                JSON.stringify({
                  type: "error",
                  message: "Room not found or access denied",
                }),
              );
            }

            const senderInfo = await prisma.user.findUnique({
              where: { id: userId },
              select: { id: true, fullName: true, profileImage: true },
            });

            const updatedMessage = await prisma.message.update({
              where: { id: messageId },
              data: {
                content: content ?? null,
              },
            });

            const messagePayload = {
              id: updatedMessage.id,
              content: updatedMessage.content,
              senderId: userId,
              sender: senderInfo
                ? {
                    id: senderInfo.id,
                    fullName: senderInfo.fullName,
                    profileImage: senderInfo.profileImage,
                  }
                : null,
              roomId,
              fileUrl: updatedMessage.fileUrl,
              createdAt: updatedMessage.createdAt,
              updatedAt: updatedMessage.updatedAt,
            };

            Array.from(connectedUsers)
              .filter(
                (client) =>
                  (client.userId &&
                    roomMemberIds.includes(client.userId) &&
                    client.userId === userId) ||
                  (client.userId &&
                    roomMemberIds.includes(client.userId) &&
                    client.userId !== userId),
              )
              .forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(
                    JSON.stringify({
                      type: "updated-message",
                      message: {
                        id: messagePayload.id,
                        content: messagePayload.content,
                        senderId: messagePayload.senderId,
                        sender: messagePayload.sender,
                        roomId: messagePayload.roomId,
                        fileUrl: messagePayload.fileUrl,
                        createdAt: messagePayload.createdAt,
                        updatedAt: messagePayload.updatedAt,
                      },
                    }),
                  );
                }
              });

            break;
          }

          case "delete-message": {
            if (!messageId) {
              return ws.send(
                JSON.stringify({
                  type: "error",
                  message: "You are not subscribed to any room",
                }),
              );
            }

            const existingMessage = await prisma.message.findUnique({
              where: { id: messageId },
            });

            if (!existingMessage) {
              return ws.send(
                JSON.stringify({
                  type: "error",
                  message: "Message not found",
                }),
              );
            }

            if (existingMessage.senderId !== userId) {
              return ws.send(
                JSON.stringify({
                  type: "error",
                  message: "You can edit only your own message",
                }),
              );
            }

            const room = await prisma.chatRoom.findUnique({
              where: { id: existingMessage.roomId },
              select: { userIds: true },
            });

            const roomMemberIds = room ? parseRoomMembers(room.userIds) : [];

            if (!room || !roomMemberIds.includes(userId)) {
              return ws.send(
                JSON.stringify({
                  type: "error",
                  message: "Room not found or access denied",
                }),
              );
            }

            await prisma.message.delete({ where: { id: messageId } });

            ws.send(
              JSON.stringify({
                type: "message-deleted",
                message: "Message deleted successfully",
                messageId,
              }),
            );

            break;
          }

          // ==========================================================
          // NEW: Live stream cases below. Nothing above this point was
          // changed from the original implementation.
          // ==========================================================

          case "start-stream": {
            // NOTE: streamId here is the MongoDB _id of an already-created
            // LiveStream document (created via REST when the host taps
            // "Go Live"), NOT generated by the socket. This lets viewers
            // discover the stream through the DB (listing page, deep link,
            // notification, etc.) and join using an id they already know.
            if (!streamId) {
              return ws.send(
                JSON.stringify({
                  type: "error",
                  message: "streamId is required",
                }),
              );
            }

            const streamDoc = await prisma.liveStream.findUnique({
              where: { id: streamId },
              select: { id: true, userId: true, isLive: true },
            });

            if (!streamDoc) {
              return ws.send(
                JSON.stringify({
                  type: "error",
                  message: "Stream not found",
                }),
              );
            }

            if (streamDoc.userId !== userId) {
              return ws.send(
                JSON.stringify({
                  type: "error",
                  message: "You are not the host of this stream",
                }),
              );
            }

            if (liveStreams.has(streamId)) {
              return ws.send(
                JSON.stringify({
                  type: "error",
                  message: "This stream is already live",
                }),
              );
            }

            liveStreams.set(streamId, {
              hostId: userId,
              hostSocket: ws,
              viewers: new Set(),
            });

            ws.streamId = streamId;

            await prisma.liveStream.update({
              where: { id: streamId },
              data: { isLive: true },
            });

            ws.send(
              JSON.stringify({
                type: "stream-started",
                streamId,
              }),
            );

            break;
          }

          case "join-stream": {
            if (!streamId) {
              return ws.send(
                JSON.stringify({
                  type: "error",
                  message: "streamId is required",
                }),
              );
            }

            const stream = liveStreams.get(streamId);

            if (!stream) {
              return ws.send(
                JSON.stringify({
                  type: "error",
                  message: "This stream is not currently live",
                }),
              );
            }

            if (stream.hostId === userId) {
              return ws.send(
                JSON.stringify({
                  type: "error",
                  message: "You cannot join your own stream as a viewer",
                }),
              );
            }

            stream.viewers.add(ws);
            ws.streamId = streamId;

            ws.send(
              JSON.stringify({
                type: "stream-joined",
                streamId,
                viewerCount: stream.viewers.size,
              }),
            );

            if (stream.hostSocket.readyState === WebSocket.OPEN) {
              stream.hostSocket.send(
                JSON.stringify({
                  type: "viewer-count",
                  streamId,
                  count: stream.viewers.size,
                }),
              );
            }

            break;
          }

          case "leave-stream": {
            const stream = ws.streamId ? liveStreams.get(ws.streamId) : null;

            if (stream) {
              stream.viewers.delete(ws);

              if (stream.hostSocket.readyState === WebSocket.OPEN) {
                stream.hostSocket.send(
                  JSON.stringify({
                    type: "viewer-count",
                    streamId: ws.streamId,
                    count: stream.viewers.size,
                  }),
                );
              }
            }

            ws.streamId = undefined;

            break;
          }

          case "end-stream": {
            const activeStreamId = ws.streamId;
            const stream = activeStreamId
              ? liveStreams.get(activeStreamId)
              : null;

            if (!stream || stream.hostId !== userId) {
              return ws.send(
                JSON.stringify({
                  type: "error",
                  message: "You are not hosting this stream",
                }),
              );
            }

            stream.viewers.forEach((viewer) => {
              if (viewer.readyState === WebSocket.OPEN) {
                viewer.send(
                  JSON.stringify({
                    type: "stream-ended",
                    streamId: activeStreamId,
                  }),
                );
              }
              viewer.streamId = undefined;
            });

            liveStreams.delete(activeStreamId as string);
            ws.streamId = undefined;

            await prisma.liveStream.update({
              where: { id: activeStreamId as string },
              data: { isLive: false, isCompleted: true },
            });

            break;
          }

          default:
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Invalid message type",
              }),
            );
        }
      } catch (err: unknown) {
        if (err instanceof SyntaxError) {
          ws.send(JSON.stringify({ type: "error", message: "Bad JSON" }));
        } else if (err instanceof Error) {
          ws.send(JSON.stringify({ type: "error", message: err.message }));
        } else {
          ws.send(
            JSON.stringify({ type: "error", message: "Unexpected error" }),
          );
        }
      }
    });

    ws.on("close", async () => {
      connectedUsers.delete(ws);

      if (roomId) {
        const clients = roomUsers.get(roomId);
        clients?.delete(ws);
        if (clients?.size === 0) roomUsers.delete(roomId);
      }

      // NEW: live stream cleanup on disconnect
      if (ws.streamId) {
        const stream = liveStreams.get(ws.streamId);

        if (stream) {
          if (stream.hostId === ws.userId) {
            // host dropped -> end the stream for everyone watching
            stream.viewers.forEach((viewer) => {
              if (viewer.readyState === WebSocket.OPEN) {
                viewer.send(
                  JSON.stringify({
                    type: "stream-ended",
                    streamId: ws.streamId,
                  }),
                );
              }
              viewer.streamId = undefined;
            });
            liveStreams.delete(ws.streamId);

            await prisma.liveStream.update({
              where: { id: ws.streamId },
              data: { isLive: false, isCompleted: true },
            });
          } else {
            // a viewer dropped -> just remove them and update the count
            stream.viewers.delete(ws);
            if (stream.hostSocket.readyState === WebSocket.OPEN) {
              stream.hostSocket.send(
                JSON.stringify({
                  type: "viewer-count",
                  streamId: ws.streamId,
                  count: stream.viewers.size,
                }),
              );
            }
          }
        }
      }

      clearInterval(interval);
    });
  });
}

export const socket = { wss, roomUsers, liveStreams };
