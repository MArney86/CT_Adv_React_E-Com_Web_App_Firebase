import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { setDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { User } from '../../interfaces/User';
import { db } from '../../components/FirebaseConfig';

export const getUid = createAsyncThunk<string, void, { state: { user: UserState } }>(
    'users/getUid',
    async (_, { getState }) => {
        const state = getState();
        return state.user.currentUser?.uid || "";
    }
);

export const addUser = createAsyncThunk<User, User>(
    'users/addUser',
    async (user: User, { rejectWithValue }) => {
        try {
            // Use the user's uid as the document ID
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, user);
            return user;
        } catch (error: unknown) {
            console.error('Error adding user to Firebase:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to add user to database';
            return rejectWithValue(errorMessage);
        }
    }
);

// Async thunk to remove a user from Firestore
export const removeUserFromFirestore = createAsyncThunk(
    'users/removeUser',
    async (userId: string) => {
        try {
            await deleteDoc(doc(db, 'users', userId));
            return userId;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to remove user: ${errorMessage}`);
        }
    }
);

// Async thunk to update user details in Firestore
export const updateUserDetails = createAsyncThunk(
    'users/updateUserDetails',
    async ({ uid, details} : { uid: string; details: Partial<User>}) => {
        const userRef = doc(db, 'users', uid);
        try {
            await updateDoc(userRef, details);
            return { uid, details };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to update user details: ${errorMessage}`);
        }
    }
);

export interface UserState {
    currentUser: User | null;
    status: 'idle' | 'loading' | 'error';
    error: string | null;
}

const initialState: UserState = {
    currentUser: null,
    status: 'idle',
    error: null
};

const userSlice = createSlice({
    name: 'user',
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

            setCurrentUser: (state, action: PayloadAction<User | null>) => {
                state.currentUser = action.payload;
                state.status = 'idle';
                state.error = null;
            },

            userReset: (state) => {
                state.currentUser = null;
                state.status = 'idle';
                state.error = null;
            },
        },
    
        extraReducers: (builder) => {
            // Add product
            builder
                .addCase(addUser.pending, (state) => {
                    state.status = 'loading';
                })
    
                .addCase(addUser.fulfilled, (state, action) => {
                    state.status = 'idle';
                    if (action.payload) {
                        state.currentUser = action.payload;
                    } else {
                        state.status = 'error';
                        state.error = 'Failed to add user: no payload returned';
                    }
                })
                
                .addCase(addUser.rejected, (state, action) => {
                    state.status = 'error';
                    state.error = action.error.message || 'Failed to add product';
                });
    
            // Remove user
            builder
                .addCase(removeUserFromFirestore.pending, (state) => {
                    state.status = 'loading';
                })
                .addCase(removeUserFromFirestore.fulfilled, (state, action) => {
                    state.status = 'idle';
                    if (state.currentUser?.uid === action.payload) {
                        state.currentUser = null;
                    }
                })
                .addCase(removeUserFromFirestore.rejected, (state, action) => {
                    state.status = 'error';
                    state.error = action.error.message || 'Failed to remove user';
                })

            // Update user details
            builder
                .addCase(updateUserDetails.pending, (state) => {
                    state.status = 'loading';
                })
                .addCase(updateUserDetails.fulfilled, (state, action) => {
                    state.status = 'idle';
                    if (state.currentUser?.uid === action.payload.uid) {
                        state.currentUser = { ...state.currentUser, ...action.payload.details };
                    }
                })
                .addCase(updateUserDetails.rejected, (state, action) => {
                    state.status = 'error';
                    state.error = action.error.message || 'Failed to update user details';
                });

            // Get UID
            builder
                .addCase(getUid.pending, (state) => {
                    state.status = 'loading';
                })
                .addCase(getUid.fulfilled, (state) => {
                    state.status = 'idle';
                })
                .addCase(getUid.rejected, (state, action) => {
                    state.status = 'error';
                    state.error = action.error.message || 'Failed to get UID';
                });
        }
    });

export const { setStatus, setError, clearError, setCurrentUser, userReset } = userSlice.actions;

export default userSlice.reducer;