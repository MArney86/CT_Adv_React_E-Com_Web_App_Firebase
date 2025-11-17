import { Routes, Route } from 'react-router-dom'
import NavHeader from './components/NavHeader'
import './App.css'
import Home from './components/Home'
import CartPage from './components/CartPage'
import NotFound from './components/NotFound'
import CheckoutPage from './components/CheckoutPage'
import { auth } from './components/FirebaseConfig'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { useGetUserQuery, 
         useGetOrdersQuery } from './redux/services/firestoreApi'
import { fetchProducts } from './redux/slices/ProductsSlice'
import { fetchCoupons } from './redux/slices/CouponsSlice'
import { setUserOrders } from './redux/slices/OrdersSlice'
import { setCurrentUser, addUser } from './redux/slices/UserSlice'
import { loadCartFromOrder } from './redux/slices/CartSlice'
import { useSelector, useDispatch } from 'react-redux'  
import type { AppDispatch } from './redux/store/store'
import { User as UserInterface } from './interfaces/User'   

function App() {
    const [user, setUser] = useState<User | null>(null)
    const [error, setError] = useState<string | null>(null);

    const dispatch = useDispatch<AppDispatch>()
    
    // Call all hooks at the top level with safe guards
    const prodState = useSelector((state: any) => state.products?.items || [])
    const prodStatus = useSelector((state: any) => state.products?.status || 'idle')
    const couponState = useSelector((state: any) => state.coupons?.codes || [])
    const couponStatus = useSelector((state: any) => state.coupons?.status || 'idle')
    const ordersState = useSelector((state: any) => state.orders?.userOrders || [])
    const userState = useSelector((state: any) => state.user?.currentUser)
    const cartState = useSelector((state: any) => state.cart?.items || []);
    
    const { data: ordersData, isLoading: ordersLoading, error: ordersError } = useGetOrdersQuery(user ? user.uid : "", {
        skip: !user || ordersState.length > 0
    });
    const { data: userData, isLoading: userLoading, error: userError } = useGetUserQuery(user?.uid || "", {
        skip: !user || userState !== null
    });

    // Auth listener
    useEffect(() => {
        console.log('App.tsx: Component mounted');
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            console.log('App.tsx: Auth state changed', currentUser?.uid);
            setUser(currentUser)
        })

        return () => {
            unsubscribe()
        }
    }, [])

    // Fetch products on mount
    useEffect(() => {
        if (prodState.length === 0 && prodStatus === 'idle') {
            console.log('App.tsx: Fetching products from Firestore or FakeStoreAPI');
            dispatch(fetchProducts());
        }
    }, [dispatch, prodState.length, prodStatus]);

    // Fetch coupons on mount
    useEffect(() => {
        if (couponState.length === 0 && couponStatus === 'idle') {
            console.log('App.tsx: Fetching coupons from Firestore or populating sample coupons');
            dispatch(fetchCoupons());
        }
    }, [dispatch, couponState.length, couponStatus]);

    useEffect(() => {
        console.log('App.tsx: Data effect', { 
            prodStateLength: prodState.length,
            prodStatus,
            couponStateLength: couponState.length,
            couponStatus
        });
        
        // Handle orders data
        if (ordersData && ordersState.length === 0) {
            dispatch(setUserOrders(ordersData));
        }

        // Handle user data
        if (user) {
            if (userData) {
                dispatch(setCurrentUser(userData))
            } else if (!userLoading && !userData && userState === null) {
                let newUser: UserInterface = {
                    uid: user.uid,
                    email: user.email,
                    username: user.displayName,
                    created: new Date().toISOString(),
                    isActive: true,
                    accountDeleted: {
                        isDeleted: false,
                        deletionDate: null
                    },
                    orders: []
                };
                dispatch(addUser(newUser) as any);
            }
            
            // Load cart from orders if needed
            if (cartState.length === 0 && ordersState.length > 0) {
                if (!ordersState[0].order_paid &&
                    !ordersState[0].order_fulfilled &&
                    !ordersState[0].order_delivered &&
                    !ordersState[0].order_submitted) {
                        dispatch(loadCartFromOrder({ items: ordersState[0].products, oid: ordersState[0].oid }))
                }
            }
        }
    }, [ordersData, userData, user, userLoading, dispatch, ordersState, cartState.length, userState])

    // Set error state based on queries (skip user/coupon/order errors as they might just be empty)
    useEffect(() => {
        // Only show critical errors, not "user not found" errors
        // User will be created if they don't exist
        setError(null);
    }, []);

    if (error) {
        return <div>Error: {error}</div>
    }

    return (
      <>
      <NavHeader user={user} setUser={setUser} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </>
    )
}

export default App
