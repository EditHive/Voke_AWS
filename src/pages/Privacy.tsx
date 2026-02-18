import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, ArrowLeft, Shield, Lock, Eye, Database, UserCheck, FileText } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "motion/react";

import { supabase } from "@/integrations/supabase/client";

const Privacy = () => {
    const navigate = useNavigate();

    const handleLogoClick = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            navigate("/dashboard");
        } else {
            navigate("/");
        }
    };

    const sections = [
        {
            title: "Information We Collect",
            icon: Database,
            content: [
                "Account information (name, email, password)",
                "Profile data (resume, skills, experience)",
                "Interview session data (recordings, transcripts, feedback)",
                "Usage data (features used, time spent, interactions)",
                "Device and browser information",
                "Cookies and similar tracking technologies"
            ]
        },
        {
            title: "How We Use Your Information",
            icon: UserCheck,
            content: [
                "Provide and improve our interview practice services",
                "Generate personalized feedback and recommendations",
                "Analyze your performance and track progress",
                "Send important updates and notifications",
                "Conduct research to enhance our AI models",
                "Ensure platform security and prevent fraud"
            ]
        },
        {
            title: "Data Security",
            icon: Lock,
            content: [
                "Industry-standard encryption for data in transit and at rest",
                "Regular security audits and penetration testing",
                "Secure cloud infrastructure with redundancy",
                "Access controls and authentication measures",
                "Employee training on data protection",
                "Incident response and breach notification procedures"
            ]
        },
        {
            title: "Your Privacy Rights",
            icon: Shield,
            content: [
                "Access your personal data at any time",
                "Request correction of inaccurate information",
                "Delete your account and associated data",
                "Export your data in a portable format",
                "Opt-out of marketing communications",
                "Object to certain data processing activities"
            ]
        },
        {
            title: "Data Sharing",
            icon: Eye,
            content: [
                "We do not sell your personal information to third parties",
                "Share data with service providers under strict agreements",
                "May disclose information to comply with legal obligations",
                "Aggregate, anonymized data may be used for research",
                "Peer interview data is only shared with matched participants",
                "You control what information is visible in your profile"
            ]
        },
        {
            title: "Data Retention",
            icon: FileText,
            content: [
                "Account data retained while your account is active",
                "Interview recordings kept for 2 years or until deletion",
                "Analytics data aggregated and anonymized after 1 year",
                "Deleted accounts purged within 30 days",
                "Legal compliance may require longer retention",
                "You can request early deletion of specific data"
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
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                                    <Mic className="w-6 h-6 text-white" />
                                </div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                                    Privacy Policy
                                </h1>
                            </div>
                        </div>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {/* Content */}
            <section className="pt-32 pb-16 px-4">
                <div className="container mx-auto max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Privacy Policy
                        </h2>
                        <p className="text-lg text-muted-foreground mb-4">
                            Last updated: November 22, 2024
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                            At Voke, we take your privacy seriously. This Privacy Policy explains how we collect, use, protect, and share your personal information when you use our interview preparation platform.
                        </p>
                    </motion.div>

                    {/* Privacy Sections */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-6"
                    >
                        {sections.map((section, index) => {
                            const Icon = section.icon;
                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + (index * 0.1) }}
                                >
                                    <Card className="border-border/50 hover:border-primary/30 transition-colors">
                                        <CardHeader>
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center border border-primary/20">
                                                    <Icon className="h-6 w-6 text-primary" />
                                                </div>
                                                <CardTitle className="text-2xl">{section.title}</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-3">
                                                {section.content.map((item, itemIndex) => (
                                                    <li key={itemIndex} className="flex items-start gap-3">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                                        <span className="text-muted-foreground leading-relaxed">{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </motion.div>

                    {/* Contact Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.0 }}
                        className="mt-12"
                    >
                        <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/5 to-purple-500/5">
                            <CardHeader>
                                <CardTitle className="text-2xl">Questions About Privacy?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-6 leading-relaxed">
                                    If you have any questions about this Privacy Policy or how we handle your data, please don't hesitate to contact us at{" "}
                                    <a href="mailto:privacy@voke.com" className="text-primary hover:underline">
                                        privacy@voke.com
                                    </a>
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    <Button variant="outline">
                                        Download Privacy Policy (PDF)
                                    </Button>
                                    <Button variant="outline">
                                        Manage Privacy Settings
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Additional Info */}
                    <div className="mt-8 p-6 bg-muted/50 rounded-xl border border-border/50">
                        <h3 className="font-semibold mb-3">Changes to This Policy</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            We may update this Privacy Policy from time to time. We will notify you of any significant changes by email or through a notice on our platform. Your continued use of Voke after such modifications constitutes your acknowledgment and acceptance of the updated Privacy Policy.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Privacy;
