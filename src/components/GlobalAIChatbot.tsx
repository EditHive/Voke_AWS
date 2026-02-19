import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Send, X, MessageSquare, Minimize2, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Message {
    role: "user" | "assistant";
    content: string;
}

const GlobalAIChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (isOpen && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            setUserId(session.user.id);
        }
    };

    const sendMessage = async (messageText?: string) => {
        const text = messageText || input.trim();
        if (!text || loading) return;

        const userMessage: Message = { role: "user", content: text };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            // We'll use the existing edge function but with a specific context
            // ensuring it only answers interview/study related questions
            const { data, error } = await supabase.functions.invoke("interview-coach-chat", {
                body: {
                    messages: [...messages, userMessage],
                    userContext: "You are a strict AI study and interview assistant. You MUST ONLY answer questions related to interviews, career advice, coding, technical concepts, or study materials. If a user asks about anything else (like weather, sports, general chit-chat unrelated to professional development), politely refuse and steer them back to interview/study topics."
                }
            });

            if (error) throw error;

            if (data?.response) {
                const assistantMessage: Message = { role: "assistant", content: data.response };
                setMessages(prev => [...prev, assistantMessage]);
            }
        } catch (error: any) {
            console.error("Error sending message:", error);
            toast.error("Failed to get response from AI assistant");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="mb-4 w-[350px] md:w-[400px] shadow-2xl rounded-2xl overflow-hidden"
                    >
                        <Card className="border-primary/20 bg-background/95 backdrop-blur-md h-[500px] flex flex-col shadow-xl">
                            <CardHeader className="bg-primary/5 border-b border-border/50 py-3 px-4 flex flex-row items-center justify-between space-y-0">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-primary/10 rounded-lg">
                                        <Brain className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm font-bold">Voke Assistant</CardTitle>
                                        <CardDescription className="text-xs">Interview & Study Helper</CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                                    {messages.length === 0 ? (
                                        <div className="text-center py-8 px-4">
                                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <MessageSquare className="h-6 w-6 text-primary" />
                                            </div>
                                            <p className="text-sm font-medium mb-1">Hi there! 👋</p>
                                            <p className="text-xs text-muted-foreground mb-4">
                                                I'm your personal AI assistant. Ask me anything about your interview preparation or studies!
                                            </p>
                                            <div className="grid gap-2">
                                                <Button variant="outline" size="sm" className="text-xs justify-start h-auto py-2" onClick={() => sendMessage("How do I prepare for a system design interview?")}>
                                                    "How to prepare for system design?"
                                                </Button>
                                                <Button variant="outline" size="sm" className="text-xs justify-start h-auto py-2" onClick={() => sendMessage("Explain Big O notation")}>
                                                    "Explain Big O notation"
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {messages.map((message, index) => (
                                                <div
                                                    key={index}
                                                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                                                >
                                                    <div
                                                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                                                            message.role === "user"
                                                                ? "bg-primary text-primary-foreground"
                                                                : "bg-muted"
                                                        }`}
                                                    >
                                                        {message.role === "assistant" ? (
                                                            <div className="prose prose-xs dark:prose-invert max-w-none">
                                                                <ReactMarkdown>{message.content}</ReactMarkdown>
                                                            </div>
                                                        ) : (
                                                            message.content
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {loading && (
                                                <div className="flex justify-start">
                                                    <div className="bg-muted rounded-2xl px-3 py-2">
                                                        <div className="flex gap-1">
                                                            <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                                            <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                                            <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </ScrollArea>

                                <div className="p-3 border-t border-border/50 bg-background/50 backdrop-blur-sm">
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            sendMessage();
                                        }}
                                        className="flex gap-2"
                                    >
                                        <Input
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            placeholder="Ask about interviews..."
                                            disabled={loading}
                                            className="flex-1 h-9 text-sm"
                                        />
                                        <Button type="submit" disabled={loading || !input.trim()} size="icon" className="h-9 w-9">
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </form>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
                    isOpen 
                        ? "bg-destructive text-destructive-foreground rotate-90" 
                        : "bg-primary text-primary-foreground hover:shadow-primary/25"
                }`}
            >
                {isOpen ? (
                    <X className="h-6 w-6" />
                ) : (
                    <div className="relative">
                        <Brain className="h-7 w-7" />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                    </div>
                )}
            </motion.button>
        </div>
    );
};

export default GlobalAIChatbot;
