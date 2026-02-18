// Force reload v4
import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Brain, LogOut, Send, CheckCircle, Mic, MicOff, Volume2, 
  Sparkles, Clock, MoreHorizontal, User, Bot, StopCircle 
} from "lucide-react";
import { toast } from "sonner";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "assistant" | "user";
  content: string;
}

const InterviewSession = () => {
  console.log("InterviewSession V4 loaded");
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streamingMessage, setStreamingMessage] = useState("");
  const [voiceMode, setVoiceMode] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isListening, isSpeaking, startListening, stopListening, speak, stopSpeaking } = useVoiceChat({
    onTranscript: (text, isFinal) => {
      if (isFinal) {
        setInput(text);
        setInterimTranscript("");
        setTimeout(() => {
          if (text.trim()) {
            sendMessage(text);
          }
        }, 500);
      } else {
        setInterimTranscript(text);
      }
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  useEffect(() => {
    checkAuth();
    loadSession();
    
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage, interimTranscript]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadSession = async () => {
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from("interview_sessions")
        .select("*")
        .eq("id", id)
        .single();

      if (sessionError) throw sessionError;
      setSession(sessionData);

      const { data: messagesData } = await supabase
        .from("interview_messages")
        .select("*")
        .eq("session_id", id)
        .order("created_at");

      if (messagesData && messagesData.length > 0) {
        setMessages(
          messagesData.map((msg) => ({
            role: msg.role as "assistant" | "user",
            content: msg.content,
          }))
        );
      } else {
        await sendMessage("", true);
      }
    } catch (error) {
      console.error("Error loading session:", error);
      toast.error("Failed to load interview session");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string, isInitial = false) => {
    if (!content.trim() && !isInitial) return;

    setSending(true);
    setStreamingMessage("");

    try {
      const userMessage: Message = { role: "user", content };
      const newMessages = isInitial ? [] : [...messages, userMessage];

      if (!isInitial) {
        setMessages(newMessages);
        setInput("");
        setInterimTranscript("");

        await supabase.from("interview_messages").insert({
          session_id: id,
          role: "user",
          content,
        });
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/interview-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: isInitial
              ? []
              : newMessages.map((m) => ({ role: m.role, content: m.content })),
            interviewType: session?.interview_type,
            resumeContent: session?.resume_content,
          }),
        }
      );

      if (!response.ok || !response.body) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantResponse += content;
                setStreamingMessage(assistantResponse);
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }

      const finalMessage: Message = {
        role: "assistant",
        content: assistantResponse,
      };
      setMessages((prev) => [...prev, finalMessage]);
      setStreamingMessage("");

      await supabase.from("interview_messages").insert({
        session_id: id,
        role: "assistant",
        content: assistantResponse,
      });

      if (voiceMode && assistantResponse) {
        speak(assistantResponse);
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const endInterview = async () => {
    try {
      await supabase
        .from("interview_sessions")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", id);

      toast.success("Interview completed!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error ending interview:", error);
      toast.error("Failed to end interview");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const toggleVoiceMode = () => {
    if (voiceMode) {
      stopListening();
      stopSpeaking();
      setVoiceMode(false);
    } else {
      startListening();
      setVoiceMode(true);
      toast.success("Voice mode enabled. Start speaking!");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  const getInterviewTypeDisplay = (type: string) => {
    switch (type) {
      case "technical":
        return "Technical Interview";
      case "behavioral":
        return "Behavioral Interview";
      case "resume":
        return "Resume-Based Interview";
      default:
        return "Interview";
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar - AI Persona & Stats */}
      <aside className="w-80 border-r border-border/40 bg-card/30 backdrop-blur-xl hidden md:flex flex-col relative z-20">
        <div className="p-6 flex flex-col items-center border-b border-border/40">
          <div className="relative mb-4">
            <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-xl shadow-violet-500/20 ${sending || isSpeaking ? 'animate-pulse' : ''}`}>
              <Bot className="w-12 h-12 text-white" />
            </div>
            {(sending || isSpeaking) && (
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-6 w-6 bg-green-500 border-2 border-background"></span>
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            Voke AI
          </h2>
          <p className="text-sm text-muted-foreground">Professional Interviewer</p>
          
          <div className="mt-6 w-full space-y-4">
            <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-background/50 border border-border/50">
              <span className="text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" /> Duration
              </span>
              <span className="font-mono font-medium">{formatTime(elapsedTime)}</span>
            </div>
            <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-background/50 border border-border/50">
              <span className="text-muted-foreground flex items-center gap-2">
                <Brain className="w-4 h-4" /> Type
              </span>
              <span className="font-medium capitalize">{session?.interview_type || "General"}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6">
          <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Session Controls</h3>
          <div className="space-y-3">
            <Button 
              onClick={toggleVoiceMode} 
              variant={voiceMode ? "default" : "outline"} 
              className={`w-full justify-start ${voiceMode ? 'bg-gradient-to-r from-violet-600 to-purple-600 border-0' : ''}`}
            >
              {voiceMode ? <Mic className="w-4 h-4 mr-2" /> : <MicOff className="w-4 h-4 mr-2" />}
              {voiceMode ? "Voice Mode Active" : "Enable Voice Mode"}
            </Button>
            <Button onClick={endInterview} variant="destructive" className="w-full justify-start bg-red-500/10 text-red-500 hover:bg-red-500/20 border-0">
              <StopCircle className="w-4 h-4 mr-2" />
              End Session
            </Button>
          </div>
        </div>

        <div className="p-4 border-t border-border/40 text-center">
          <p className="text-xs text-muted-foreground">Quantum Query AI • Voke v1.0</p>
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
          <Button size="sm" variant="ghost" onClick={endInterview}>
            <LogOut className="w-4 h-4" />
          </Button>
        </header>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4 md:p-8">
          <div className="max-w-3xl mx-auto space-y-6 pb-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-4 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <Avatar className="w-8 h-8 border border-border mt-1 shrink-0">
                    <AvatarImage src="/ai-avatar.png" />
                    <AvatarFallback className="bg-gradient-to-br from-violet-600 to-purple-600 text-white">AI</AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${message.role === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`p-4 rounded-2xl shadow-sm ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-violet-600 to-purple-600 text-white rounded-tr-none"
                        : "bg-card border border-border/50 text-foreground rounded-tl-none"
                    }`}
                  >
                    <div className={`prose prose-sm max-w-none ${
                      message.role === "user" 
                        ? "prose-invert text-white" 
                        : "dark:prose-invert text-foreground"
                    }`}>
                      <ReactMarkdown 
                        components={{
                          p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({children}) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                          li: ({children}) => <li className="mb-1">{children}</li>,
                          h1: ({children}) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                          h2: ({children}) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                          h3: ({children}) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                          code: ({children}) => <code className="bg-muted/50 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                          pre: ({children}) => <pre className="bg-muted/50 p-2 rounded-lg mb-2 overflow-x-auto text-xs font-mono">{children}</pre>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>

                {message.role === "user" && (
                  <Avatar className="w-8 h-8 border border-border mt-1 shrink-0">
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {/* Interim Transcript (Voice) */}
            {interimTranscript && (
              <div className="flex justify-end gap-4 mb-6 animate-in fade-in">
                <div className="p-4 rounded-2xl rounded-tr-none bg-primary/10 border border-primary/20 text-primary italic max-w-[85%]">
                  {interimTranscript}
                  <span className="inline-block w-1 h-4 ml-1 bg-primary animate-pulse align-middle"></span>
                </div>
                <Avatar className="w-8 h-8 border border-border mt-1 opacity-50 shrink-0">
                  <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                </Avatar>
              </div>
            )}

            {/* Streaming Message */}
            {streamingMessage && (
              <div className="flex gap-4 justify-start mb-6 animate-in fade-in">
                <Avatar className="w-8 h-8 border border-border mt-1 shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-violet-600 to-purple-600 text-white">AI</AvatarFallback>
                </Avatar>
                <div className="p-4 rounded-2xl rounded-tl-none bg-card border border-border/50 text-foreground max-w-[85%] shadow-sm">
                  <div className="leading-relaxed">
                    <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
                      <ReactMarkdown 
                        components={{
                          p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({children}) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                          li: ({children}) => <li className="mb-1">{children}</li>,
                          h1: ({children}) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                          h2: ({children}) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                          h3: ({children}) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                          code: ({children}) => <code className="bg-muted/50 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                          pre: ({children}) => <pre className="bg-muted/50 p-2 rounded-lg mb-2 overflow-x-auto text-xs font-mono">{children}</pre>,
                        }}
                      >
                        {streamingMessage}
                      </ReactMarkdown>
                    </div>
                    <span className="inline-block w-1.5 h-4 ml-1 bg-violet-500 animate-pulse align-middle"></span>
                  </div>
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {sending && !streamingMessage && (
              <div className="flex gap-4 justify-start mb-6 animate-in fade-in">
                <Avatar className="w-8 h-8 border border-border mt-1 shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-violet-600 to-purple-600 text-white">AI</AvatarFallback>
                </Avatar>
                <div className="p-4 rounded-2xl rounded-tl-none bg-card border border-border/50 text-foreground shadow-sm">
                  <div className="flex gap-1.5 items-center h-6 px-2">
                    <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce"></span>
                  </div>
                </div>
              </div>
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
                    sendMessage(input);
                  }
                }}
                placeholder={voiceMode ? "Listening... (or type your answer)" : "Type your answer here..."}
                className="min-h-[44px] max-h-[120px] py-3 px-2 border-0 focus-visible:ring-0 bg-transparent resize-none shadow-none"
                rows={1}
                disabled={sending}
              />
              
              <Button
                onClick={() => sendMessage(input)}
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
            <p className="text-center text-xs text-muted-foreground mt-3">
              Press <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">Shift + Enter</kbd> for new line
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InterviewSession;
