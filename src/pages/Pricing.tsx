import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { motion } from "motion/react";
import { Check, Zap, Star, Shield, HelpCircle, ArrowRight } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Footer } from "@/components/Footer";

const Pricing = () => {
    const [isAnnual, setIsAnnual] = useState(true);

    const plans = [
        {
            name: "Free",
            description: "Essential tools to start your prep.",
            price: "0",
            features: [
                "Access to Basic Practice Questions",
                "Community Access",
                "Daily Challenges",
                "Basic Progress Tracking",
                "1 Mock Interview / Month"
            ],
            cta: "Get Started",
            variant: "outline" as const,
            popular: false
        },
        {
            name: "Pro",
            description: "The complete toolkit for serious candidates.",
            price: isAnnual ? "12" : "15",
            features: [
                "Everything in Free",
                "Unlimited AI Mock Interviews",
                "Advanced System Design Paths",
                "Resume Analysis & Optimization",
                "Priority Community Support",
                "Verified Skills Certificate",
                "Ad-free Experience"
            ],
            cta: "Upgrade to Pro",
            variant: "default" as const,
            popular: true
        }
    ];

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-violet-500/30 flex flex-col">
            <Navbar />
            
            <main className="flex-1 pt-24 pb-20">
                {/* Hero */}
                <section className="container mx-auto px-4 text-center max-w-4xl space-y-6 mb-20">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                         <Badge variant="secondary" className="px-4 py-1.5 rounded-full text-violet-600 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                            <Zap className="w-3.5 h-3.5 mr-2 fill-current" />
                            Invest in your future
                        </Badge>
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                            Simple pricing, <br/>
                            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent">
                                Maximum Impact.
                            </span>
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                            Join thousands of developers landing their dream jobs. Upgrade to Pro for unlimited access to advanced interview simulations.
                        </p>
                    </motion.div>

                    {/* Toggle */}
                    <div className="flex items-center justify-center gap-4 pt-4">
                        <span className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
                        <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
                        <span className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
                            Yearly <span className="text-emerald-500 text-xs ml-1 font-bold">(Save 20%)</span>
                        </span>
                    </div>
                </section>

                {/* Pricing Cards */}
                <section className="container mx-auto px-4 max-w-5xl mb-24">
                    <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
                        {plans.map((plan, idx) => (
                            <motion.div 
                                key={plan.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`relative rounded-3xl p-8 border ${plan.popular ? 'bg-card border-violet-500/50 shadow-2xl shadow-violet-500/10' : 'bg-card/50 border-border shadow-sm'}`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                                        MOST POPULAR
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                                    <p className="text-muted-foreground text-sm h-10">{plan.description}</p>
                                    <div className="mt-6 flex items-baseline gap-1">
                                        <span className="text-4xl font-extrabold">${plan.price}</span>
                                        <span className="text-muted-foreground">/mo</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {isAnnual ? 'Billed annually' : 'Billed monthly'}
                                    </p>
                                </div>

                                <ul className="space-y-4 mb-8">
                                    {plan.features.map(feature => (
                                        <li key={feature} className="flex items-start gap-3 text-sm">
                                            <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.popular ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300' : 'bg-muted text-muted-foreground'}`}>
                                                <Check className="w-3 h-3" />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <Button 
                                    className={`w-full rounded-xl py-6 font-semibold shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]
                                    ${plan.popular ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0 shadow-violet-500/25' : ''}`}
                                    variant={plan.variant}
                                >
                                    {plan.cta}
                                    {plan.popular && <ArrowRight className="w-4 h-4 ml-2" />}
                                </Button>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* FAQ */}
                <section className="container mx-auto px-4 max-w-3xl mb-24">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold mb-2">Frequently Asked Questions</h2>
                        <p className="text-muted-foreground">Have questions? We're here to help.</p>
                    </div>

                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>Can I cancel anytime?</AccordionTrigger>
                            <AccordionContent>
                                Yes! You can cancel your subscription at any time. Your access will remain active until the end of your billing period.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>Is there a student discount?</AccordionTrigger>
                            <AccordionContent>
                                We offer a 50% discount for verify students. Contact support with your .edu email to get your code.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger>What payment methods do you accept?</AccordionTrigger>
                            <AccordionContent>
                                We accept all major credit cards (Visa, Mastercard, Amex), PayPal, and Apple Pay.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                            <AccordionTrigger>Do you offer refunds?</AccordionTrigger>
                            <AccordionContent>
                                We offer a 7-day money-back guarantee if you're not satisfied with the Pro features. No questions asked.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </section>

                 <section className="container mx-auto px-4 py-16 text-center border-t border-border">
                    <div className="flex flex-col items-center gap-4">
                         <div className="flex -space-x-4 mb-2">
                            {[1,2,3,4,5].map(i => (
                                <img key={i} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i+100}`} className="w-10 h-10 rounded-full border-2 border-background" />
                            ))}
                         </div>
                         <h3 className="text-2xl font-bold">Join 10,000+ Developers</h3>
                         <p className="text-muted-foreground max-w-md">
                             Start your journey today and get the career you deserve.
                         </p>
                    </div>
                 </section>

            </main>
            <Footer />
        </div>
    );
};

export default Pricing;
