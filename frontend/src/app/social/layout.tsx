"use client";

import "./social-globals.css";
import SocialHeader from "@/components/social/SocialHeader";
import SocialSidebar from "@/components/social/SocialSidebar";
import SocialRightPanel from "@/components/social/SocialRightPanel";
import { usePathname } from "next/navigation";

export default function SocialLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Full-width pages (no sidebar layout) — e.g., community detail, create
    const isFullWidthPage =
        pathname.includes("/social/communities/create") ||
        (pathname.includes("/social/communities/") && pathname.split("/").length > 3);

    return (
        <div className="social-theme">
            <SocialHeader />

            {isFullWidthPage ? (
                <main className="max-w-6xl mx-auto px-4 md:px-8 py-6">
                    {children}
                </main>
            ) : (
                <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
                    <div className="flex gap-6">
                        {/* Left Sidebar */}
                        <aside className="hidden lg:block w-[280px] flex-shrink-0">
                            <div className="sticky top-[80px]">
                                <SocialSidebar />
                            </div>
                        </aside>

                        {/* Main Content */}
                        <main className="flex-1 min-w-0">
                            {children}
                        </main>

                        {/* Right Panel */}
                        <aside className="hidden xl:block w-[320px] flex-shrink-0">
                            <div className="sticky top-[80px]">
                                <SocialRightPanel />
                            </div>
                        </aside>
                    </div>
                </div>
            )}
        </div>
    );
}
