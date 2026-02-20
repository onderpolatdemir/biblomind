export interface Address {
    id: string;
    user_id: string;
    name: string;
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    created_at?: string;
    updated_at?: string;
}

export interface AddressCreate {
    name: string;
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country?: string;
}
