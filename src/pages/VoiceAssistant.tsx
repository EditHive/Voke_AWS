import React, { useEffect, useRef, useState } from 'react';
import { useGroqVoice } from '@/hooks/useGroqVoice';
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
        logs,
        errorDetails,
    } = useGroqVoice();

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

    const [duration, setDuration] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (status === LiveStatus.CONNECTED) {
            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [status]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const loadUserContext = async () => {
        try {
            console.log('[VoiceAssistant] Starting loadUserContext...');
            const { data: { user } } = await supabase.auth.getUser();
            console.log('[VoiceAssistant] User:', user?.id);

            if (!user) {
                console.error('[VoiceAssistant] No user found, redirecting to auth');
                navigate('/auth');
                return;
            }

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            console.log('[VoiceAssistant] Profile:', profile);
            console.log('[VoiceAssistant] Profile error:', profileError);

            if (profile) {
                let context = `User Name: ${profile.full_name || 'Candidate'}\n`;
                let projectCount = 0;

                // Add coding stats if available
                const codingStats = (profile as any).coding_stats;
                if (codingStats) {
                    const cfRating = codingStats.codeforces?.rating;
                    const lcSolved = codingStats.leetcode?.submitStats?.find((s: any) => s.difficulty === "All")?.count;

                    if (cfRating || lcSolved) {
                        context += `\nCODING PROFILE:\n`;
                        if (cfRating) context += `- Codeforces Rating: ${cfRating}\n`;
                        if (lcSolved) context += `- LeetCode Problems Solved: ${lcSolved}\n`;
                    }
                }

                // Fetch GitHub context
                if (profile.github_url) {
                    console.log('[VoiceAssistant] Fetching GitHub context for:', profile.github_url);
                    try {
                        const githubToken = import.meta.env.VITE_GITHUB_TOKEN;
                        console.log('[VoiceAssistant] GitHub token available:', !!githubToken);

                        // Extract username from GitHub URL
                        const usernameMatch = profile.github_url.match(/github\.com\/([^\/]+)/);
                        if (!usernameMatch) {
                            console.warn('[VoiceAssistant] Invalid GitHub URL format');
                            context += `GitHub Profile: ${profile.github_url}\n`;
                        } else {
                            const username = usernameMatch[1];

                            // Fetch repos with README content
                            const headers: Record<string, string> = {
                                'Accept': 'application/vnd.github.v3+json',
                                'User-Agent': 'Voke-Interview-App'
                            };

                            if (githubToken) {
                                headers['Authorization'] = `token ${githubToken}`;
                            }

                            const reposResponse = await fetch(
                                `https://api.github.com/users/${username}/repos?sort=updated&per_page=5`,
                                { headers }
                            );

                            if (reposResponse.ok) {
                                const repos = await reposResponse.json();
                                projectCount = repos.length;

                                // Fetch README for each repo
                                const projectSummaries = await Promise.all(
                                    repos.map(async (repo: any) => {
                                        let readmeSummary = 'No README available';

                                        try {
                                            const readmeResponse = await fetch(
                                                `https://api.github.com/repos/${username}/${repo.name}/readme`,
                                                { headers }
                                            );

                                            if (readmeResponse.ok) {
                                                const readmeData = await readmeResponse.json();
                                                const decodedContent = atob(readmeData.content);
                                                readmeSummary = decodedContent.substring(0, 300).replace(/[#*`\n]/g, ' ').trim();
                                            }
                                        } catch (e) {
                                            console.log(`[VoiceAssistant] No README for ${repo.name}`);
                                        }

                                        return `Project: ${repo.name}\n- Description: ${repo.description || 'No description'}\n- Tech: ${repo.language || 'Not specified'}\n- Stars: ${repo.stargazers_count}\n- Summary: ${readmeSummary}`;
                                    })
                                );

                                context += `\nGITHUB PROJECTS:\n${projectSummaries.join('\n\n')}\n`;
                                console.log('[VoiceAssistant] ✓ GitHub projects loaded with READMEs:', projectCount);
                            } else {
                                console.warn('[VoiceAssistant] GitHub API error:', reposResponse.status);
                                context += `GitHub Profile: ${profile.github_url}\n`;
                            }
                        }
                    } catch (e) {
                        console.error('[VoiceAssistant] Failed to fetch GitHub context:', e);
                        context += `GitHub Profile: ${profile.github_url}\n`;
                    }
                } else {
                    console.log('[VoiceAssistant] No GitHub URL in profile');
                    context += `GitHub Profile: Not provided\n`;
                }

                // Parse resume PDF if available
                if (profile.resume_url) {
                    console.log('[VoiceAssistant] Fetching resume from:', profile.resume_url);
                    try {
                        const resumeResponse = await fetch(profile.resume_url);
                        console.log('[VoiceAssistant] Resume fetch status:', resumeResponse.status);

                        const resumeBlob = await resumeResponse.blob();
                        console.log('[VoiceAssistant] Resume blob size:', resumeBlob.size, 'type:', resumeBlob.type);

                        // Dynamically import pdfjs
                        const pdfjsLib = await import('pdfjs-dist');
                        // Use the correct worker from node_modules
                        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
                            'pdfjs-dist/build/pdf.worker.min.mjs',
                            import.meta.url
                        ).toString();

                        const arrayBuffer = await resumeBlob.arrayBuffer();
                        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                        console.log('[VoiceAssistant] PDF loaded, pages:', pdf.numPages);

                        let resumeText = '';
                        for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
                            const page = await pdf.getPage(i);
                            const textContent = await page.getTextContent();
                            const pageText = textContent.items.map((item: any) => item.str).join(' ');
                            resumeText += pageText + '\n';
                        }

                        // Clean and truncate resume text
                        resumeText = resumeText.replace(/\s+/g, ' ').trim().substring(0, 2000);
                        context += `\nRESUME CONTENT:\n${resumeText}\n`;
                        console.log('[VoiceAssistant] ✓ Resume parsed successfully, length:', resumeText.length);
                    } catch (e) {
                        console.error('[VoiceAssistant] Failed to parse resume:', e);
                        context += `Resume URL: ${profile.resume_url}\n`;
                    }
                } else {
                    console.log('[VoiceAssistant] No resume URL in profile');
                }

                if (profile.linkedin_url) context += `LinkedIn Profile: ${profile.linkedin_url}\n`;

                // Add instruction
                if (projectCount > 0) {
                    context += `\nINSTRUCTION: You have detailed information about the user's ${projectCount} GitHub projects and their resume. You know about ALL of them. Start by greeting them warmly by name. Then, instead of just asking generic questions, **ask creative, unconventional, and thought-provoking questions** to test their problem-solving and adaptability. Mix these with specific technical questions about their projects.`;
                } else {
                    context += `\nINSTRUCTION: Start by greeting the user warmly by name. Then, **ask creative, unconventional, and thought-provoking questions** to test their problem-solving and adaptability. Avoid generic "tell me about yourself" questions.`;
                }

                console.log('[VoiceAssistant] Final context length:', context.length);
                console.log('[VoiceAssistant] Full context:', context);
                setUserContext(context);
            }
        } catch (error) {
            console.error('[VoiceAssistant] Error loading context:', error);
            toast.error('Failed to load profile context');
            // Set minimal context so the interview can still proceed
            setUserContext('User Name: Candidate\nINSTRUCTION: Greet the user and ask them a creative, unconventional interview question.');
        } finally {
            setLoadingContext(false);
        }
    };

    const handleEndInterview = async () => {
        if (logs.length === 0) {
            toast.error("No conversation to analyze yet.");
            return;
        }

        disconnect();
        const toastId = toast.loading("Saving session...");

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            const { data, error } = await supabase
                .from('interview_sessions')
                .insert({
                    user_id: user.id,
                    role: 'Voice Interviewer',
                    time_limit_minutes: 0, // Unlimited
                    status: 'completed',
                    interview_type: 'voice',
                    interview_mode: 'voice',
                    transcript: logs, // Save the full logs
                    total_duration_seconds: duration,
                    created_at: new Date().toISOString()
                } as any)
                .select()
                .single();

            if (error) throw error;

            toast.dismiss(toastId);
            toast.success("Session saved!");
            navigate(`/voice-interview/results/${data.id}`);

        } catch (error: any) {
            console.error("Error saving session:", error);
            toast.dismiss(toastId);
            toast.error(`Failed to save session: ${error.message || error.error_description || "Unknown error"}`);
        }
    };

    const handleConnect = () => {
        connect(userContext);
    };

    // Handle errors or disconnects with a visual cue
    const isError = status === LiveStatus.ERROR;
    const isConnected = status === LiveStatus.CONNECTED;

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden">

            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl mix-blend-screen animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl mix-blend-screen animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="absolute top-4 left-4 z-20">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-accent" onClick={() => navigate('/dashboard')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Button>
            </div>

            <div className="z-10 w-full max-w-md flex flex-col gap-6">

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border text-xs font-medium text-muted-foreground">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            <span>AI Interviewer</span>
                        </div>
                        {status === LiveStatus.CONNECTED && (
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border text-xs font-medium text-muted-foreground font-mono">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span>{formatTime(duration)}</span>
                            </div>
                        )}
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Voice Interview</h1>
                    <p className="text-muted-foreground text-sm">
                        {loadingContext ? "Loading profile..." : "Ready to interview you based on your profile."}
                    </p>
                </div>

                {/* Visualizer Area */}
                <div className="relative bg-card/50 border border-border rounded-3xl overflow-hidden backdrop-blur-sm shadow-2xl transition-all duration-500 min-h-[320px]">
                    {/* Connection Status Overlay */}
                    {status === LiveStatus.CONNECTING && (
                        <div className="absolute inset-0 flex items-center justify-center z-20 bg-background/80 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm font-medium text-muted-foreground">Connecting...</span>
                            </div>
                        </div>
                    )}

                    {isError && (
                        <div className="absolute inset-0 flex items-center justify-center z-20 bg-background/80 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-3 text-destructive p-4 text-center">
                                <AlertCircle className="w-10 h-10" />
                                <span className="text-sm font-medium">Connection Error</span>
                                {errorDetails && (
                                    <p className="text-xs text-destructive/80 mt-1 max-w-[200px] break-words">
                                        {errorDetails}
                                    </p>
                                )}
                                <button
                                    onClick={() => window.location.reload()}
                                    className="mt-2 px-4 py-2 bg-accent rounded-lg hover:bg-accent/80 text-xs text-foreground transition-colors"
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
                            className="group relative flex items-center justify-center w-20 h-20 bg-primary hover:bg-primary/90 rounded-full shadow-lg hover:shadow-primary/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="absolute inset-0 rounded-full border-2 border-white/20 group-hover:scale-110 transition-transform duration-300"></div>
                            <Mic className="w-8 h-8 text-primary-foreground" />
                        </button>
                    ) : (
                        <div className="flex gap-4">
                            <button
                                onClick={disconnect}
                                className="group relative flex items-center justify-center w-16 h-16 bg-muted hover:bg-muted/80 rounded-full shadow-lg transition-all duration-300"
                                title="Mute/Pause"
                            >
                                <X className="w-6 h-6 text-foreground" />
                            </button>
                            <button
                                onClick={handleEndInterview}
                                className="group relative flex items-center justify-center w-20 h-20 bg-destructive hover:bg-destructive/90 rounded-full shadow-lg hover:shadow-destructive/25 transition-all duration-300"
                                title="End Interview & Get Results"
                            >
                                <div className="absolute inset-0 rounded-full border-2 border-white/20 group-hover:scale-110 transition-transform duration-300"></div>
                                <MessageSquare className="w-8 h-8 text-destructive-foreground" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Transcript Log (Optional but useful for context) */}
                {isConnected && logs.length > 0 && (
                    <div className="mt-4 p-4 rounded-2xl bg-card/40 border border-border/50 backdrop-blur-sm max-h-48 overflow-y-auto custom-scrollbar">
                        <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                            <MessageSquare className="w-3 h-3" />
                            <span>Transcript</span>
                        </div>
                        <div className="flex flex-col gap-3">
                            {logs.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'user'
                                        ? 'bg-primary/20 text-primary-foreground rounded-tr-sm'
                                        : 'bg-muted/50 text-muted-foreground rounded-tl-sm'
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
                <div className="absolute bottom-8 text-center text-muted-foreground text-xs max-w-sm px-4">
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
