"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import api from "@/lib/api";

import { User } from "@/types/user";

type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    login: () => { },
    logout: () => { },
});

// Pages that do not require authentication
const PUBLIC_PATHS = ['/', '/auth/login', '/auth/register'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    // 1. Check for token on mount
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // Verify token and get user info
                    const response = await api.get('/auth/me');
                    setUser(response.data);
                } catch (error) {
                    console.error("Token invalid or expired", error);
                    localStorage.removeItem('token');
                    setUser(null);
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    // 2. Protect Routes
    useEffect(() => {
        if (isLoading) return;

        const isPublicPath = PUBLIC_PATHS.includes(pathname);

        if (!user && !isPublicPath) {
            // Not logged in -> Trying to access private route -> Redirect to Landing
            router.replace('/');
        } else if (user && isPublicPath) {
            // Logged in -> Trying to access public route (Landing/Login) -> Redirect to Home
            router.replace('/home');
        }
    }, [user, isLoading, pathname, router]);

    const login = (token: string, userData: User) => {
        localStorage.setItem('token', token);
        setUser(userData);
        router.replace('/home');
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        router.replace('/auth/login');
    };

    if (isLoading) {
        // You could return a global loading spinner here
        return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;
    }

    const isPublicPath = PUBLIC_PATHS.includes(pathname);

    // Security Check: Prevent rendering if route logic mismatches auth state
    if (!user && !isPublicPath) return null; // or loading spinner
    if (user && isPublicPath) return null; // or loading spinner

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
