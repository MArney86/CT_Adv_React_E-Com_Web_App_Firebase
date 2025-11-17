import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { collection, getDocs } from 'firebase/firestore';
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
                    let products: Product[] = []
                    if (!productsSnapshot.empty) {
                        products = productsSnapshot.docs.map(doc => doc.data() as Product);
                    }
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
                    let coupons: CouponCode[] = [];
                    if (!couponsSnapshot.empty) {
                        coupons = couponsSnapshot.docs.map(doc => doc.data() as CouponCode);
                    }
                    return { data: coupons };
                } catch (error) {
                    return { error: { status: 'FETCH_ERROR', error: 'Failed to fetch coupons' } };
                }
            },
            providesTags: ['Coupons'],
        }),
        getUser: builder.query({
            queryFn: async (userId: string) => {
                try {
                    const usersCollection = collection(db, 'users');
                    const usersSnapshot = await getDocs(usersCollection);
                    let users: User[] = []
                    if (!usersSnapshot.empty) {
                        usersSnapshot.docs.map(doc => doc.data() as User);
                    }
                    return { data: users.find(user => user.uid === userId) || null};
                } catch (error) {
                    return { error: { status: 'FETCH_ERROR', error: 'Failed to fetch user' } };
                }
            },
            providesTags: ['Users'],
        }),
        getOrders: builder.query({
            queryFn: async (userId: string) => {
                if (!userId || userId.trim() === '') {
                    return { error: { status: 'FETCH_ERROR', error: 'Invalid user ID' } };
                }
                
                try {            
                    const ordersCollection = collection(db, 'carts');
                    const ordersSnapshot = await getDocs(ordersCollection);
                    let orders: Cart[] = []
                    if (!ordersSnapshot.empty) {
                        orders = ordersSnapshot.docs.map(doc => {
                            const data = doc.data();
                            // Convert Firestore Timestamp to ISO string
                            const date = data.date;
                            const serializedDate = date && typeof date.toDate === 'function'
                                ? date.toDate().toISOString()
                                : (typeof date === 'string' ? date : new Date().toISOString());
                            
                            return {
                                ...data,
                                date: serializedDate
                            } as Cart;
                        });
                    }
                    return { data: orders };
                } catch (error) {
                    return { error: { status: 'FETCH_ERROR', error: 'Failed to fetch orders' } };
                }
            },
            providesTags: ['Orders'],
        }),
        getAllOrders: builder.query({
            queryFn: async () => {
                try {
                    const cartsCollection = collection(db, 'carts');
                    const cartsSnapshot = await getDocs(cartsCollection);
                    const orders: Cart[] = cartsSnapshot.docs
                        .map(doc => {
                            const data = doc.data();
                            // Convert Firestore Timestamp to ISO string
                            const date = data.date;
                            const serializedDate = date && typeof date.toDate === 'function'
                                ? date.toDate().toISOString()
                                : (typeof date === 'string' ? date : new Date().toISOString());
                            
                            return {
                                ...data,
                                date: serializedDate
                            } as Cart;
                        })
                        .filter(order => order.oid !== undefined && order.oid !== null);
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

export const {
    useGetProductsQuery,
    useGetCouponsQuery,
    useGetUserQuery,
    useGetOrdersQuery,
    useGetAllOrdersQuery,
} = firestoreApi;