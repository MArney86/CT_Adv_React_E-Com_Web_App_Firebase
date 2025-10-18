import { CartItem } from "./CartItem";

export interface Carts {
    id: number;
    current: boolean;
    order_submitted: boolean;
    order_paid: boolean;
    order_fulfilled: boolean;
    order_delivered: boolean;
    uid: string;
    date: string;
    products: CartItem[];
}