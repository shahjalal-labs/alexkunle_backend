import ApiError from "../errors/ApiErrors";
import prisma from "../shared/prisma";

export const liveStreamCallback = async (body: any) => {
  try {
    console.log("ZEGO callback:", body);

    const { room_id, event } = body;

    if (!room_id) {
      throw new ApiError(400, "room_id is required");
    }

    if (event === "room_login") {
      await prisma.liveStream.update({
        where: {
          id: room_id,
        },
        data: {
          views: {
            increment: 1,
          },
        },
      });

      console.log(`✔ Incremented views for stream ${room_id}`);
    }
    
  } catch (error) {
    console.error("Live stream callback error:", error);
  }
};