import { collection, addDoc } from 'firebase/firestore';
import { db } from '../components/FirebaseConfig';

/**
 * Sample data to populate Firestore coupons collection
 * Run this once to add initial coupon data to your Firestore
 */

const sampleCoupons = [
    {
        code: 'BLACKFRIDAY',
        discount: 20,
        expiry_date: {
            date: new Date('2024-12-01'),
            is_set: true
        },
        is_active: false,
        is_percentage: true,
        min_purchase: {
            is_set: false,
            value: 0
        }
    },
    {
        code: 'CYBERMONDAY',
        discount: 25,
        expiry_date: {
            date: new Date('2024-12-02'),
            is_set: true
        },
        is_active: true,
        is_percentage: true,
        min_purchase: {
            is_set: false,
            value: 0
        }
    },
    {
        code: 'SUMMERSALE',
        discount: 15,
        expiry_date: {
            date: new Date('2026-08-30'),
            is_set: true
        },
        is_active: true,
        is_percentage: false, // Fixed amount discount
        min_purchase: {
            is_set: true,
            value: 50 // Minimum $50 purchase
        }
    },
    {
        code: 'WINTERSALE',
        discount: 30,
        expiry_date: {
            date: new Date('2026-01-15'),
            is_set: true
        },
        is_active: true,
        is_percentage: true,
        min_purchase: {
            is_set: false,
            value: 0
        }
    },
    {
        code: 'CODINGTEMPLE',
        discount: 99.99,
        expiry_date: {
            date: new Date('2026-12-31T12:00:00Z'), // Dec 31, 2026 @ 18:00 UTC+6 (12:00 UTC)
            is_set: true
        },
        is_active: true,
        is_percentage: true,
        min_purchase: {
            is_set: false,
            value: 0
        }
    }
];

/**
 * Function to populate Firestore with sample coupons
 * Call this function once to initialize your coupons collection
 */
export const populateSampleCoupons = async () => {
    try {
        const couponsCollection = collection(db, 'coupon_codes');
        
        for (const coupon of sampleCoupons) {
            await addDoc(couponsCollection, coupon);
            console.log(`Added coupon: ${coupon.code}`);
        }
        
        console.log('✅ All sample coupons added successfully!');
    } catch (error) {
        console.error('❌ Error adding sample coupons:', error);
    }
};

// Uncomment the line below and run this file once to populate your Firestore
// populateSampleCoupons();