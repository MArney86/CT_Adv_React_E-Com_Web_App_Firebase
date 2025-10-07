import { configureStore } from '@reduxjs/toolkit';
import cartReducer from '../slices/CartSlice';
import couponsReducer from '../slices/CouponsSlice';

export const store = configureStore({
    reducer: {
        cart: cartReducer,
        coupons: couponsReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;