import React, { useEffect, useRef, useState } from 'react';
import { useGroqVoice } from '@/hooks/useGroqVoice';
import { AudioVisualizer } from '@/components/AudioVisualizer';
import { LiveStatus } from '@/types/voice';
import { Mic, X, MessageSquare, Sparkles, Video, VideoOff, MicOff, Play, Send, LogOut, Layout, Code as CodeIcon, Monitor, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Editor from "@monaco-editor/react";
import { executeCode } from "@/utils/codeExecutor";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import ReactMarkdown from 'react-markdown';
import { Badge } from "@/components/ui/badge";

const ElitePrep: React.FC = () => {
    const navigate = useNavigate();
    const {
        status,
        connect,
        disconnect,
        isUserSpeaking,
        isAiSpeaking,
        volume,
        logs,
        sendHiddenContext
    } = useGroqVoice();

    const videoRef = useRef<HTMLVideoElement>(null);
    const [isVideoEnabled, setIsVideoEnabled] = useState(false);
    const [isMicEnabled, setIsMicEnabled] = useState(true);
    const [stream, setStream] = useState<MediaStream | null>(null);

    // Coding State
    const [code, setCode] = useState<string>("# Write your solution here\ndef solve():\n    pass");
    const [codeOutput, setCodeOutput] = useState<string>("");
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [activeTab, setActiveTab] = useState<'problem' | 'transcript'>('transcript');
    const [duration, setDuration] = useState(0);

    // Initial Setup
    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, []);

    // Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === LiveStatus.CONNECTED) {
            interval = setInterval(() => setDuration(d => d + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [status]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setStream(mediaStream);
            setIsVideoEnabled(true);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            toast.error("Could not access camera/microphone");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const toggleVideo = () => {
        if (stream) {
            stream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
            setIsVideoEnabled(!isVideoEnabled);
        }
    };

    const toggleMic = () => {
        if (stream) {
            stream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
            setIsMicEnabled(!isMicEnabled);
        }
    };

    const handleStartInterview = () => {
        // Prepare context for the AI
        const context = `
        ROLE: You are an Elite Technical Interviewer at a top tech company (like Google/Meta).
        TONE: Professional, encouraging, but rigorous.
        TASK: Conduct a full-loop technical interview.
        1. Start with a brief introduction and ask about their background.
        2. Swiftly move to a Coding Challenge. Generate a medium-hard algorithmic problem for them to solve in Python.
        3. As they code, ask socratic questions if they get stuck or make suboptimal choices.
        4. Review their code upon submission.
        
        Note: The user has a code editor open in front of them.
        `;
        connect(context);
    };

    const handleRunCode = async () => {
        setIsRunning(true);
        setCodeOutput("Running...");
        try {
            await executeCode(code, 'python',
                (log) => setCodeOutput(prev => prev === "Running..." ? log : prev + log),
                () => { }, 
                ""
            );
        } catch (err: any) {
            setCodeOutput(`Error: ${err.message}`);
        } finally {
            setIsRunning(false);
        }
    };

    const handleSubmitCode = async () => {
        setIsSubmitting(true);
        try {
            const prompt = `USER SUBMITTED CODE:\n\`\`\`python\n${code}\n\`\`\`\n\nOUTPUT:\n${codeOutput}\n\nINSTRUCTION: Review this code critically. Point out bugs, edge cases, or complexity issues. Ask the user to optimize or explain their logic.`;
            await sendHiddenContext(prompt);
            toast.success("Code submitted for review!");
        } catch (e) {
            toast.error("Failed to submit code");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEndSession = async () => {
        disconnect();
        stopCamera();
        navigate('/dashboard');
        toast.info("Interview session ended.");
    };

    return (
        <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden font-sans">
            
            {/* Header */}
            <header className="h-14 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-6 z-20">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-1.5 rounded-lg shadow-lg shadow-indigo-500/20">
                        <Monitor className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-sm tracking-wide">Elite Prep</h1>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                            <span className="flex items-center gap-1"><Video className="w-3 h-3" /> Video</span>
                            <span className="w-0.5 h-3 bg-border"></span>
                            <span className="flex items-center gap-1"><Mic className="w-3 h-3" /> Voice</span>
                            <span className="w-0.5 h-3 bg-border"></span>
                            <span className="flex items-center gap-1"><CodeIcon className="w-3 h-3" /> IDE</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {status === LiveStatus.CONNECTED && (
                        <Badge variant="outline" className="gap-2 bg-red-500/5 text-red-500 border-red-500/20 pr-3 rounded-full">
                            <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                            LIVE {formatTime(duration)}
                        </Badge>
                    )}
                    <Button variant="ghost" size="sm" onClick={handleEndSession} className="text-muted-foreground hover:text-destructive">
                        <LogOut className="w-4 h-4 mr-2" />
                        End Session
                    </Button>
                </div>
            </header>

            {/* Main Workspace */}
            <main className="flex-1 min-h-0 relative">
                <div className="absolute inset-0 z-0 bg-[#0a0a0a]">
                     <ResizablePanelGroup direction="horizontal">
                        
                        {/* LEFT: Interviewer / Feedback */}
                        <ResizablePanel defaultSize={35} minSize={25} maxSize={50} className="bg-[#111] border-r border-[#333] flex flex-col relative">
                            
                            {/* AI Agent Visualizer Area */}
                            <div className="relative h-1/2 min-h-[300px] border-b border-[#333] flex flex-col items-center justify-center bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f]">
                                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
                                
                                <div className="z-10 w-full max-w-[280px] aspect-square relative flex items-center justify-center">
                                    <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse"></div>
                                    <AudioVisualizer 
                                        isUserSpeaking={isUserSpeaking} 
                                        isAiSpeaking={isAiSpeaking} 
                                        volume={volume} 
                                    />
                                </div>

                                <div className="absolute bottom-6 left-0 w-full px-6 text-center">
                                    <h3 className="text-white/80 font-medium mb-1">AI Interviewer</h3>
                                    <p className="text-xs text-white/40">
                                        {isAiSpeaking ? "Speaking..." : isUserSpeaking ? "Listening..." : "Ready"}
                                    </p>
                                </div>

                                {/* Start Button Overlay */}
                                {status !== LiveStatus.CONNECTED && (
                                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                        <Button 
                                            size="lg" 
                                            onClick={handleStartInterview} 
                                            className="h-14 px-8 text-base bg-white text-black hover:bg-white/90 rounded-full font-bold shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all hover:scale-105"
                                        >
                                            <Play className="w-5 h-5 mr-2 fill-current" />
                                            Start Interview
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Transcript / Chat Area */}
                            <div className="flex-1 flex flex-col min-h-0 bg-[#0f0f0f]">
                                <div className="flex items-center gap-4 px-4 py-2 border-b border-[#333]">
                                    <button 
                                        onClick={() => setActiveTab('transcript')}
                                        className={`text-xs font-medium pb-2 border-b-2 transition-colors ${activeTab === 'transcript' ? 'text-white border-indigo-500' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
                                    >
                                        Live Transcript
                                    </button>
                                </div>
                                <ScrollArea className="flex-1 p-4">
                                    <div className="space-y-4">
                                        {logs.map((log) => (
                                            <div key={log.id} className={`flex gap-3 ${log.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                                 <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${log.role === 'assistant' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-gray-700 text-gray-300'}`}>
                                                    {log.role === 'assistant' ? <Sparkles className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                                </div>
                                                <div className={`bg-[#1e1e1e] p-3 rounded-xl text-xs leading-relaxed max-w-[85%] border border-[#333] ${log.role === 'assistant' ? 'text-gray-200' : 'text-gray-400'}`}>
                                                    {log.text.replace(/\[.*?\]/g, '')}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        
                            {/* User Video Float (PIP-style) */}
                            <div className="absolute bottom-4 right-4 w-40 aspect-video bg-black rounded-lg overflow-hidden border border-white/10 shadow-2xl ring-1 ring-black/50 z-30 group">
                                <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity ${isVideoEnabled ? 'opacity-100' : 'opacity-0'}`} />
                                {!isVideoEnabled && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a] text-muted-foreground">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                                                <VideoOff className="w-3 h-3" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Hover Controls */}
                                <div className="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/80 to-transparent flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={toggleVideo} className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors">
                                        {isVideoEnabled ? <Video className="w-3 h-3" /> : <VideoOff className="w-3 h-3" />}
                                    </button>
                                    <button onClick={toggleMic} className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors">
                                        {isMicEnabled ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                                    </button>
                                </div>
                            </div>

                        </ResizablePanel>
                        
                        <ResizableHandle className="bg-[#333] w-[1px]" />

                        {/* RIGHT: IDE */}
                        <ResizablePanel defaultSize={65} className="bg-[#1e1e1e] flex flex-col">
                            {/* Editor Header */}
                            <div className="h-10 border-b border-[#333] bg-[#252526] flex items-center justify-between px-4">
                                <span className="text-xs text-gray-400 flex items-center gap-2">
                                    <CodeIcon className="w-3 h-3" /> solution.py
                                </span>
                                <div className="flex items-center gap-2">
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        onClick={handleRunCode} 
                                        disabled={isRunning}
                                        className="h-7 text-xs hover:bg-[#333] text-green-400 hover:text-green-300"
                                    >
                                        <Play className="w-3 h-3 mr-1.5" /> Run Code
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        onClick={handleSubmitCode} 
                                        disabled={isSubmitting}
                                        className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white border-0"
                                    >
                                        <Send className="w-3 h-3 mr-1.5" /> Submit to Reviewer
                                    </Button>
                                </div>
                            </div>
                            
                            {/* Code Editor */}
                            <div className="flex-1 relative">
                                <Editor
                                    height="100%"
                                    defaultLanguage="python"
                                    theme="vs-dark"
                                    value={code}
                                    onChange={(val) => setCode(val || "")}
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 14,
                                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                        padding: { top: 16 }
                                    }}
                                />
                            </div>

                            {/* Terminal */}
                            <div className="h-40 border-t border-[#333] bg-[#0f0f0f] flex flex-col">
                                <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-gray-500 font-bold border-b border-[#333] flex items-center justify-between">
                                    <span>Console Output</span>
                                    <span className="w-2 h-2 rounded-full bg-green-500/20 border border-green-500/50"></span>
                                </div>
                                <ScrollArea className="flex-1 p-3 font-mono text-sm text-gray-300">
                                    <pre>{codeOutput || "waiting for output..."}</pre>
                                </ScrollArea>
                            </div>
                        </ResizablePanel>

                     </ResizablePanelGroup>
                </div>
            </main>
        </div>
    );
};

export default ElitePrep; 
