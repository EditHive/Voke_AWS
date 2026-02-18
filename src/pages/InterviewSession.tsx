import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Brain, LogOut, Send, Mic, MicOff, Volume2, 
  Clock, User, Bot, StopCircle, Award, CheckCircle2, AlertTriangle, XCircle
} from "lucide-react";
import { toast } from "sonner";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

// Mock Interview Logic
const MOCK_INTERVIEW_FLOW = [
  {
    role: "assistant",
    content: "Hello! I'm Voke, your AI interviewer today. I see we're focusing on **Frontend Development**. To start, could you tell me about a challenging UI problem you've solved recently?"
  },
  {
    role: "assistant",
    content: "That's interesting. When dealing with that performance issue, how did you measure the impact of your optimizations? Did you use any specific tools?"
  },
  {
    role: "assistant",
    content: "Great. Now, let's shift to React specifically. Can you explain the difference between `useEffect` and `useLayoutEffect`, and when you would choose one over the other?"
  },
  {
    role: "assistant",
    content: "Excellent explanation. Let's do a quick coding challenge. How would you implement a custom hook `useDebounce` that delays a value update?"
  },
  {
    role: "assistant",
    content: "Thank you for that implementation. Finally, let's discuss accessibility. What are some key considerations when building a modal component to ensure it's accessible to screen readers?"
  }
];

interface Message {
  role: "assistant" | "user";
  content: string;
}

export default function InterviewSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [voiceMode, setVoiceMode] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [mockIndex, setMockIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState(location.state?.config || {
    topic: "General",
    difficulty: "Intermediate",
    mode: "text"
  });

  const { isListening, isSpeaking, startListening, stopListening, speak, stopSpeaking } = useVoiceChat({
    onTranscript: (text, isFinal) => {
      if (isFinal) {
        setInput(text);
        // Auto-send if voice mode is active and silence detected (simulated by isFinal)
        setTimeout(() => {
          if (text.trim()) handleSendMessage(text);
        }, 1000);
      }
    },
    onError: (error) => toast.error(error),
  });

  useEffect(() => {
    // Initialize session
    setTimeout(() => {
      setLoading(false);
      // Start with first question
      const initialMsg = MOCK_INTERVIEW_FLOW[0];
      setMessages([initialMsg as Message]);
      if (config.mode === 'voice') {
        setVoiceMode(true);
        speak(initialMsg.content);
      }
    }, 1500);

    const timer = setInterval(() => setElapsedTime(p => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMsg: Message = { role: "user", content };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setSending(true);

    // Simulate AI thinking delay
    setTimeout(() => {
      const nextIndex = mockIndex + 1;
      if (nextIndex < MOCK_INTERVIEW_FLOW.length) {
        const aiMsg = MOCK_INTERVIEW_FLOW[nextIndex];
        setMessages(prev => [...prev, aiMsg as Message]);
        setMockIndex(nextIndex);
        if (voiceMode) speak(aiMsg.content);
      } else {
        // End of interview flow
        setShowResults(true);
      }
      setSending(false);
    }, 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleVoiceMode = () => {
    if (voiceMode) {
      stopListening();
      stopSpeaking();
      setVoiceMode(false);
    } else {
      startListening();
      setVoiceMode(true);
      toast.success("Voice mode active");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground animate-pulse">Preparing your interview environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar - AI Persona & Stats */}
      <aside className="w-80 border-r border-border/40 bg-card/30 backdrop-blur-xl hidden md:flex flex-col relative z-20">
        <div className="p-6 flex flex-col items-center border-b border-border/40">
          <div className="relative mb-6">
            <div className={`w-32 h-32 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-violet-500/20 ${isSpeaking ? 'animate-pulse scale-105' : ''} transition-all duration-500`}>
              <Bot className="w-16 h-16 text-white" />
            </div>
            {/* Audio Visualizer Ring */}
            {(isSpeaking || sending) && (
              <>
                <div className="absolute inset-0 rounded-full border-4 border-violet-500/30 animate-ping" />
                <div className="absolute inset-0 rounded-full border-2 border-violet-500/50 animate-[spin_3s_linear_infinite]" />
              </>
            )}
          </div>
          
          <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            Voke AI
          </h2>
          <Badge variant="outline" className="mt-2 border-violet-500/30 text-violet-600 bg-violet-500/5">
            {config.topic} Expert
          </Badge>
          
          <div className="mt-8 w-full space-y-4">
            <div className="flex items-center justify-between text-sm p-4 rounded-xl bg-background/50 border border-border/50 shadow-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" /> Time
              </span>
              <span className="font-mono font-bold text-lg">{formatTime(elapsedTime)}</span>
            </div>
            
            <div className="p-4 rounded-xl bg-background/50 border border-border/50 shadow-sm space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(((mockIndex + 1) / MOCK_INTERVIEW_FLOW.length) * 100)}%</span>
              </div>
              <Progress value={((mockIndex + 1) / MOCK_INTERVIEW_FLOW.length) * 100} className="h-2" />
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 flex flex-col justify-end">
          <div className="space-y-3">
            <Button 
              onClick={toggleVoiceMode} 
              variant={voiceMode ? "default" : "outline"} 
              className={`w-full justify-start h-12 text-base ${voiceMode ? 'bg-gradient-to-r from-violet-600 to-purple-600 border-0 shadow-lg shadow-violet-500/25' : ''}`}
            >
              {voiceMode ? <Mic className="w-5 h-5 mr-3" /> : <MicOff className="w-5 h-5 mr-3" />}
              {voiceMode ? "Voice Mode Active" : "Enable Voice Mode"}
            </Button>
            <Button onClick={() => setShowResults(true)} variant="destructive" className="w-full justify-start h-12 bg-red-500/10 text-red-500 hover:bg-red-500/20 border-0">
              <StopCircle className="w-5 h-5 mr-3" />
              End Session
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative bg-gradient-to-br from-background via-background to-violet-500/5">
        {/* Mobile Header */}
        <header className="md:hidden border-b border-border/40 bg-background/80 backdrop-blur-md p-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">Voke AI</span>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setShowResults(true)}>
            <LogOut className="w-4 h-4" />
          </Button>
        </header>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4 md:p-8">
          <div className="max-w-3xl mx-auto space-y-8 pb-4">
            <AnimatePresence initial={false}>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <Avatar className="w-10 h-10 border border-border mt-1 shrink-0 shadow-sm">
                      <AvatarImage src="/ai-avatar.png" />
                      <AvatarFallback className="bg-gradient-to-br from-violet-600 to-purple-600 text-white">AI</AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${message.role === "user" ? "items-end" : "items-start"}`}>
                    <div
                      className={`p-5 rounded-2xl shadow-sm leading-relaxed ${
                        message.role === "user"
                          ? "bg-gradient-to-br from-violet-600 to-purple-600 text-white rounded-tr-none shadow-violet-500/10"
                          : "bg-card border border-border/50 text-foreground rounded-tl-none"
                      }`}
                    >
                      <div className={`prose prose-sm max-w-none ${
                        message.role === "user" 
                          ? "prose-invert text-white" 
                          : "dark:prose-invert text-foreground"
                      }`}>
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>

                  {message.role === "user" && (
                    <Avatar className="w-10 h-10 border border-border mt-1 shrink-0">
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        <User className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing Indicator */}
            {sending && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="flex gap-4 justify-start"
              >
                <Avatar className="w-10 h-10 border border-border mt-1 shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-violet-600 to-purple-600 text-white">AI</AvatarFallback>
                </Avatar>
                <div className="p-4 rounded-2xl rounded-tl-none bg-card border border-border/50 shadow-sm">
                  <div className="flex gap-1.5 items-center h-6 px-2">
                    <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce"></span>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-background/80 backdrop-blur-xl border-t border-border/40">
          <div className="max-w-3xl mx-auto relative">
            <div className="relative flex items-end gap-2 p-2 bg-card border border-border/50 rounded-3xl shadow-lg shadow-black/5 focus-within:ring-2 focus-within:ring-violet-500/20 transition-all">
              <Button
                size="icon"
                variant="ghost"
                className={`rounded-full h-10 w-10 shrink-0 ${voiceMode ? 'text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-950/30' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={toggleVoiceMode}
              >
                {voiceMode ? <Mic className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
              </Button>
              
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(input);
                  }
                }}
                placeholder={voiceMode ? "Listening... (or type your answer)" : "Type your answer here..."}
                className="min-h-[44px] max-h-[120px] py-3 px-2 border-0 focus-visible:ring-0 bg-transparent resize-none shadow-none"
                rows={1}
                disabled={sending}
              />
              
              <Button
                onClick={() => handleSendMessage(input)}
                disabled={!input.trim() || sending}
                size="icon"
                className={`rounded-full h-10 w-10 shrink-0 transition-all duration-300 ${
                  input.trim() 
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md hover:shadow-lg hover:scale-105' 
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Results Modal */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Award className="h-6 w-6 text-yellow-500" />
              Interview Completed
            </DialogTitle>
            <DialogDescription>
              Here's a summary of your performance in this session.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-center p-6 bg-muted/30 rounded-xl border border-border/50">
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-1">
                  85/100
                </div>
                <p className="text-sm text-muted-foreground">Overall Score</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Strengths
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                  <li>Strong understanding of React fundamentals</li>
                  <li>Clear communication of technical concepts</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Areas for Improvement
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                  <li>Could elaborate more on accessibility edge cases</li>
                  <li>Consider discussing trade-offs in system design answers</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
            <Button onClick={() => navigate("/job-market")} className="bg-gradient-to-r from-violet-600 to-purple-600 text-white">
              View Detailed Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
