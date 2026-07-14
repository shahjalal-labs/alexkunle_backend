import express from "express";
import { userRoutes } from "../modules/user/user.route";
import { authRoute } from "../modules/auth/auth.routes";
import { categoryRoutes } from "../modules/category/category.routes";
import { productRoutes } from "../modules/product/product.routes";
import { liveStreamRoutes } from "../modules/livestream/liveStream.routes";
import { messageRoutes } from "../modules/message/message.routes";
import { addressRoute } from "../modules/address/address.route";
import { shortlistRoute } from "../modules/shortlist/shortlist.route";
import { walletRoutes } from "../modules/wallet/wallet.route";
import { orderRoutes } from "../modules/order/order.route";
import { stockRoutes } from "../modules/stock/stock.route";
import { auctionRoutes } from "../modules/auction/auction.routes";
import { notificationsRoute } from "../modules/notifications/notification.route";
import { campaignRoute } from "../modules/campaign/campaign.route";
import { tokenRoutes } from "../modules/token/token.route";
import { adminRoutes } from "../modules/admin/admin.route";
import { autopilotRoute } from "../modules/autopilot/autopilot.route";

const router = express.Router();

const moduleRoutes = [
  { path: "/user", route: userRoutes },
  { path: "/auth", route: authRoute },
  { path: "/category", route: categoryRoutes },
  { path: "/product", route: productRoutes },
  { path: "/live-stream", route: liveStreamRoutes },
  { path: "/message", route: messageRoutes },
  { path: "/address", route: addressRoute },
  { path: "/shortlist", route: shortlistRoute },
  { path: "/wallet", route: walletRoutes },
  { path: "/order", route: orderRoutes },
  { path: "/stock", route: stockRoutes },
  { path: "/auction", route: auctionRoutes },
  { path: "/notification", route: notificationsRoute },
  { path: "/campaign", route: campaignRoute },
  { path: "/token", route: tokenRoutes },
  { path: "/admin", route: adminRoutes },
  { path: "/autopilot", route: autopilotRoute },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
