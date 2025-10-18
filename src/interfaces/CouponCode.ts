export type CouponCode = {
    id: string; // Firestore document ID
    code: string;
    discount: number;
    expiry_date: {
        date: Date;
        is_set: boolean;
    };
    is_active: boolean;
    is_percentage: boolean;
    min_purchase: {
        is_set: boolean;
        value: number;
    };
}