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


            if (!user) {
                setLoading(false);
                return;
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
