export type CouponCode = {
    ccid: string; // Firestore document ID
    code: string;
    comment: string;
    discount: number;
    expiryDate: {
        date: string;
        isSet: boolean;
    };
    isActive: boolean;
    isPercentage: boolean;
    minPurchase: {
        isSet: boolean;
        value: number;
    };
}