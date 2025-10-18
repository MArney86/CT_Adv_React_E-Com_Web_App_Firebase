import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../../components/FirebaseConfig';
import type { CouponCode } from '../../interfaces/CouponCode';

// Async thunk to fetch coupons from Firestore
export const fetchCoupons = createAsyncThunk(
    'coupons/fetchCoupons',
    async () => {
        const couponsCollection = collection(db, 'coupon_codes');
        try {
            const couponsSnapshot = await getDocs(couponsCollection);
            const coupons: CouponCode[] = [];
            
            couponsSnapshot.forEach((doc) => {
                const data = doc.data();
                coupons.push({
                    id: doc.id,
                    code: data.code,
                    discount: data.discount,
                    expiry_date: {
                        date: data.expiry_date?.date?.toDate() || new Date(),
                        is_set: data.expiry_date?.is_set || false
                    },
                    is_active: data.is_active,
                    is_percentage: data.is_percentage,
                    min_purchase: {
                        is_set: data.min_purchase?.is_set || false,
                        value: data.min_purchase?.value || 0
                    }
                });
            });

            return coupons;
        } catch (error) {
            throw new Error('Failed to fetch coupons');
        }
        return [];
    }
);

// Async thunk to add a coupon to Firestore
export const addCouponToFirestore = createAsyncThunk<CouponCode, Omit<CouponCode, 'id'>>(
    'coupons/addCoupon',
    async (coupon: Omit<CouponCode, 'id'>) => {
        const couponsCollection = collection(db, 'coupon_codes');
            try {
                const docRef = await addDoc(couponsCollection, {
                    code: coupon.code,
                    discount: coupon.discount,
                    expiry_date: {
                        date: coupon.expiry_date.date,
                        is_set: coupon.expiry_date.is_set
                    },
                    is_active: coupon.is_active,
                    is_percentage: coupon.is_percentage,
                    min_purchase: {
                        is_set: coupon.min_purchase.is_set,
                        value: coupon.min_purchase.value
                    }
                });

                return {
                id: docRef.id,
                ...coupon
                };
            } catch (error) {
                throw new Error('Failed to add coupon to db');
            }
    }
);

// Async thunk to remove a coupon from Firestore
export const removeCouponFromFirestore = createAsyncThunk(
    'coupons/removeCoupon',
    async (couponId: string) => {
        try {
            await deleteDoc(doc(db, 'coupon_codes', couponId));
            return couponId;
        } catch (error) {
            throw new Error('Failed to remove coupon');
        }
    }
);

// Async thunk to update coupon status in Firestore
export const updateCouponStatus = createAsyncThunk(
    'coupons/updateCouponStatus',
    async ({ couponId, isActive }: { couponId: string; isActive: boolean }) => {
        const couponRef = doc(db, 'coupons', couponId);
        try {
            await updateDoc(couponRef, {
                is_active: isActive
            });
            return { couponId, isActive };
        } catch (error) {
            throw new Error('Failed to update coupon status');
        }
        
    }
);

export interface CouponsState {
    codes: CouponCode[];
    status: 'idle' | 'loading' | 'error';
    error: string | null;
}

const initialState: CouponsState = {
    codes: [],
    status: 'idle',
    error: null
};

const couponsSlice = createSlice({
    name: 'coupons',
    initialState,
    reducers: {
        setStatus: (state, action: PayloadAction<'idle' | 'loading' | 'error'>) => {
            state.status = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        // Fetch coupons
        builder
            .addCase(fetchCoupons.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchCoupons.fulfilled, (state, action) => {
                state.status = 'idle';
                state.codes = action.payload;
                state.error = null;
            })
            .addCase(fetchCoupons.rejected, (state, action) => {
                state.status = 'error';
                state.error = action.error.message || 'Failed to fetch coupons';
            })
            
        // Add coupon
        builder
            .addCase(addCouponToFirestore.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(addCouponToFirestore.fulfilled, (state, action) => {
                state.status = 'idle';
                if (action.payload) {
                    state.codes.push(action.payload);
                } else {
                    state.status = 'error';
                    state.error = 'Failed to add coupon: no payload returned';
                }
            })
            .addCase(addCouponToFirestore.rejected, (state, action) => {
                state.status = 'error';
                state.error = action.error.message || 'Failed to add coupon';
            });
            
        // Remove coupon
        builder
            .addCase(removeCouponFromFirestore.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(removeCouponFromFirestore.fulfilled, (state, action) => {
                state.status = 'idle';
                state.codes = state.codes.filter(coupon => coupon.id !== action.payload);
                state.error = null;
            })
            .addCase(removeCouponFromFirestore.rejected, (state, action) => {
                state.status = 'error';
                state.error = action.error.message || 'Failed to remove coupon';
            })
            
        // Update coupon status
        builder
            .addCase(updateCouponStatus.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(updateCouponStatus.fulfilled, (state, action) => {
                state.status = 'idle';
                const coupon = state.codes.find(c => c.id === action.payload.couponId);
                if (coupon) {
                    coupon.is_active = action.payload.isActive;
                }
                state.error = null;
            })
            .addCase(updateCouponStatus.rejected, (state, action) => {
                state.status = 'error';
                state.error = action.error.message || 'Failed to update coupon status';
            });
    }
});

export const { setStatus, setError, clearError } = couponsSlice.actions;

export default couponsSlice.reducer;
