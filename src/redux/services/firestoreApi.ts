import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../components/FirebaseConfig';
import { Product } from '../../interfaces/Product';
import { CouponCode } from '../../interfaces/CouponCode';
import { User } from '../../interfaces/User';
import { Cart } from '../../interfaces/Cart';

export const firestoreApi = createApi({
    reducerPath: 'firestoreApi',
    baseQuery: fakeBaseQuery(),
    tagTypes: ['Products', 'Coupons', 'Users', 'Orders'],
    endpoints: (builder) => ({
        getProducts: builder.query({
            queryFn: async () => {
                try {
                    const productsCollection = collection(db, 'products');
                    const productsSnapshot = await getDocs(productsCollection);
                    const products: Product[] = productsSnapshot.docs.map(doc => doc.data() as Product);
                    return { data: products };
                } catch (error) {
                    return { error: { status: 'FETCH_ERROR', error: 'Failed to fetch products' } };
                }
            },
            providesTags: ['Products'],
        }),
        getCoupons: builder.query({
            queryFn: async () => {
                try {
                    const couponsCollection = collection(db, 'coupon_codes');
                    const couponsSnapshot = await getDocs(couponsCollection);
                    const coupons: CouponCode[] = couponsSnapshot.docs.map(doc => doc.data() as CouponCode);
                    return { data: coupons };
                } catch (error) {
                    return { error: { status: 'FETCH_ERROR', error: 'Failed to fetch coupons' } };
                }
            },
            providesTags: ['Coupons'],
        }),
        getUsers: builder.query({
            queryFn: async () => {
                try {
                    const usersCollection = collection(db, 'users');
                    const usersSnapshot = await getDocs(usersCollection);
                    const users: User[] = usersSnapshot.docs.map(doc => doc.data() as User);
                    return { data: users };
                } catch (error) {
                    return { error: { status: 'FETCH_ERROR', error: 'Failed to fetch users' } };
                }
            },
            providesTags: ['Users'],
        }),
        getOrders: builder.query({
            queryFn: async (userId: string) => {
                try {
                    const ordersCollection = collection(db, 'carts');
                    const ordersSnapshot = await getDocs(ordersCollection);
                    const orders: Cart[] = ordersSnapshot.docs.map(doc => doc.data() as Cart);
                    return { data: orders };
                } catch (error) {
                    return { error: { status: 'FETCH_ERROR', error: 'Failed to fetch orders' } };
                }
            },
            providesTags: ['Orders'],
        }),
        // Add more endpoints as needed
    })
});