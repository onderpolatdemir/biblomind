export interface User {
    id: number | string;
    email: string;
    full_name?: string;
    username?: string;
    bio?: string;
    avatar_url?: string;
    reading_goal?: number;
    is_active: boolean;
    is_admin: boolean;
    created_at?: string;
}

export interface UserProfileUpdate {
    full_name?: string;
    email?: string;
    password?: string;
    username?: string;
    bio?: string;
    reading_goal?: number;
}
