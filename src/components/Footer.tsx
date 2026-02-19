import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github, Twitter, Linkedin, Mail, Heart, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

export const Footer = () => {
    const currentYear = new Date().getFullYear();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring" as const, stiffness: 300, damping: 24 }
        }
    };

    return (
        <footer className="relative bg-background border-t border-border/40 overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[50%] -left-[10%] w-[40%] h-[40%] rounded-full bg-violet-500/5 blur-[100px]" />
                <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] rounded-full bg-fuchsia-500/5 blur-[100px]" />
            </div>

            <div className="container mx-auto px-4 py-16 relative z-10">
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16"
                >
                    {/* Brand Section */}
                    <motion.div variants={itemVariants} className="space-y-6">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-all duration-300">
                                <span className="text-white font-bold text-xl">V</span>
                            </div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                                Voke
                            </span>
                        </Link>
                        <p className="text-muted-foreground leading-relaxed max-w-sm">
                            Empowering developers to master technical interviews with AI-driven practice, real-time feedback, and personalized learning paths.
                        </p>
                        <div className="flex items-center gap-4">
                            {[
                                { icon: Twitter, href: "https://twitter.com" },
                                { icon: Github, href: "https://github.com" },
                                { icon: Linkedin, href: "https://linkedin.com" }
                            ].map((social, index) => (
                                <a
                                    key={index}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-600 dark:hover:text-violet-400 transition-all duration-300 hover:scale-110"
                                >
                                    <social.icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </motion.div>

                    {/* Product Links */}
                    <motion.div variants={itemVariants}>
                        <h3 className="font-bold text-foreground mb-6 text-lg">Product</h3>
                        <ul className="space-y-4">
                            {[
                                { label: "Learning Paths", to: "/learning-paths" },
                                { label: "Video Practice", to: "/video-interview" },
                                { label: "Job Market Insights", to: "/job-market" },
                                { label: "Leaderboard", to: "/leaderboard" }
                            ].map((link, index) => (
                                <li key={index}>
                                    <Link
                                        to={link.to}
                                        className="text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center gap-2 group"
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500/0 group-hover:bg-violet-500 transition-all duration-300" />
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Resources Links */}
                    <motion.div variants={itemVariants}>
                        <h3 className="font-bold text-foreground mb-6 text-lg">Resources</h3>
                        <ul className="space-y-4">
                            {[
                                { label: "Blog", to: "/blog" },
                                { label: "Community", to: "/community" },
                                { label: "Help Center", to: "/help" },
                                { label: "Privacy Policy", to: "/privacy" }
                            ].map((link, index) => (
                                <li key={index}>
                                    <Link
                                        to={link.to}
                                        className="text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center gap-2 group"
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500/0 group-hover:bg-violet-500 transition-all duration-300" />
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Newsletter Section */}
                    <motion.div variants={itemVariants}>
                        <h3 className="font-bold text-foreground mb-6 text-lg">Stay Updated</h3>
                        <p className="text-muted-foreground mb-6 text-sm">
                            Subscribe to our newsletter for the latest interview tips and platform updates.
                        </p>
                        <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-violet-500 transition-colors" />
                                <Input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="pl-10 bg-muted/30 border-border/50 focus:border-violet-500/50 focus:ring-violet-500/20 transition-all"
                                />
                            </div>
                            <Button className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 group">
                                Subscribe
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </form>
                    </motion.div>
                </motion.div>

                {/* Bottom Bar */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4"
                >
                    <p className="text-muted-foreground text-sm">
                        © {currentYear} Voke. All rights reserved.
                    </p>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/30 px-4 py-2 rounded-full border border-border/30">
                        <span>Made with</span>
                        <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
                        <span>for developers</span>
                    </div>
                </motion.div>
            </div>
        </footer>
    );
};
