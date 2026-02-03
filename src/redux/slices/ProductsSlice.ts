import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { collection, getDocs, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../components/FirebaseConfig';
import type { Product } from '../../interfaces/Product';

// Async thunk to fetch products from Firestore, or populate from FakeStoreAPI if empty
export const fetchProducts = createAsyncThunk<Product[]>(
    'products/fetchProducts',
    async (_, { dispatch }) => {
        try {
            // Try to get products from Firestore
            const productsCollection = collection(db, 'products');
            const productsSnapshot = await getDocs(productsCollection);
            
            console.log('ProductsSlice: Total docs from Firestore:', productsSnapshot.docs.length);
            console.log('ProductsSlice: Doc IDs:', productsSnapshot.docs.map(d => d.id));
            
            // Filter out the "Initialize" or "Initialization" document
            const products = productsSnapshot.docs
                .filter(doc => doc.id !== 'Initialize' && doc.id !== 'Initialization')
                .map(doc => {
                    const data = doc.data();
                    // Convert Firestore Timestamps to serializable format
                    // Check both naming conventions (removed_date and removedDate)
                    const removedDate = data.removed?.removed_date || data.removed?.removedDate;
                    let serializedRemovedDate: string | null = null;
                    
                    if (removedDate && typeof removedDate.toDate === 'function') {
                        // It's a Firestore Timestamp
                        serializedRemovedDate = removedDate.toDate().toISOString();
                    } else if (removedDate instanceof Date) {
                        // It's a Date object
                        serializedRemovedDate = removedDate.toISOString();
                    } else if (typeof removedDate === 'string') {
                        // Already a string
                        serializedRemovedDate = removedDate;
                    }
                    
                    return {
                        pid: data.pid,
                        title: data.title,
                        price: data.price,
                        description: data.description,
                        category: data.category,
                        image: data.image,
                        rating: data.rating,
                        isActive: data.isActive,
                        isDiscontinued: data.isDiscontinued,
                        removed: {
                            isRemoved: data.removed?.isRemoved ?? data.removed?.is_removed ?? false,
                            removedDate: serializedRemovedDate
                        },
                        creatorUid: data.creatorUid,
                        comment: data.comment
                    } as Product;
                });
            
            console.log('ProductsSlice: Filtered products count:', products.length);
            
            if (products.length > 0) {
                // Real products exist in Firestore, return them
                console.log('ProductsSlice: Returning', products.length, 'products from Firestore');
                return products;
            } else {
                // No real products in Firestore (only Initialization doc or empty), fetch from FakeStoreAPI
                console.log('ProductsSlice: No products in Firestore, fetching from FakeStoreAPI');
                const response = await fetch('https://fakestoreapi.com/products');
                if (!response.ok) {
                    throw new Error('Failed to fetch products from FakeStoreAPI');
                }
                const fetchedProducts: any[] = await response.json();
                
                // Add each product to Firestore
                const newProducts: Product[] = [];
                for (const product of fetchedProducts) {
                    const newProduct: Product = {
                        pid: product.id ?? 0,
                        title: product.title,
                        price: product.price,
                        description: product.description,
                        category: product.category,
                        image: product.image,
                        rating: product.rating,
                        isActive: true,
                        isDiscontinued: false,
                        removed: {
                            isRemoved: false,
                            removedDate: null,
                        },
                        creatorUid: "FAKESTOREAPI",
                        comment: "Autoloaded from FakeStoreAPI",
                    };
                    await dispatch(addProduct(newProduct));
                    newProducts.push(newProduct);
                }
                
                return newProducts;
            }
        } catch (error) {
            throw new Error('Failed to fetch products');
        }
    }
);

// Async thunk to add a product to Firestore
export const addProduct = createAsyncThunk<Product, Product>(
    'products/addProduct',
    async (product: Product, { dispatch }) => {
        try {
            // Use the product's pid as the document ID
            const productDocRef = doc(db, 'products', product.pid.toString());
            await setDoc(productDocRef, product);
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
        },
        
        // Action to set products from firestoreAPI
        setProducts: (state, action: PayloadAction<Product[]>) => {
            state.items = action.payload;
            state.status = 'idle';
            state.error = null;
        }
    },

    extraReducers: (builder) => {
        // Fetch products
        builder
            .addCase(fetchProducts.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.status = 'idle';
                state.items = action.payload;
                state.error = null;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.status = 'error';
                state.error = action.error.message || 'Failed to fetch products';
            });
        
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

export const { setStatus, setError, clearError, setProducts } = productsSlice.actions;

export default productsSlice.reducer;