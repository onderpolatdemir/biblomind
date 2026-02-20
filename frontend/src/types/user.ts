export interface User {
    id: number | string;
    email: string;
    full_name?: string;
    is_active: boolean;
    is_admin: boolean;
    created_at?: string;
}

export interface UserProfileUpdate {
    full_name?: string;
    email?: string;
    password?: string;
}
