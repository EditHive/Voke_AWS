import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, ArrowLeft, MessageSquare, Users, TrendingUp, Heart, Share2, BookOpen } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "motion/react";

import { supabase } from "@/integrations/supabase/client";

const Community = () => {
    const navigate = useNavigate();

    const handleLogoClick = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            navigate("/dashboard");
        } else {
            navigate("/");
        }
    };

    const discussions = [
        {
            id: 1,
            title: "How to prepare for FAANG interviews in 3 months?",
            author: "Alex Johnson",
            category: "Interview Prep",
            replies: 24,
            likes: 156,
            views: 1200,
            isHot: true,
            timeAgo: "2 hours ago"
        },
        {
            id: 2,
            title: "Best resources for system design interviews",
            author: "Maria Garcia",
            category: "Resources",
            replies: 18,
            likes: 89,
            views: 850,
            isHot: true,
            timeAgo: "5 hours ago"
        },
        {
            id: 3,
            title: "Sharing my journey from bootcamp to senior engineer",
            author: "Chris Lee",
            category: "Success Stories",
            replies: 42,
            likes: 234,
            views: 2100,
            isHot: false,
            timeAgo: "1 day ago"
        },
        {
            id: 4,
            title: "Common mistakes in behavioral interviews",
            author: "Sarah Williams",
            category: "Tips & Tricks",
            replies: 31,
            likes: 178,
            views: 1500,
            isHot: false,
            timeAgo: "2 days ago"
        },
        {
            id: 5,
            title: "Negotiating your first tech job offer",
            author: "David Chen",
            category: "Career Advice",
            replies: 56,
            likes: 312,
            views: 3200,
            isHot: true,
            timeAgo: "3 days ago"
        }
    ];

    const stats = [
        { label: "Active Members", value: "12,500+", icon: Users, color: "from-blue-500 to-cyan-500" },
        { label: "Discussions", value: "8,400+", icon: MessageSquare, color: "from-violet-500 to-purple-500" },
        { label: "Success Stories", value: "2,100+", icon: TrendingUp, color: "from-emerald-500 to-green-500" },
        { label: "Resources Shared", value: "5,600+", icon: BookOpen, color: "from-amber-500 to-orange-500" }
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div className="flex items-center gap-2 cursor-pointer" onClick={handleLogoClick}>
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                                    <Mic className="w-6 h-6 text-white" />
                                </div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                                    Voke Community
                                </h1>
                            </div>
                        </div>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-12 px-4">
                <div className="container mx-auto max-w-6xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Join Our Thriving Community
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                            Connect with fellow developers, share experiences, and learn from each other's journey.
                        </p>
                        <Button size="lg" className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
                            <Users className="h-5 w-5 mr-2" />
                            Join the Community
                        </Button>
                    </motion.div>

                    {/* Stats Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
                    >
                        {stats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <Card key={index} className="border-border/50">
                                    <CardContent className="pt-6">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-10 flex items-center justify-center mb-3`}>
                                            <Icon className="h-6 w-6" style={{ color: `hsl(var(--primary))` }} />
                                        </div>
                                        <p className="text-2xl font-bold mb-1">{stat.value}</p>
                                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </motion.div>

                    {/* Discussions */}
                    <div className="mb-8 flex items-center justify-between">
                        <h3 className="text-2xl font-bold">Trending Discussions</h3>
                        <Button variant="outline">Start a Discussion</Button>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-4"
                    >
                        {discussions.map((discussion, index) => (
                            <motion.div
                                key={discussion.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + (index * 0.1) }}
                            >
                                <Card className="group hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                                    <CardHeader>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge variant="secondary">{discussion.category}</Badge>
                                                    {discussion.isHot && (
                                                        <Badge className="bg-gradient-to-r from-orange-500 to-red-500">
                                                            🔥 Hot
                                                        </Badge>
                                                    )}
                                                </div>
                                                <CardTitle className="text-xl group-hover:text-primary transition-colors mb-2">
                                                    {discussion.title}
                                                </CardTitle>
                                                <CardDescription>
                                                    Started by {discussion.author} • {discussion.timeAgo}
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <MessageSquare className="h-4 w-4" />
                                                <span>{discussion.replies} replies</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Heart className="h-4 w-4" />
                                                <span>{discussion.likes} likes</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="h-4 w-4" />
                                                <span>{discussion.views} views</span>
                                            </div>
                                            <Button variant="ghost" size="sm" className="ml-auto">
                                                <Share2 className="h-4 w-4 mr-2" />
                                                Share
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default Community;
