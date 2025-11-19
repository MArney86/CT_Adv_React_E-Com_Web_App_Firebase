import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../../components/FirebaseConfig';
import type { CouponCode } from '../../interfaces/CouponCode';
import { populateSampleCoupons } from '../../utlilities/populateSampleCoupons';

// Async thunk to fetch coupons from Firestore, or populate sample coupons if empty
export const fetchCoupons = createAsyncThunk<CouponCode[]>(
    'coupons/fetchCoupons',
    async () => {
        try {
            // Try to get coupons from Firestore
            const couponsCollection = collection(db, 'coupon_codes');
            const couponsSnapshot = await getDocs(couponsCollection);
            
            // Filter out the "Initialize" or "Initialization" document
            const coupons = couponsSnapshot.docs
                .filter(doc => doc.id !== 'Initialize' && doc.id !== 'Initialization')
                .map(doc => {
                    const data = doc.data();
                    // Convert Firestore Timestamps to ISO strings and map field names
                    const expiryDateField = data.expiry_date || data.expiryDate;
                    const expiryDateValue = expiryDateField?.date;
                    const serializedDate = expiryDateValue && typeof expiryDateValue.toDate === 'function'
                        ? expiryDateValue.toDate().toISOString()
                        : (typeof expiryDateValue === 'string' ? expiryDateValue : new Date().toISOString());
                    
                    return {
                        ccid: data.ccid || doc.id,
                        code: data.code,
                        comment: data.comment,
                        discount: data.discount,
                        expiryDate: {
                            date: serializedDate,
                            isSet: expiryDateField?.isSet ?? false
                        },
                        isActive: data.isActive,
                        isPercentage: data.isPercentage,
                        minPurchase: data.minPurchase || data.min_purchase
                    } as CouponCode;
                });
            
            if (coupons.length > 0) {
                // Real coupons exist in Firestore, return them
                return coupons;
            } else {
                // No real coupons in Firestore (only Initialization doc or empty), populate sample coupons
                console.log('No coupons found, populating sample coupons...');
                await populateSampleCoupons();
                
                // Fetch the newly added coupons (excluding Initialize/Initialization)
                const newCouponsSnapshot = await getDocs(couponsCollection);
                const newCoupons = newCouponsSnapshot.docs
                    .filter(doc => doc.id !== 'Initialize' && doc.id !== 'Initialization')
                    .map(doc => {
                        const data = doc.data();
                        // Convert Firestore Timestamps to ISO strings and map field names
                        const expiryDateField = data.expiry_date || data.expiryDate;
                        const expiryDateValue = expiryDateField?.date;
                        const serializedDate = expiryDateValue && typeof expiryDateValue.toDate === 'function'
                            ? expiryDateValue.toDate().toISOString()
                            : (typeof expiryDateValue === 'string' ? expiryDateValue : new Date().toISOString());
                        
                        return {
                            ccid: data.ccid || doc.id,
                            code: data.code,
                            comment: data.comment,
                            discount: data.discount,
                            expiryDate: {
                                date: serializedDate,
                                isSet: expiryDateField?.isSet ?? false
                            },
                            isActive: data.isActive,
                            isPercentage: data.isPercentage,
                            minPurchase: data.minPurchase || data.min_purchase
                        } as CouponCode;
                    });
                return newCoupons;
            }
        } catch (error) {
            throw new Error('Failed to fetch coupons');
        }
    }
);

// Async thunk to add a coupon to Firestore
export const addCoupon = createAsyncThunk<CouponCode, CouponCode>(
    'coupons/addCoupon',
    async (coupon: CouponCode) => {
        const couponsCollection = collection(db, 'coupon_codes');
            try {
                const docRef = await addDoc(couponsCollection, {
                    ccid: coupon.ccid,
                    code: coupon.code,
                    discount: coupon.discount,
                    expiryDate: {
                        date: coupon.expiryDate.date,
                        isSet: coupon.expiryDate.isSet
                    },
                    isActive: coupon.isActive,
                    isPercentage: coupon.isPercentage,
                    minPurchase: {
                        isSet: coupon.minPurchase.isSet,
                        value: coupon.minPurchase.value
                    }
                });

                return coupon
            } catch (error) {
                throw new Error('Failed to add coupon to db');
            }
    }
);

// Async thunk to remove a coupon. note: not meant to be used if coupon is applied to any orders
export const removeCoupon = createAsyncThunk(
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

// Async thunk to update coupon details in Firestore
export const updateCouponDetails = createAsyncThunk(
    'coupons/updateCouponDetails',
    async ({ ccid, details} : { ccid: string; details: Partial<CouponCode>}) => {
        const couponRef = doc(db, 'coupons', ccid);
        try {
            await updateDoc(couponRef, details);
            return { ccid, details };
        } catch (error) {
            throw new Error('Failed to update coupon details');
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
        },
        setCoupons: (state, action: PayloadAction<CouponCode[]>) => {
            state.codes = action.payload;
        },
    },
    extraReducers: (builder) => {
        // Fetch coupons
        builder
            .addCase(fetchCoupons.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchCoupons.fulfilled, (state, action) => {
                state.status = 'idle';
                state.codes = action.payload;
                state.error = null;
            })
            .addCase(fetchCoupons.rejected, (state, action) => {
                state.status = 'error';
                state.error = action.error.message || 'Failed to fetch coupons';
            });
        
        // Add coupon
        builder
            .addCase(addCoupon.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(addCoupon.fulfilled, (state, action) => {
                state.status = 'idle';
                if (action.payload) {
                    state.codes.push(action.payload);
                } else {
                    state.status = 'error';
                    state.error = 'Failed to add coupon: no payload returned';
                }
            })
            .addCase(addCoupon.rejected, (state, action) => {
                state.status = 'error';
                state.error = action.error.message || 'Failed to add coupon';
            });
            
        // Remove coupon
        builder
            .addCase(removeCoupon.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(removeCoupon.fulfilled, (state, action) => {
                state.status = 'idle';
                state.codes = state.codes.filter(coupon => coupon.ccid !== action.payload);
                state.error = null;
            })
            .addCase(removeCoupon.rejected, (state, action) => {
                state.status = 'error';
                state.error = action.error.message || 'Failed to remove coupon';
            })
            
        // Update coupon details
        builder
            .addCase(updateCouponDetails.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(updateCouponDetails.fulfilled, (state, action) => {
                state.status = 'idle';
                const coupon = state.codes.find(c => c.ccid === action.payload.ccid);
                if (coupon) {
                    const index = state.codes.findIndex(c => c.ccid === action.payload.ccid);
                    state.codes[index] = { ...coupon, ...action.payload.details };
                }
                state.error = null;
            })
            .addCase(updateCouponDetails.rejected, (state, action) => {
                state.status = 'error';
                state.error = action.error.message || 'Failed to update coupon details';
            });
    }
});

export const { setStatus, setError, clearError, setCoupons } = couponsSlice.actions;

export default couponsSlice.reducer;
