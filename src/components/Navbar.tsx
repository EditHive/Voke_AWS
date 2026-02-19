import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate } from "react-router-dom";
import { Mic } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export const Navbar = () => {
    const navigate = useNavigate();

    const handleLogoClick = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            navigate("/dashboard");
        } else {
            navigate("/");
        }
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl transition-colors duration-300">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo/Brand */}
                    <div
                        className="flex items-center gap-2 cursor-pointer group"
                        onClick={handleLogoClick}
                    >
                        <img
                            src="/images/voke_logo.png"
                            alt="Voke Logo"
                            className="w-10 h-10 object-contain group-hover:scale-110 transition-transform duration-300"
                        />
                        <span className="text-xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 dark:from-violet-400 dark:via-purple-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
                            Voke
                        </span>
                    </div>

                    {/* Center Navigation Links */}
                    <div className="hidden md:flex items-center gap-1">
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/learning-paths")}
                            className="text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors"
                        >
                            Learning Paths
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/video-interview")}
                            className="text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors"
                        >
                            Video Practice
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/job-market")}
                            className="text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors"
                        >
                            Job Market
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/voice-assistant")}
                            className="text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors"
                        >
                            AI Voice Agent
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/blogs")}
                            className="text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors"
                        >
                            Blogs
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/community")}
                            className="text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors"
                        >
                            Community
                        </Button>
                    </div>

                    {/* Right Side - Theme Toggle & CTA */}
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <Button
                            onClick={() => navigate("/auth")}
                            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 dark:from-violet-500 dark:to-purple-500 dark:hover:from-violet-600 dark:hover:to-purple-600 text-white shadow-lg shadow-violet-500/30 dark:shadow-violet-500/20 transition-all duration-300 hover:scale-105"
                        >
                            Get Started
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    );
};
