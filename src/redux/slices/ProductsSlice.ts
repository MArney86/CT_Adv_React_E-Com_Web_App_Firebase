import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../components/FirebaseConfig';
import { firestoreApi } from '../services/firestoreApi';
import type { Product } from '../../interfaces/Product';
import { useSelector } from 'react-redux';

// Async thunk to add a product to Firestore
export const addProduct = createAsyncThunk<Product, Product>(
    'products/addProduct',
    async (product: Product, { dispatch }) => {
        const productsCollection = collection(db, 'products');
        try {
            useSelector((state: any) => state.products);
            const docRef = await addDoc(productsCollection, product);

            return product;
        } catch (error) {
            throw new Error('Failed to add product to db');
        }
    }
);

// Async thunk to remove a product from Firestore
export const removeProductFromFirestore = createAsyncThunk(
    'products/removeProduct',
    async (productId: number) => {
        try {
            await deleteDoc(doc(db, 'products', productId.toString()));
            return productId;
        } catch (error) {
            throw new Error('Failed to remove product');
        }
    }
);

// Async thunk to update product details in Firestore
export const updateProductDetails = createAsyncThunk(
    'products/updateProductDetails',
    async ({ pid, details} : { pid: number; details: Partial<Product>}) => {
        const productRef = doc(db, 'products', pid.toString());
        try {
            await updateDoc(productRef, details);
            return { pid, details };
        } catch (error) {
            throw new Error('Failed to update product details');
        }
    }
);

export interface ProductsState {
    items: Product[];
    status: 'idle' | 'loading' | 'error';
    error: string | null;
}

const initialState: ProductsState = {
    items: [],
    status: 'idle',
    error: null
};

const productsSlice = createSlice({
    name: 'products',
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
        // Add product
        builder
            .addCase(addProduct.pending, (state) => {
                state.status = 'loading';
            })

            .addCase(addProduct.fulfilled, (state, action) => {
                state.status = 'idle';
                if (action.payload) {
                    state.items.push(action.payload);
                } else {
                    state.status = 'error';
                    state.error = 'Failed to add product: no payload returned';
                }
            })
            
            .addCase(addProduct.rejected, (state, action) => {
                state.status = 'error';
                state.error = action.error.message || 'Failed to add product';
            });

        // Remove product
        builder
            .addCase(removeProductFromFirestore.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(removeProductFromFirestore.fulfilled, (state, action) => {
                state.status = 'idle';
                state.items = state.items.filter(item => item.pid !== action.payload);
                state.error = null;
            })
            .addCase(removeProductFromFirestore.rejected, (state, action) => {
                state.status = 'error';
                state.error = action.error.message || 'Failed to remove product';
            })
            
        // Update product details
        builder
            .addCase(updateProductDetails.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(updateProductDetails.fulfilled, (state, action) => {
                state.status = 'idle';
                const product = state.items.find(item => item.pid === action.payload.pid);
                if (product) {
                    const index = state.items.findIndex(item => item.pid === action.payload.pid);
                    state.items[index] = { ...product, ...action.payload.details };
                }
                state.error = null;
            })
            .addCase(updateProductDetails.rejected, (state, action) => {
                state.status = 'error';
                state.error = action.error.message || 'Failed to update product details';
            });
    }
});

export const { setStatus, setError, clearError } = productsSlice.actions;

export default productsSlice.reducer;
