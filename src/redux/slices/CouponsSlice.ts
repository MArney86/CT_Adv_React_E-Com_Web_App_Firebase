import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {CouponCode} from '../../interfaces/CouponCode';

// Session storage helper functions for coupons
const saveCouponsToStorage = (couponsState: CouponsState) => {
    try {
        sessionStorage.setItem('coupons', JSON.stringify(couponsState));
    } catch (error) {
        console.error('Failed to save coupons to session storage:', error);
    }
};

const loadCouponsFromStorage = (): CouponsState | null => {
    try {
        const savedCoupons = sessionStorage.getItem('coupons');
        return savedCoupons ? JSON.parse(savedCoupons) : null;
    } catch (error) {
        console.error('Failed to load coupons from session storage:', error);
        return null;
    }
};

export interface CouponsState {
    codes: CouponCode[];
    status: 'idle' | 'loading' | 'error';
    error: string | null;
}

const initialState: CouponsState = loadCouponsFromStorage() || {
    codes: [ //example coupon codes
        { id: 0, code: 'BLACKFRIDAY', discount: 20, percentage: true, expiryDate: '2024-12-01T00:00:00.000Z', isActive: false },
        { id: 1, code: 'CYBERMONDAY', discount: 25, percentage: true, expiryDate: '2024-12-02T00:00:00.000Z', isActive: true },
        { id: 2, code: 'SUMMERSALE', discount: 15, percentage: false, expiryDate: '2026-08-30T00:00:00.000Z', isActive: true },
        { id: 3, code: 'WINTERSALE', discount: 30, percentage: true, expiryDate: '2026-01-15T00:00:00.000Z', isActive: true },
        { id: 4, code: 'CODINGTEMPLE', discount: 99.99, percentage: true, expiryDate: '2026-01-01T00:00:00.000Z', isActive: true }  
    ],
    status: 'idle',
    error: null
};

const couponsSlice = createSlice({
    name: 'coupons',
    initialState,
    reducers: {
        addCoupon: (state, action: PayloadAction<CouponCode>) => {
            state.codes.push(action.payload);
            saveCouponsToStorage(state);
        },
        removeCoupon: (state, action: PayloadAction<string>) => {
            state.codes = state.codes.filter(coupon => coupon.code !== action.payload);
            saveCouponsToStorage(state);
        },
        setInActive: (state, action: PayloadAction<string>) => {
            const coupon = state.codes.find(c => c.code === action.payload);
            if (coupon) {
                coupon.isActive = false;
                saveCouponsToStorage(state);
            } else {
                console.error(`Coupon with code ${action.payload} not found.`);
            }
        },
        setStatus: (state, action: PayloadAction<'idle' | 'loading' | 'error'>) => {
            state.status = action.payload;
            saveCouponsToStorage(state);
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
            saveCouponsToStorage(state);
        }
    }
});

export const { addCoupon, removeCoupon, setStatus, setError, setInActive } = couponsSlice.actions;

export default couponsSlice.reducer;
