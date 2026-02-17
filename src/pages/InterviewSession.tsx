import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Brain, LogOut, Send, CheckCircle, Mic, MicOff, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { useVoiceChat } from "@/hooks/useVoiceChat";

interface Message {
  role: "assistant" | "user";
  content: string;
}

const InterviewSession = () => {
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
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {session && getInterviewTypeDisplay(session.interview_type)}
                </h1>
                <p className="text-sm text-muted-foreground">AI Interview Practice</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={toggleVoiceMode} 
                variant={voiceMode ? "default" : "outline"} 
                size="sm"
              >
                {voiceMode ? (
                  <>
                    <MicOff className="h-4 w-4 mr-2" />
                    Disable Voice
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Enable Voice
                  </>
                )}
              </Button>
              <Button onClick={endInterview} variant="outline" size="sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                End Interview
              </Button>
              <Button onClick={handleLogout} variant="ghost" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col container mx-auto px-4 py-6 max-w-4xl">
        {voiceMode && (
          <div className="flex justify-center mb-4">
            <Badge variant="secondary" className="text-sm">
              {isListening && <Mic className="h-3 w-3 mr-1 animate-pulse" />}
              {isSpeaking && <Volume2 className="h-3 w-3 mr-1 animate-pulse" />}
              {isListening && !isSpeaking && "Listening..."}
              {isSpeaking && "AI Speaking..."}
              {!isListening && !isSpeaking && "Voice Mode Active"}
            </Badge>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <Card
                className={`max-w-[85%] p-4 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
              </Card>
            </div>
          ))}

          {interimTranscript && (
            <div className="flex justify-end">
              <Card className="max-w-[85%] p-4 bg-primary/50 text-primary-foreground border-dashed">
                <div className="whitespace-pre-wrap italic">{interimTranscript}</div>
              </Card>
            </div>
          )}

          {streamingMessage && (
            <div className="flex justify-start">
              <Card className="max-w-[85%] p-4 bg-muted">
                <div className="whitespace-pre-wrap">{streamingMessage}</div>
              </Card>
            </div>
          )}

          {sending && !streamingMessage && (
            <div className="flex justify-start">
              <Card className="max-w-[85%] p-4 bg-muted">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span>AI is thinking...</span>
                </div>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-border pt-4">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder={voiceMode ? "Speak or type your answer..." : "Type your answer..."}
              className="flex-1"
              rows={3}
              disabled={(voiceMode && isListening) || sending}
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || sending || (voiceMode && isListening)}
              size="icon"
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InterviewSession;
