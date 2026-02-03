import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { setDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Cart } from '../../interfaces/Cart';
import { db } from '../../components/FirebaseConfig';

export const addOrder = createAsyncThunk<Cart, Cart>(
    'orders/addOrder',
    async (order: Cart) => {
        
        try {
            // Use the order's oid as the document ID in the carts collection
            const orderDocRef = doc(db, 'carts', order.oid.toString());
            await setDoc(orderDocRef, order);
            return order;
        } catch (error) {
            throw new Error('Failed to add order to db');
        }
    }
);

// Async thunk to remove an order from Firestore
export const removeOrder = createAsyncThunk<
    number,
    number,
    { state: { orders: OrdersState } }
>(
    'orders/removeOrder',
    async (orderId: number, { getState }) => {
        const state = getState();
        if (state.orders.userOrders.find((order: Cart) => order.oid === orderId) === undefined) {
            throw new Error('Order not found in state');
        }
        try {
            
            await deleteDoc(doc(db, 'carts', orderId.toString()));
            return orderId;
        } catch (error) {
            throw new Error('Failed to remove order');
        }
    }
);

// Async thunk to update order details in Firestore
export const updateOrderDetails = createAsyncThunk(
    'orders/updateOrderDetails',
    async ({ oid, details} : { oid: number; details: Partial<Cart>}) => {
        const orderRef = doc(db, 'carts', oid.toString());
        try {
            await updateDoc(orderRef, details);
            return { oid, details };
        } catch (error) {
            throw new Error('Failed to update order details');
        }
    }
);

export interface OrdersState {
    userOrders: Cart[];
    status: 'idle' | 'loading' | 'error';
    error: string | null;
}

const initialState: OrdersState = {
    userOrders: [],
    status: 'idle',
    error: null
};

const ordersSlice = createSlice({
    name: 'orders',
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

            setUserOrders: (state, action: PayloadAction<Cart[]>) => {
                state.userOrders = action.payload;
                state.status = 'idle';
                state.error = null;
            },
        },
    
        extraReducers: (builder) => {
            //Add order
            builder
                .addCase(addOrder.pending, (state) => {
                    state.status = 'loading';
                })

                .addCase(addOrder.fulfilled, (state, action) => {
                    state.status = 'idle';
                    if (action.payload) {
                        state.userOrders.push(action.payload);
                    } else {
                        state.status = 'error';
                        state.error = 'Failed to add order: no payload returned';
                    }
                })

                .addCase(addOrder.rejected, (state, action) => {
                    state.status = 'error';
                    state.error = action.error.message || 'Failed to add order';
                });

            // Remove order
            builder
                .addCase(removeOrder.pending, (state) => {
                    state.status = 'loading';
                })
                .addCase(removeOrder.fulfilled, (state, action) => {
                    state.status = 'idle';
                    state.userOrders = state.userOrders.filter(order => order.oid !== action.payload);
                })
                .addCase(removeOrder.rejected, (state, action) => {
                    state.status = 'error';
                    state.error = action.error.message || 'Failed to remove order';
                })

            // Update order details
            builder
                .addCase(updateOrderDetails.pending, (state) => {
                    state.status = 'loading';
                })
                .addCase(updateOrderDetails.fulfilled, (state, action) => {
                    state.status = 'idle';
                    const index = state.userOrders.findIndex(order => order.oid === action.payload.oid);
                    if (index !== -1) {
                        state.userOrders[index] = { ...state.userOrders[index], ...action.payload.details };
                    }
                })
                .addCase(updateOrderDetails.rejected, (state, action) => {
                    state.status = 'error';
                    state.error = action.error.message || 'Failed to update order details';
                });
        }
    });

export const { setStatus, setError, clearError, setUserOrders } = ordersSlice.actions;

export default ordersSlice.reducer