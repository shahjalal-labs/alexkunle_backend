const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export default generateOTP;

export const generateOrderId = () => {
  const code = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${code}`;
};
export const generateTrackingId = () => {
  const code = Math.floor(1000000 + Math.random() * 9000000);
  return `TRK-${code}`;
};
export const generateCoupon = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let coupon = "CO-";

  for (let i = 0; i < 8; i++) {
    coupon += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return coupon;
};

export const getRandomRewardType = (): "point" | "coupon" | "token" => {
  const types = ["point", "coupon", "token"] as const;

  return types[Math.floor(Math.random() * types.length)];
};

export const getRandomRewardValue = (): 20 | 50 | 100 | 150 | 200 => {
  const values = [20, 50, 100, 150, 200] as const;

  return values[Math.floor(Math.random() * values.length)];
};
