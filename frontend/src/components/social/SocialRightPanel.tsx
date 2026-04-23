"use client";

import { MOCK_RECENT_ACTIVITY } from "@/lib/social-mock-data";
import { Activity } from "lucide-react";

export default function SocialRightPanel() {
    return (
        <div className="social-card p-4">
            <h3
                className="font-bold text-sm mb-4 flex items-center gap-2"
                style={{ color: "var(--social-text)" }}
            >
                <Activity size={14} style={{ color: "var(--social-accent)" }} />
                Recent Activity
            </h3>

            <div className="flex flex-col gap-1">
                {MOCK_RECENT_ACTIVITY.map((activity) => (
                    <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 rounded-xl transition-all"
                        style={{ borderBottom: "1px solid var(--social-border)" }}
                    >
                        {/* Avatar */}
                        <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{
                                backgroundColor: "var(--social-card-elevated)",
                                color: "var(--social-text)",
                            }}
                        >
                            {activity.user_name.charAt(0)}
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                            <p className="text-xs leading-relaxed">
                                <span
                                    className="font-bold"
                                    style={{ color: "var(--social-text)" }}
                                >
                                    {activity.user_name}
                                </span>{" "}
                                <span style={{ color: "var(--social-text-muted)" }}>
                                    {activity.action}
                                </span>{" "}
                                <span
                                    className="font-semibold"
                                    style={{ color: "var(--social-text-secondary)" }}
                                >
                                    {activity.target}
                                </span>
                            </p>
                            <p
                                className="text-[10px] mt-0.5"
                                style={{ color: "var(--social-accent)" }}
                            >
                                {activity.timestamp}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
