import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Mic, ArrowLeft, Search, Calendar, User, Clock, TrendingUp } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "motion/react";

import { supabase } from "@/integrations/supabase/client";

const Blog = () => {
    const navigate = useNavigate();

    const handleLogoClick = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            navigate("/dashboard");
        } else {
            navigate("/");
        }
    };

    const blogPosts = [
        {
            id: 1,
            title: "10 Essential Tips for Acing Your Technical Interview",
            excerpt: "Master the art of technical interviews with these proven strategies from industry experts.",
            category: "Interview Tips",
            author: "Sarah Chen",
            date: "Nov 20, 2024",
            readTime: "5 min read",
            image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop"
        },
        {
            id: 2,
            title: "How AI is Transforming Interview Preparation",
            excerpt: "Discover how artificial intelligence is revolutionizing the way candidates prepare for job interviews.",
            category: "Technology",
            author: "Michael Park",
            date: "Nov 18, 2024",
            readTime: "7 min read",
            image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop"
        },
        {
            id: 3,
            title: "Behavioral Interview Questions: A Complete Guide",
            excerpt: "Learn how to structure your answers using the STAR method and impress your interviewers.",
            category: "Career Advice",
            author: "Emily Rodriguez",
            date: "Nov 15, 2024",
            readTime: "6 min read",
            image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop"
        },
        {
            id: 4,
            title: "The Ultimate System Design Interview Checklist",
            excerpt: "Everything you need to know to excel in system design interviews at top tech companies.",
            category: "Technical",
            author: "David Kim",
            date: "Nov 12, 2024",
            readTime: "10 min read",
            image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=400&fit=crop"
        },
        {
            id: 5,
            title: "Remote Interview Best Practices in 2024",
            excerpt: "Navigate virtual interviews with confidence using these expert tips and tools.",
            category: "Remote Work",
            author: "Lisa Thompson",
            date: "Nov 10, 2024",
            readTime: "4 min read",
            image: "https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=800&h=400&fit=crop"
        },
        {
            id: 6,
            title: "Building Your Personal Brand as a Developer",
            excerpt: "Stand out in the job market by creating a strong professional presence online.",
            category: "Career Growth",
            author: "James Wilson",
            date: "Nov 8, 2024",
            readTime: "8 min read",
            image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop"
        }
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
                                <img 
                                    src="/images/voke_logo.png" 
                                    alt="Voke Logo" 
                                    className="w-10 h-10 object-contain" 
                                />
                                <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                                    Voke Blog
                                </h1>
                            </div>
                        </div>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-16 px-4">
                <div className="container mx-auto max-w-6xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Interview Insights & Career Tips
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Expert advice, industry trends, and practical guides to help you succeed in your career journey.
                        </p>
                    </motion.div>

                    {/* Search Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="max-w-2xl mx-auto mb-12"
                    >
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Search articles..."
                                className="pl-12 h-12 bg-card border-border/50"
                            />
                        </div>
                    </motion.div>

                    {/* Blog Posts Grid */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {blogPosts.map((post, index) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + (index * 0.1) }}
                            >
                                <Card className="group overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full flex flex-col">
                                    <div className="relative overflow-hidden h-48">
                                        <img
                                            src={post.image}
                                            alt={post.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <div className="absolute top-4 left-4">
                                            <Badge className="bg-primary/90 backdrop-blur-sm">
                                                {post.category}
                                            </Badge>
                                        </div>
                                    </div>
                                    <CardHeader className="flex-1">
                                        <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                                            {post.title}
                                        </CardTitle>
                                        <CardDescription className="line-clamp-2 mt-2">
                                            {post.excerpt}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                <span>{post.author}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4" />
                                                <span>{post.readTime}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            <span>{post.date}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Load More Button */}
                    <div className="text-center mt-12">
                        <Button size="lg" variant="outline">
                            Load More Articles
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Blog;
