import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../components/FirebaseConfig';
import { Product } from '../../interfaces/Product';
import { CouponCode } from '../../interfaces/CouponCode';
import { User } from '../../interfaces/User';
import { Cart } from '../../interfaces/Cart';
import { CartItem } from '../../interfaces/CartItem';

export const firestoreApi = createApi({
    reducerPath: 'firestoreApi',
    baseQuery: fakeBaseQuery(),
    tagTypes: ['Products', 'Coupons', 'Users', 'Orders', 'CartItems'],
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
                    console.log('firestoreApi: Fetching carts for userId =', userId);
                    // Fetch all carts from the carts collection
                    const cartsCollection = collection(db, 'carts');
                    const cartsSnapshot = await getDocs(cartsCollection);
                    
                    if (cartsSnapshot.empty) {
                        console.log('firestoreApi: No carts found');
                        return { data: [] };
                    }
                    
                    // Filter for this user's current cart (current: true)
                    const carts: Cart[] = cartsSnapshot.docs
                        .filter(doc => {
                            const data = doc.data();
                            // Filter out initialization documents and get only this user's carts
                            return doc.id !== 'Initialization' && 
                                   doc.id !== 'Initialize' && 
                                   data.uid === userId &&
                                   data.current === true; // Only get current cart
                        })
                        .map(doc => {
                            const data = doc.data();
                            // Convert Firestore Timestamp to ISO string
                            const date = data.date;
                            const serializedDate = date && typeof date.toDate === 'function'
                                ? date.toDate().toISOString()
                                : (typeof date === 'string' ? date : new Date().toISOString());
                            
                            // Validate: if any order_* flag is true, current must be false
                            let current = data.current;
                            if (data.order_submitted || data.order_paid || data.order_fulfilled || data.order_delivered) {
                                current = false;
                            }
                            
                            return {
                                ...data,
                                date: serializedDate,
                                current: current
                            } as Cart;
                        });
                    
                    console.log('firestoreApi: Found carts, length =', carts.length);
                    return { data: carts };
                } catch (error) {
                    console.error('firestoreApi: Error fetching carts:', error);
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
                        .filter(doc => {
                            // Filter out initialization documents
                            return doc.id !== 'Initialization' && 
                                   doc.id !== 'Initialize' &&
                                   doc.data().oid !== undefined && 
                                   doc.data().oid !== null;
                        })
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
                        });
                    return { data: orders };
                } catch (error) {
                    return { error: { status: 'FETCH_ERROR', error: 'Failed to fetch orders' } };
                }
            },
            providesTags: ['Orders'],
        }),
        getCartItems: builder.query<CartItem[], string>({
            queryFn: async (userId: string) => {
                if (!userId || userId.trim() === '') {
                    return { error: { status: 'FETCH_ERROR', error: 'Invalid user ID' } };
                }
                
                try {
                    console.log('firestoreApi: Fetching cart items for userId =', userId);
                    const cartItemsCollection = collection(db, 'carts', userId, 'items');
                    const cartItemsSnapshot = await getDocs(cartItemsCollection);
                    
                    if (cartItemsSnapshot.empty) {
                        console.log('firestoreApi: No cart items found');
                        return { data: [] };
                    }
                    
                    const items: CartItem[] = cartItemsSnapshot.docs
                        .filter(doc => !doc.data().deleted) // Filter out soft-deleted items
                        .map(doc => doc.data() as CartItem);
                    
                    console.log('firestoreApi: Found cart items, length =', items.length);
                    return { data: items };
                } catch (error) {
                    console.error('firestoreApi: Error fetching cart items:', error);
                    return { error: { status: 'FETCH_ERROR', error: 'Failed to fetch cart items' } };
                }
            },
            providesTags: ['CartItems'],
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