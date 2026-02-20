import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Brain } from "lucide-react";

export const ProfileCompletionGuard = ({ children }: { children: React.ReactNode }) => {
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        checkProfile();
    }, [location.pathname]);

    const checkProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Allow access to auth page and public routes regardless of profile status
            if (!user) {
                setLoading(false);
                return;
            }

            const { data: profile } = await supabase
                .from("profiles")
                .select("github_url, resume_url, leetcode_id, codeforces_id")
                .eq("id", user.id)
                .single();

            if (profile) {
                const isComplete =
                    profile.github_url &&
                    profile.resume_url &&
                    profile.leetcode_id &&
                    profile.codeforces_id;

                // If profile is incomplete and user is not on profile page, redirect to profile
                if (!isComplete && location.pathname !== "/profile") {
                    navigate("/profile");
                }
            }
        } catch (error) {
            console.error("Error checking profile:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-pulse">
                    <Brain className="h-12 w-12 text-primary" />
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
