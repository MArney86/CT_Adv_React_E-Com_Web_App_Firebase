import { CartItem } from "./CartItem";

export interface Cart {
    oid: number | null;
    current: boolean;
    order_submitted: boolean;
    order_paid: boolean;
    order_fulfilled: boolean;
    order_delivered: boolean;
    uid: string;
    date: string;
    products: CartItem[];
}