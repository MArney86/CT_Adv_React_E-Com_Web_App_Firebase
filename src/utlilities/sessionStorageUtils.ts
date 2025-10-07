import { type CartState } from '../redux/slices/CartSlice';

export const saveCartToStorage = (cartState: CartState) => {
    try {
        sessionStorage.setItem('cart', JSON.stringify(cartState));
    } catch (error) {
        console.error('Failed to save cart to session storage:', error);
    }
};

export const loadCartFromStorage = (): CartState | null => {
    try {
        const savedCart = sessionStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : null;
    } catch (error) {
        console.error('Failed to load cart from session storage:', error);
        return null;
    }
};
