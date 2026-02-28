"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import ProfileMenu from "@/components/profile/ProfileMenu";

export default function ProfilePage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/auth/login");
        }
    }, [user, loading, router]);

    if (loading || !user) return null;

    const userName = user?.full_name || "Guest User";
    const initialSection = searchParams.get("section") || "account";

    return <ProfileMenu userName={userName} initialSection={initialSection} />;
}
