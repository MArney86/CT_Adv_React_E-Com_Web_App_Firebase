import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { CartItem } from '../../interfaces/CartItem';
import { Cart } from '../../interfaces/Cart';
import { updateOrderDetails, addOrder } from './OrdersSlice';
import { updateUserDetails } from './UserSlice';
import { doc, updateDoc, setDoc, collection, getDocs, query, where, getDoc } from 'firebase/firestore';
import { db } from '../../components/FirebaseConfig';

// Async thunk for adding items that also manages order creation/updating
export const addItem = createAsyncThunk<
    { item: CartItem; oid: number },
    { item: CartItem; uid: string },
    { 
        state: { 
            cart: CartState; 
            orders: { userOrders: Cart[] } 
        } 
    }
>(
    'cart/addItem',
    async ({ item, uid }, { dispatch, getState }) => {
        console.log('CartSlice: addItem called with item =', item, 'uid =', uid);
        const state = getState();
        const cartState = state.cart;
        const ordersState = state.orders.userOrders;
        
        console.log('CartSlice: Current cartState.oid =', cartState.oid);
        console.log('CartSlice: Current ordersState.length =', ordersState.length);
        
        // Generate unique ID for the cart item
        const newItem = { ...item, ciid: Date.now() };
        
        // Check if cart already has an order ID
        if (cartState.oid !== null) {
            // Find the existing order
            const existingOrder = ordersState.find((order: Cart) => order.oid === cartState.oid);
            
            if (existingOrder) {
                // Update the existing order with new/updated items
                let updatedProducts = [...existingOrder.products];
                
                // Check if item already exists in the order
                const existingItemIndex = updatedProducts.findIndex(p => p.prodId === newItem.prodId);
                
                if (existingItemIndex !== -1) {
                    // Update quantity of existing item
                    updatedProducts[existingItemIndex].quantity += newItem.quantity;
                } else {
                    // Add new item
                    updatedProducts.push(newItem);
                }
                
                // Update both Firestore cart and order
                try {
                    // Update cart in Firestore - save entire cart as a document using oid as document ID
                    const cartRef = doc(db, 'carts', cartState.oid.toString());
                    const updatedCart: Cart = {
                        ...existingOrder,
                        products: updatedProducts
                    };
                    await setDoc(cartRef, updatedCart);
                    
                    // Update order in Firebase
                    await dispatch(updateOrderDetails({ 
                        oid: cartState.oid, 
                        details: { products: updatedProducts } 
                    }));
                } catch (error) {
                    throw new Error('Failed to update cart in Firestore');
                }
                
                return { item: newItem, oid: cartState.oid };
            }
        }
        
        // Create new order if no existing order or cart was empty
        const newOrderId = Date.now(); // Generate unique order ID
        console.log('CartSlice: Creating new order with oid =', newOrderId);
        const newOrder: Cart = {
            oid: newOrderId,
            current: true,
            order_submitted: false,
            order_paid: false,
            order_fulfilled: false,
            order_delivered: false,
            uid: uid,
            date: new Date().toISOString(),
            products: [newItem],
            coupons: []
        };
        
        try {
            // Add cart to Firestore as a complete Cart document using oid as document ID
            const cartRef = doc(db, 'carts', newOrderId.toString());
            await setDoc(cartRef, newOrder);
            
            // Add order to Firebase and Redux
            await dispatch(addOrder(newOrder));
            
            // Get user document and add oid to orders array at index 0
            const userRef = doc(db, 'users', uid);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const currentOrders = userData.orders || [];
                // Add new order at the beginning of the array
                const updatedOrders = [newOrderId, ...currentOrders];
                
                await dispatch(updateUserDetails({ 
                    uid: uid, 
                    details: { orders: updatedOrders } 
                }));
            }
            
            console.log('CartSlice: Order added, returning item with oid =', newOrderId);
        } catch (error) {
            console.error('CartSlice: Error creating cart:', error);
            throw new Error('Failed to create cart in Firestore');
        }
        
        return { item: newItem, oid: newOrderId };
    }
);

// Async thunk for removing items that also updates the order
export const removeItem = createAsyncThunk<
    number,
    { ciid: number; uid: string },
    { state: { cart: CartState; orders: { userOrders: Cart[] } } }
>(
    'cart/removeItem',
    async ({ ciid, uid }, { dispatch, getState }) => {
        const state = getState();
        const cartState = state.cart;
        const ordersState = state.orders.userOrders;
        
        try {
            if (cartState.oid !== null) {
                // Find the existing order
                const existingOrder = ordersState.find((order: Cart) => order.oid === cartState.oid);
                
                if (existingOrder) {
                    // Remove item from products array
                    const updatedProducts = existingOrder.products.filter(item => item.ciid !== ciid);
                    
                    // Update cart in Firestore using oid as document ID
                    const cartRef = doc(db, 'carts', cartState.oid.toString());
                    const updatedCart: Cart = {
                        ...existingOrder,
                        products: updatedProducts
                    };
                    await setDoc(cartRef, updatedCart);
                    
                    // Update order
                    await dispatch(updateOrderDetails({ 
                        oid: cartState.oid, 
                        details: { products: updatedProducts } 
                    }));
                }
            }
        } catch (error) {
            throw new Error('Failed to remove item from Firestore');
        }
        
        return ciid;
    }
);

// Async thunk for updating item quantity that also updates the order
export const updateItemQuantity = createAsyncThunk<
    { id: number; quantity: number },
    { id: number; quantity: number; uid: string },
    { state: { cart: CartState; orders: { userOrders: Cart[] } } }
>(
    'cart/updateItemQuantity',
    async ({ id, quantity, uid }, { dispatch, getState }) => {
        const state = getState();
        const cartState = state.cart;
        const ordersState = state.orders.userOrders;
        
        if (quantity < 1) {
            throw new Error('Quantity must be at least 1');
        }
        
        try {
            if (cartState.oid !== null) {
                // Find the existing order
                const existingOrder = ordersState.find((order: Cart) => order.oid === cartState.oid);
                
                if (existingOrder) {
                    // Update the item quantity in products array
                    const updatedProducts = existingOrder.products.map(item => 
                        item.ciid === id ? { ...item, quantity } : item
                    );
                    
                    // Update cart in Firestore using oid as document ID
                    const cartRef = doc(db, 'carts', cartState.oid.toString());
                    const updatedCart: Cart = {
                        ...existingOrder,
                        products: updatedProducts
                    };
                    await setDoc(cartRef, updatedCart);
                    
                    // Update order
                    await dispatch(updateOrderDetails({ 
                        oid: cartState.oid, 
                        details: { products: updatedProducts } 
                    }));
                }
            }
        } catch (error) {
            throw new Error('Failed to update item quantity in Firestore');
        }
        
        return { id, quantity };
    }
);

// Async thunk for clearing the cart that also updates Firestore
export const clearCart = createAsyncThunk<
    void,
    string, // uid
    { state: { cart: CartState; orders: { userOrders: Cart[] } } }
>(
    'cart/clearCart',
    async (uid, { getState, dispatch }) => {
        const state = getState();
        const cartState = state.cart;
        
        try {
            if (cartState.oid !== null) {
                // Mark all products in the order as deleted, but keep the order structure
                const updatedItems: CartItem[] = [];
                
                // Update the order in Firestore to mark all products as deleted
                await dispatch(updateOrderDetails({ 
                    oid: cartState.oid, 
                    details: { products: updatedItems } 
                }));
            }
        } catch (error) {
            throw new Error('Failed to clear cart in Firestore');
        }
    }
);

export interface CartState {
    items: CartItem[];
    oid: number | null;
    status: 'idle' | 'loading' | 'error';
    error: string | null;
}

const initialState: CartState = {
    items: [],
    oid: null,
    status: 'idle',
    error: null,
};

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        setOrderId: (state, action: PayloadAction<number>) => {
            state.oid = action.payload;
        },
        loadCartFromOrder: (state, action: PayloadAction<{ items: CartItem[]; oid: number }>) => {
            console.log('CartSlice: loadCartFromOrder called with items =', action.payload.items, 'oid =', action.payload.oid);
            state.items = action.payload.items;
            state.oid = action.payload.oid;
            state.status = 'idle';
            state.error = null;
            console.log('CartSlice: Cart loaded, state.items.length =', state.items.length);
        },
        resetCart: (state) => {
            state.items = [];
            state.oid = null;
            state.status = 'idle';
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(addItem.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(addItem.fulfilled, (state, action) => {
                console.log('CartSlice: addItem.fulfilled, payload =', action.payload);
                state.status = 'idle';
                state.error = null;
                
                // Update the cart with the new/updated item
                const { item, oid } = action.payload;
                
                console.log('CartSlice: Adding item to cart, item =', item, 'current oid =', state.oid);
                
                // Set the order ID if it wasn't set before
                if (state.oid === null) {
                    state.oid = oid;
                    console.log('CartSlice: Set oid to', oid);
                }
                
                // Add or update the item in the cart
                const existingItemIndex = state.items.findIndex(i => i.prodId === item.prodId);
                
                if (existingItemIndex !== -1) {
                    // Update existing item quantity
                    state.items[existingItemIndex].quantity += item.quantity;
                    console.log('CartSlice: Updated existing item quantity');
                } else {
                    // Add new item
                    state.items.push(item);
                    console.log('CartSlice: Added new item, cart now has', state.items.length, 'items');
                }
            })
            .addCase(addItem.rejected, (state, action) => {
                state.status = 'error';
                state.error = action.error.message || 'Failed to add item to cart';
            })
            .addCase(removeItem.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(removeItem.fulfilled, (state, action) => {
                state.status = 'idle';
                state.error = null;
                state.items = state.items.filter(item => item.ciid !== action.payload);
            })
            .addCase(removeItem.rejected, (state, action) => {
                state.status = 'error';
                state.error = action.error.message || 'Failed to remove item from cart';
            })
            .addCase(updateItemQuantity.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(updateItemQuantity.fulfilled, (state, action) => {
                state.status = 'idle';
                state.error = null;
                
                const { id, quantity } = action.payload;
                if (quantity >= 1) {
                    state.items = state.items.map(item => 
                        item.ciid === id ? { ...item, quantity } : item
                    );
                }
            })
            .addCase(updateItemQuantity.rejected, (state, action) => {
                state.status = 'error';
                state.error = action.error.message || 'Failed to update item quantity';
            })
            .addCase(clearCart.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(clearCart.fulfilled, (state) => {
                state.status = 'idle';
                state.error = null;
                state.items = []; // Only clear items
            })
            .addCase(clearCart.rejected, (state, action) => {
                state.status = 'error';
                state.error = action.error.message || 'Failed to clear cart';
            });
    },
});

export const { setOrderId, loadCartFromOrder, resetCart } = cartSlice.actions;

export default cartSlice.reducer;