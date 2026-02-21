import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Check, Zap, Star, Shield, HelpCircle, ArrowRight, Building, GraduationCap, Sparkles } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Footer } from "@/components/Footer";

const Pricing = () => {
    const [isAnnual, setIsAnnual] = useState(true);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1
        }
    };

    const plans = [
        {
            name: "Basic",
            description: "Essential practice for casual learners.",
            price: "0",
            features: [
                "Access to Basic Question Bank",
                "Community Discussion Access",
                "Daily Coding Challenges",
                "Basic Progress Tracking",
                "1 AI Mock Interview / Month"
            ],
            cta: "Get Started Free",
            variant: "outline" as const,
            popular: false,
            icon: GraduationCap,
            highlight: false
        },
        {
            name: "Pro",
            description: "Complete power for serious job hunters.",
            price: isAnnual ? "12" : "15",
            features: [
                "Everything in Basic",
                "Unlimited AI Mock Interviews",
                "Advanced System Design Paths",
                "Resume Analysis & Optimization",
                "Priority Community Support",
                "Verified Skills Certificate",
                "Ad-free Experience"
            ],
            cta: "Upgrade to Pro",
            variant: "default" as const,
            popular: true,
            icon: Sparkles,
            highlight: true
        },
        {
            name: "Enterprise",
            description: "For universities and coding bootcamps.",
            price: "Custom",
            features: [
                "Everything in Pro",
                "Bulk Seat Management",
                "Custom Interview Flows",
                "Admin Analytics Dashboard",
                "SSO & Custom Integrations",
                "Dedicated Success Manager",
                "SLA Support"
            ],
            cta: "Contact Sales",
            variant: "outline" as const,
            popular: false,
            icon: Building,
            highlight: false
        }
    ];

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-violet-500/30 flex flex-col overflow-x-hidden">
            <Navbar />
            
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-violet-600/5 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute top-[40%] left-[-20%] w-[600px] h-[600px] bg-fuchsia-600/5 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-[0.04]" />
            </div>

            <main className="flex-1 pt-32 pb-20 relative z-10">
                {/* Hero Section */}
                <section className="container mx-auto px-4 text-center max-w-4xl space-y-8 mb-24">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-6"
                    >
                         <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="inline-flex"
                         >
                             <Badge variant="secondary" className="px-4 py-1.5 rounded-full text-violet-600 bg-violet-500/10 border border-violet-500/20 backdrop-blur-md">
                                <Zap className="w-3.5 h-3.5 mr-2 fill-current" />
                                Launch your career
                            </Badge>
                         </motion.div>
                        
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                            Plans that scale with your <br/>
                            <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 bg-clip-text text-transparent animate-gradient-x">
                                ambition
                            </span>
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                            From first interview to offer letter, we have the tools you need. Choose the plan that fits your goals.
                        </p>
                    </motion.div>

                    {/* Pricing Toggle */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center justify-center gap-6 pt-6"
                    >
                        <span className={`text-sm font-medium transition-colors ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
                        <div className="relative flex items-center">
                            <Switch 
                                checked={isAnnual} 
                                onCheckedChange={setIsAnnual} 
                                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-violet-600 data-[state=checked]:to-fuchsia-600"
                            />
                        </div>
                        <span className={`text-sm font-medium transition-colors ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
                            Yearly 
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
                                Save 20%
                            </span>
                        </span>
                    </motion.div>
                </section>

                {/* 3-Tier Pricing Cards */}
                <section className="container mx-auto px-4 max-w-7xl mb-32">
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-8 items-start relative"
                    >
                        {plans.map((plan, idx) => {
                             const Icon = plan.icon;
                             return (
                                <motion.div 
                                    key={plan.name}
                                    variants={itemVariants}
                                    className={`relative group rounded-[2rem] transition-all duration-300 ${plan.popular ? 'md:-mt-8 md:mb-8 z-10' : 'z-0'}`}
                                >
                                    {plan.popular && (
                                        <div className="absolute -inset-[2px] bg-gradient-to-b from-violet-500 via-fuchsia-500 to-violet-500 rounded-[2rem] opacity-75 blur-sm group-hover:opacity-100 transition-opacity duration-500" />
                                    )}
                                    
                                    <div className={`
                                        relative h-full rounded-[1.9rem] p-8 flex flex-col
                                        ${plan.popular ? 'bg-background shadow-2xl shadow-violet-500/20' : 'bg-card/40 backdrop-blur-md border border-border/50 hover:border-violet-500/30'}
                                    `}>
                                        {plan.popular && (
                                            <div className="absolute top-0 inset-x-0 -translate-y-1/2 flex justify-center">
                                                 <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 uppercase tracking-wide">
                                                    <Star className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                                                    Most Popular
                                                </div>
                                            </div>
                                        )}

                                        <div className="mb-8">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${plan.popular ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300' : 'bg-secondary text-muted-foreground'}`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                            <p className="text-muted-foreground text-sm leading-relaxed min-h-[40px]">{plan.description}</p>
                                        </div>

                                        <div className="mb-8">
                                            <div className="flex items-baseline gap-1">
                                                {plan.price === "Custom" ? (
                                                     <span className="text-4xl font-bold tracking-tight">Custom</span>
                                                ) : (
                                                    <>
                                                        <span className="text-5xl font-bold tracking-tight">${plan.price}</span>
                                                        <span className="text-muted-foreground font-medium">/mo</span>
                                                    </>
                                                )}
                                            </div>
                                            {plan.price !== "Custom" && (
                                                 <p className="text-xs text-muted-foreground mt-2 font-medium">
                                                    {isAnnual ? 'Billed annually ($'+(parseInt(plan.price)*12)+'/yr)' : 'Billed monthly'}
                                                </p>
                                            )}
                                        </div>

                                         <Button 
                                            className={`w-full h-12 rounded-xl text-sm font-bold transition-all duration-300 mb-8
                                            ${plan.popular 
                                                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02]' 
                                                : 'hover:bg-secondary/80'}`}
                                            variant={plan.variant}
                                        >
                                            {plan.cta}
                                            {plan.popular && <ArrowRight className="w-4 h-4 ml-2" />}
                                        </Button>

                                        <div className="space-y-4 mt-auto">
                                            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                                                Includes
                                            </div>
                                            <ul className="space-y-3">
                                                {plan.features.map(feature => (
                                                    <li key={feature} className="flex items-start gap-3 text-sm group/feature">
                                                        <Check className={`w-4 h-4 mt-0.5 shrink-0 transition-colors ${plan.popular ? 'text-violet-500' : 'text-muted-foreground group-hover/feature:text-violet-500'}`} />
                                                        <span className="text-muted-foreground group-hover/feature:text-foreground transition-colors">
                                                            {feature}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </motion.div>
                </section>

                {/* FAQ Section */}
                <section className="container mx-auto px-4 max-w-4xl mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
                        <p className="text-muted-foreground">Everything you need to know about the product and billing.</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="grid md:grid-cols-2 gap-6"
                    >
                         {[
                            { q: "Can I upgrade later?", a: "Yes, you can upgrade from Basic to Pro at any time. We'll prorate the difference for the remainder of your cycle." },
                            { q: "Is there a student discount?", a: "Absolutely! Verify your student status with a .edu email to receive 50% off the Pro plan for up to 4 years." },
                            { q: "What's the Enterprise limit?", a: "Enterprise plans support unlimited seats and come with volume discounts starting at 10 seats." },
                            { q: "Do you offer refunds?", a: "We offer a 7-day money-back guarantee on the Pro plan if you're not completely satisfied." },
                            { q: "Can I pause my subscription?", a: "Yes, you can pause your Pro subscription for up to 3 months if you're taking a break from interviewing." },
                            { q: "Is the certificate official?", a: "Our Verified Skills Certificates are industry-recognized and can be added directly to your LinkedIn profile." }
                        ].map((faq, i) => (
                            <div key={i} className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:bg-card/50 transition-colors">
                                <h3 className="font-bold text-foreground mb-2 flex items-start gap-2">
                                    <HelpCircle className="w-4 h-4 mt-1 text-violet-500 shrink-0" />
                                    {faq.q}
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                                    {faq.a}
                                </p>
                            </div>
                        ))}
                    </motion.div>
                </section>

                 {/* Social Proof */}
                 <section className="container mx-auto px-4 py-16 text-center border-t border-border/40 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-violet-500/5 pointer-events-none" />
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col items-center gap-6 relative z-10"
                    >
                         <div className="flex -space-x-4">
                            {[1,2,3,4,5].map(i => (
                                <div key={i} className="relative group">
                                    <div className="absolute inset-0 bg-violet-500 blur-md opacity-0 group-hover:opacity-50 transition-opacity rounded-full" />
                                    <img 
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i+100}`} 
                                        className="w-12 h-12 rounded-full border-2 border-background relative z-10 transition-transform hover:scale-110 hover:z-20 shadow-lg" 
                                        alt="User"
                                    />
                                </div>
                            ))}
                         </div>
                         <div>
                             <h3 className="text-3xl font-bold mb-2">Join 10,000+ Developers</h3>
                             <p className="text-muted-foreground max-w-md mx-auto">
                                 Start your journey today and get the career you deserve.
                             </p>
                         </div>
                    </motion.div>
                 </section>

            </main>
            <Footer />
        </div>
    );
};

export default Pricing;
