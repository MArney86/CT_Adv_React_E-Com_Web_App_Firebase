import type { CouponCode } from '../interfaces/CouponCode';

/**
 * Utility functions for coupon validation and management
 */

/**
 * Check if a coupon is currently valid (active and not expired)
 */
export const isCouponValid = (coupon: CouponCode): boolean => {
    // Check if coupon is active
    if (!coupon.isActive) {
        return false;
    }

    // Check if expiry date is set and not expired
    if (coupon.expiryDate.isSet) {
        const now = new Date();
        const expiryDate = new Date(coupon.expiryDate.date);
        if (now > expiryDate) {
            return false;
        }
    }

    return true;
};

/**
 * Check if a purchase amount meets the minimum purchase requirement
 */
export const meetsMinimumPurchase = (coupon: CouponCode, purchaseAmount: number): boolean => {
    if (!coupon.minPurchase.isSet) {
        return true; // No minimum purchase requirement
    }

    return purchaseAmount >= coupon.minPurchase.value;
};

/**
 * Calculate the discount amount for a given purchase
 */
export const calculateDiscount = (coupon: CouponCode, purchaseAmount: number): number => {
    if (!isCouponValid(coupon) || !meetsMinimumPurchase(coupon, purchaseAmount)) {
        return 0;
    }

    if (coupon.isPercentage) {
        return (purchaseAmount * coupon.discount) / 100;
    } else {
        return coupon.discount;
    }
};

/**
 * Get user-friendly error message for invalid coupon
 */
export const getCouponErrorMessage = (coupon: CouponCode | null, purchaseAmount?: number): string => {
    if (!coupon) {
        return 'Coupon code not found';
    }

    if (!coupon.isActive) {
        return 'This coupon code is not active';
    }

    if (coupon.expiryDate.isSet) {
        const now = new Date();
        const expiryDate = new Date(coupon.expiryDate.date);
        if (now > expiryDate) {
            return 'This coupon code has expired';
        }
    }

    if (purchaseAmount !== undefined && coupon.minPurchase.isSet) {
        if (purchaseAmount < coupon.minPurchase.value) {
            return `Minimum purchase of $${coupon.minPurchase.value.toFixed(2)} required`;
        }
    }

    return 'Coupon is valid';
};

/**
 * Format coupon for display purposes
 */
export const formatCouponForDisplay = (coupon: CouponCode) => {
    const discountText = coupon.isPercentage
        ? `${coupon.discount}% off`
        : `$${coupon.discount.toFixed(2)} off`;

    const minPurchaseText = coupon.minPurchase.isSet
        ? ` (min. purchase $${coupon.minPurchase.value.toFixed(2)})`
        : '';

    const expiryText = coupon.expiryDate.isSet
        ? ` - Expires ${coupon.expiryDate.date.toLocaleDateString()}`
        : '';

    return `${coupon.code}: ${discountText}${minPurchaseText}${expiryText}`;
};