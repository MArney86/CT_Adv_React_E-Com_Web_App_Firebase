export type CouponCode = {
    id: string; // Firestore document ID
    code: string;
    comment: string;
    discount: number;
    expiryDate: {
        date: Date;
        isSet: boolean;
    };
    isActive: boolean;
    isPercentage: boolean;
    minPurchase: {
        isSet: boolean;
        value: number;
    };
}