import { Address } from "./address";

export interface OrderItem {
    id: string;
    book_id: string;
    book_title: string;
    book_author: string;
    book_cover_url: string;
    quantity: number;
    price: number;
    subtotal: number;
}

export interface Order {
    id: string;
    user_id: string;
    status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
    total_price: number;
    shipping_cost: number;
    subtotal: number;
    created_at: string;
    items: OrderItem[];
    shipping_address?: Address;
    notes?: string;
}
