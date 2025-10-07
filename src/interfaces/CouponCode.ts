export type CouponCode = {
    id: number;
    code: string;
    discount: number; // Discount percentage
    percentage: boolean; // Whether the discount is a percentage or a fixed amount
    minPurchase?: number; // Minimum purchase amount to apply the coupon
    expiryDate?: string; // Expiry date of the coupon (ISO string format)
    isActive: boolean; // Whether the coupon is currently active
}