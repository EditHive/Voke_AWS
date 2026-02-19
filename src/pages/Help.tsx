import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Mic, ArrowLeft, Search, HelpCircle, BookOpen, Video, MessageCircle, Mail } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "motion/react";

import { supabase } from "@/integrations/supabase/client";

const Help = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");

    const handleLogoClick = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            navigate("/dashboard");
        } else {
            navigate("/");
        }
    };

    const categories = [
        {
            title: "Getting Started",
            icon: BookOpen,
            color: "from-blue-500 to-cyan-500",
            faqs: [
                {
                    question: "How do I create an account?",
                    answer: "Click the 'Sign Up' button in the top right corner, enter your email and create a password. You'll receive a confirmation email to verify your account."
                },
                {
                    question: "What types of interviews can I practice?",
                    answer: "Voke offers multiple interview types including General, Technical, Behavioral, Resume-Based, and Role-Specific interviews. You can also practice with AI-powered adaptive interviews and peer mock interviews."
                },
                {
                    question: "Is Voke free to use?",
                    answer: "Voke offers a free tier with basic features. Premium features including unlimited AI interviews, detailed analytics, and personalized career guidance are available with a subscription."
                }
            ]
        },
        {
            title: "Interview Practice",
            icon: Video,
            color: "from-violet-500 to-purple-500",
            faqs: [
                {
                    question: "How does the AI interviewer work?",
                    answer: "Our AI interviewer uses advanced natural language processing to conduct realistic interviews. It asks relevant questions based on your role and experience, and provides real-time feedback on your responses."
                },
                {
                    question: "Can I review my past interviews?",
                    answer: "Yes! All your interview sessions are saved in your dashboard. You can review transcripts, watch recordings, and see detailed feedback and scores for each session."
                },
                {
                    question: "How accurate is the AI feedback?",
                    answer: "Our AI is trained on thousands of successful interviews and is continuously improved. It provides detailed feedback on communication skills, technical accuracy, and overall performance with high accuracy."
                }
            ]
        },
        {
            title: "Features & Tools",
            icon: HelpCircle,
            color: "from-emerald-500 to-green-500",
            faqs: [
                {
                    question: "How do Learning Paths work?",
                    answer: "Learning Paths are structured curricula designed to help you master specific skills or prepare for particular roles. They include curated resources, practice exercises, and progress tracking."
                },
                {
                    question: "Can I practice with other users?",
                    answer: "Yes! The Peer Interviews feature allows you to schedule mock interviews with other users. You can take turns being the interviewer and interviewee, and rate each other's performance."
                }
            ]
        },
        {
            title: "Account & Billing",
            icon: MessageCircle,
            color: "from-amber-500 to-orange-500",
            faqs: [
                {
                    question: "How do I upgrade to premium?",
                    answer: "Go to your Profile page and click on 'Upgrade to Premium'. Choose your preferred plan and complete the payment process. Your premium features will be activated immediately."
                },
                {
                    question: "Can I cancel my subscription?",
                    answer: "Yes, you can cancel your subscription at any time from your Profile settings. You'll continue to have access to premium features until the end of your billing period."
                },
                {
                    question: "How do I update my profile information?",
                    answer: "Navigate to your Profile page by clicking the Settings icon in the header. You can update your personal information, upload your resume, and manage your account settings."
                }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div className="flex items-center gap-2 cursor-pointer" onClick={handleLogoClick}>
                                <img
                                    src="/images/voke_logo.png"
                                    alt="Voke Logo"
                                    className="w-10 h-10 object-contain"
                                />
                                <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                                    Help Center
                                </h1>
                            </div>
                        </div>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-12 px-4">
                <div className="container mx-auto max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            How can we help you?
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                            Find answers to common questions and learn how to make the most of Voke.
                        </p>

                        {/* Search Bar */}
                        <div className="relative max-w-2xl mx-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Search for help..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 h-14 bg-card border-border/50 text-lg"
                            />
                        </div>
                    </motion.div>

                    {/* FAQ Categories */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-8"
                    >
                        {categories.map((category, catIndex) => {
                            const Icon = category.icon;
                            return (
                                <motion.div
                                    key={catIndex}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + (catIndex * 0.1) }}
                                >
                                    <Card className="border-border/50">
                                        <CardHeader>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} bg-opacity-10 flex items-center justify-center`}>
                                                    <Icon className="h-6 w-6" style={{ color: `hsl(var(--primary))` }} />
                                                </div>
                                                <CardTitle className="text-2xl">{category.title}</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <Accordion type="single" collapsible className="w-full">
                                                {category.faqs.map((faq, faqIndex) => (
                                                    <AccordionItem key={faqIndex} value={`item-${catIndex}-${faqIndex}`}>
                                                        <AccordionTrigger className="text-left hover:text-primary">
                                                            {faq.question}
                                                        </AccordionTrigger>
                                                        <AccordionContent className="text-muted-foreground leading-relaxed">
                                                            {faq.answer}
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                ))}
                                            </Accordion>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </motion.div>

                    {/* Contact Support */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="mt-12"
                    >
                        <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/5 to-purple-500/5">
                            <CardHeader>
                                <CardTitle className="text-2xl flex items-center gap-2">
                                    <Mail className="h-6 w-6" />
                                    Still need help?
                                </CardTitle>
                                <CardDescription>
                                    Can't find what you're looking for? Our support team is here to help.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button size="lg" className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
                                    Contact Support
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default Help;
