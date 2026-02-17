import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, LogOut, Target, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SkillGap {
  skill: string;
  importance: string;
  learning_resource: string;
}

const AdaptiveInterview = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");

  const {
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useVoiceChat({
    onTranscript: (transcript, isFinal) => {
      if (isFinal) {
        setInput(transcript);
        setInterimTranscript("");
      } else {
        setInterimTranscript(transcript);
      }
    },
    onError: (error) => {
      toast({
        title: "Voice Error",
        description: error,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUserId(user.id);
    await loadCareerGuidance(user.id);
  };

  const loadCareerGuidance = async (userId: string) => {
    try {
      const { data: recommendations, error } = await supabase
        .from("user_career_recommendations")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        toast({
          title: "No Career Guidance Found",
          description: "Please generate career guidance first from the Job Market Insights page.",
          variant: "destructive",
        });
        navigate("/job-market");
        return;
      }

      const gaps = (recommendations.skill_gaps as unknown) as SkillGap[];
      setSkillGaps(gaps || []);
      await sendInitialMessage(gaps || []);
    } catch (error) {
      console.error("Error loading career guidance:", error);
      toast({
        title: "Error",
        description: "Failed to load career guidance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendInitialMessage = async (gaps: SkillGap[]) => {
    const initialMessages = [
      {
        role: "user" as const,
        content: "Start the adaptive interview simulation based on my skill gaps.",
      },
    ];

    setMessages(initialMessages);
    await streamResponse(initialMessages, gaps);
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setInterimTranscript("");

    await streamResponse(updatedMessages, skillGaps);
  };

  const streamResponse = async (msgs: Message[], gaps: SkillGap[]) => {
    setIsStreaming(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "adaptive-interview-chat",
        {
          body: { messages: msgs, userId, skillGaps: gaps },
        }
      );

      if (error) throw error;

      const reader = data.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = "";

      const assistantMessage: Message = {
        role: "assistant",
        content: "",
      };

      setMessages([...msgs, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || "";
              if (content) {
                accumulatedResponse += content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: "assistant",
                    content: accumulatedResponse,
                  };
                  return newMessages;
                });
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Speak the response if voice mode is enabled
      if (voiceMode && accumulatedResponse) {
        speak(accumulatedResponse);
      }
    } catch (error) {
      console.error("Streaming error:", error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const toggleVoiceMode = () => {
    const newMode = !voiceMode;
    setVoiceMode(newMode);
    
    if (newMode) {
      toast({
        title: "Voice Mode Enabled",
        description: "Click the microphone to start speaking",
      });
    } else {
      stopListening();
      stopSpeaking();
      toast({
        title: "Voice Mode Disabled",
        description: "Switched to text mode",
      });
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Adaptive Interview</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant={voiceMode ? "default" : "outline"}
              size="sm"
              onClick={toggleVoiceMode}
              className="gap-2"
            >
              {voiceMode ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              {voiceMode ? "Voice On" : "Voice Off"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Skill Gaps Sidebar */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="text-lg">Your Skill Gaps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {skillGaps.length === 0 ? (
                <p className="text-sm text-muted-foreground">No skill gaps identified</p>
              ) : (
                skillGaps.map((gap, index) => (
                  <div key={index} className="space-y-2">
                    <Badge variant="outline" className="w-full justify-start">
                      {gap.skill}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      Priority: {gap.importance}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-3 flex flex-col h-[calc(100vh-12rem)]">
            <CardHeader className="border-b border-border">
              <CardTitle>Interview Session</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isStreaming && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-border p-4">
                {voiceMode && (
                  <div className="mb-3 flex items-center gap-2">
                    <Button
                      type="button"
                      size="lg"
                      variant={isListening ? "destructive" : "default"}
                      onClick={toggleListening}
                      disabled={isStreaming || isSpeaking}
                      className="gap-2"
                    >
                      {isListening ? (
                        <>
                          <MicOff className="h-5 w-5" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="h-5 w-5" />
                          Start Recording
                        </>
                      )}
                    </Button>
                    {isListening && (
                      <Badge variant="secondary" className="animate-pulse">
                        Listening...
                      </Badge>
                    )}
                    {isSpeaking && (
                      <Badge variant="secondary" className="animate-pulse">
                        AI Speaking...
                      </Badge>
                    )}
                  </div>
                )}
                
                {interimTranscript && (
                  <div className="mb-2 p-2 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground italic">
                      {interimTranscript}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type your response or use voice mode..."
                    className="min-h-[60px] resize-none"
                    disabled={isStreaming || isListening}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isStreaming}
                    size="lg"
                    className="px-6"
                  >
                    {isStreaming ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdaptiveInterview;
