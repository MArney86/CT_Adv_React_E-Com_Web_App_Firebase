import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { firestoreApi } from '../services/firestoreApi';
import cartReducer from '../slices/CartSlice';
import couponsReducer from '../slices/CouponsSlice';
import productsReducer from '../slices/ProductsSlice';
import userReducer from '../slices/UserSlice';
import ordersReducer from '../slices/OrdersSlice';

export const store = configureStore({
    reducer: {
        [firestoreApi.reducerPath]: firestoreApi.reducer,
        cart: cartReducer,
        coupons: couponsReducer,
        products: productsReducer,
        user: userReducer,
        orders: ordersReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(firestoreApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

setupListeners(store.dispatch);