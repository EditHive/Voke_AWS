import React, { useEffect, useRef, useState } from 'react';
import { useGeminiLive } from '@/hooks/useGeminiLive';
import { AudioVisualizer } from '@/components/AudioVisualizer';
import { LiveStatus } from '@/types/voice';
import { Mic, X, MessageSquare, Sparkles, AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const VoiceAssistant: React.FC = () => {
    const navigate = useNavigate();
    const {
        status,
        connect,
        disconnect,
        isUserSpeaking,
        isAiSpeaking,
        volume,
        logs
    } = useGeminiLive();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [userContext, setUserContext] = useState<string>('');
    const [loadingContext, setLoadingContext] = useState(true);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [logs]);

    useEffect(() => {
        loadUserContext();
    }, []);

    const loadUserContext = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/auth');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profile) {
                let context = `User Name: ${profile.full_name || 'Candidate'}\n`;
                if (profile.linkedin_url) context += `LinkedIn Profile: ${profile.linkedin_url}\n`;
                if (profile.github_url) context += `GitHub Profile: ${profile.github_url}\n`;
                if (profile.resume_url) context += `Resume URL: ${profile.resume_url}\n`;

                // Add instruction to ask about these
                context += `\nINSTRUCTION: The user has provided the above profile links. Start by greeting them by name. Then, ask them to tell you about a specific project or experience from their resume or GitHub if available, or ask about their professional background from LinkedIn. Do not just list the URLs. Act as if you have read them.`;

                setUserContext(context);
            }
        } catch (error) {
            console.error('Error loading context:', error);
            toast.error('Failed to load profile context');
        } finally {
            setLoadingContext(false);
        }
    };

    const handleConnect = () => {
        connect(userContext);
    };

    // Handle errors or disconnects with a visual cue
    const isError = status === LiveStatus.ERROR;
    const isConnected = status === LiveStatus.CONNECTED;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">

            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl mix-blend-screen animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl mix-blend-screen animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="absolute top-4 left-4 z-20">
                <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800" onClick={() => navigate('/dashboard')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Button>
            </div>

            <div className="z-10 w-full max-w-md flex flex-col gap-6">

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-slate-400">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span>AI Interviewer</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Voice Assistant</h1>
                    <p className="text-slate-400 text-sm">
                        {loadingContext ? "Loading profile..." : "Ready to interview you based on your profile."}
                    </p>
                </div>

                {/* Visualizer Area */}
                <div className="relative bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm shadow-2xl transition-all duration-500 min-h-[320px]">
                    {/* Connection Status Overlay */}
                    {status === LiveStatus.CONNECTING && (
                        <div className="absolute inset-0 flex items-center justify-center z-20 bg-slate-950/80 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm font-medium text-slate-300">Connecting...</span>
                            </div>
                        </div>
                    )}

                    {isError && (
                        <div className="absolute inset-0 flex items-center justify-center z-20 bg-slate-950/80 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-3 text-red-400">
                                <AlertCircle className="w-10 h-10" />
                                <span className="text-sm font-medium">Connection Error</span>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="mt-2 px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-xs text-white transition-colors"
                                >
                                    Reload
                                </button>
                            </div>
                        </div>
                    )}

                    <AudioVisualizer
                        isUserSpeaking={isUserSpeaking}
                        isAiSpeaking={isAiSpeaking}
                        volume={volume}
                    />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-6">
                    {!isConnected ? (
                        <button
                            onClick={handleConnect}
                            disabled={status === LiveStatus.CONNECTING || loadingContext}
                            className="group relative flex items-center justify-center w-20 h-20 bg-blue-600 hover:bg-blue-500 rounded-full shadow-lg hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="absolute inset-0 rounded-full border-2 border-white/20 group-hover:scale-110 transition-transform duration-300"></div>
                            <Mic className="w-8 h-8 text-white" />
                        </button>
                    ) : (
                        <button
                            onClick={disconnect}
                            className="group relative flex items-center justify-center w-20 h-20 bg-red-500 hover:bg-red-400 rounded-full shadow-lg hover:shadow-red-500/25 transition-all duration-300"
                        >
                            <div className="absolute inset-0 rounded-full border-2 border-white/20 group-hover:scale-110 transition-transform duration-300"></div>
                            <X className="w-8 h-8 text-white" />
                        </button>
                    )}
                </div>

                {/* Transcript Log (Optional but useful for context) */}
                {isConnected && logs.length > 0 && (
                    <div className="mt-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/50 backdrop-blur-sm max-h-48 overflow-y-auto custom-scrollbar">
                        <div className="flex items-center gap-2 mb-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                            <MessageSquare className="w-3 h-3" />
                            <span>Transcript</span>
                        </div>
                        <div className="flex flex-col gap-3">
                            {logs.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'user'
                                            ? 'bg-blue-600/20 text-blue-100 rounded-tr-sm'
                                            : 'bg-slate-800/50 text-slate-300 rounded-tl-sm'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                )}
            </div>

            {/* Instructions / Footer */}
            {!isConnected && (
                <div className="absolute bottom-8 text-center text-slate-500 text-xs max-w-sm px-4">
                    <p>Make sure your microphone is enabled.</p>
                    <p className="mt-1">Powered by Google Gemini 2.5 Native Audio API.</p>
                </div>
            )}

            {/* Tailwind Custom Scrollbar Hack */}
            <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.5);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.8);
          border-radius: 4px;
        }
      `}</style>
        </div>
    );
};

export default VoiceAssistant;
