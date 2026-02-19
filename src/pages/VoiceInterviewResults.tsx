import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, CheckCircle, Clock, Trophy, RotateCcw, LayoutDashboard, Mic, MessageSquare } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import SixQAnalysis from "@/components/SixQAnalysis";

const VoiceInterviewResults = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [session, setSession] = useState<any>(null);

    useEffect(() => {
        loadSession();
    }, [id]);

    const loadSession = async () => {
        try {
            const { data, error } = await supabase
                .from("interview_sessions")
                .select("*")
                .eq("id", id)
                .single();

            if (error) throw error;
            setSession(data);

            // If session exists but hasn't been analyzed (no score), trigger analysis
            if (data && data.overall_score === null && !analyzing) {
                analyzeSession(data);
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error("Error loading session:", error);
            toast.error("Failed to load results");
            navigate("/dashboard");
        }
    };

    const analyzeSession = async (sessionData: any) => {
        setAnalyzing(true);
        try {
            // Format transcript for the edge function
            // sessionData.transcript is expected to be an array of { role, text/content }
            const messages = Array.isArray(sessionData.transcript)
                ? sessionData.transcript.map((msg: any) => ({
                    role: msg.role,
                    content: msg.text || msg.content
                }))
                : [];

            if (messages.length === 0) {
                throw new Error("No transcript available for analysis");
            }

            const { data, error } = await supabase.functions.invoke('evaluate-interview', {
                body: {
                    messages,
                    interview_type: 'voice'
                }
            });

            console.log("Edge Function response:", { data, error });

            if (error) {
                console.error("Edge Function error:", error);
                throw new Error(error.message || "Edge Function failed");
            }

            // Check if data contains an error field (from the Edge Function's error response)
            if (data && data.error) {
                console.error("Edge Function returned error:", data.error);
                throw new Error(data.error);
            }

            // Check if score exists (allow 0 as a valid score)
            if (!data || data.score === null || data.score === undefined) {
                console.error("Invalid response from Edge Function. Full data:", JSON.stringify(data, null, 2));
                throw new Error(`Invalid response from analysis service. Missing score field. Data: ${JSON.stringify(data)}`);
            }

            console.log("Analysis successful:", data);

            // Update session with results
            const { error: updateError } = await supabase
                .from("interview_sessions")
                .update({
                    overall_score: data.score,
                    six_q_score: data.six_q_score,
                    personality_cluster: data.personality_cluster,
                    status: 'completed',
                })
                .eq("id", id);

            if (updateError) throw updateError;

            // Reload session to get updated data
            const { data: updatedSession } = await supabase
                .from("interview_sessions")
                .select("*")
                .eq("id", id)
                .single();

            setSession({ ...updatedSession, evaluation: data }); // Attach evaluation data for display
        } catch (error: any) {
            console.error("Error analyzing session:", error);
            toast.error(`Failed to analyze interview: ${error.message || "Unknown error"}`);
        } finally {
            setAnalyzing(false);
            setLoading(false);
        }
    };

    if (loading || analyzing) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground animate-pulse">
                    {analyzing ? "AI is analyzing your voice interview..." : "Loading results..."}
                </p>
            </div>
        );
    }

    if (!session) return null;

    // Use evaluation data from state if available (freshly analyzed), otherwise fallback to what we might have stored
    // Note: We currently don't store the full 'evaluation' JSON in DB, just specific columns. 
    // So for persistent detailed feedback (strengths/weaknesses), we might need to add a column or rely on what we have.
    // For now, let's assume we want to display what we just got back or what we can.
    // If we reload the page, we might lose the detailed 'evaluation' object if not stored.
    // TODO: Add 'analysis_result' JSONB column to interview_sessions for full persistence.
    // For this iteration, we'll display what we have.

    const formatTime = (seconds: number) => {
        if (!seconds) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const evaluation = session.evaluation || {
        score: session.overall_score,
        six_q_score: session.six_q_score,
        personality_cluster: session.personality_cluster,
        // Mock/Default for missing details if reloaded
        feedback: "Analysis completed.",
        strengths: [],
        weaknesses: [],
        metrics: { technical_accuracy: 0, communication: 0, problem_solving: 0 }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-4xl w-full"
            >
                <Card className="border-border/50 shadow-2xl bg-card/50 backdrop-blur-xl overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-primary"></div>

                    <CardHeader className="text-center pt-12 pb-6">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6"
                        >
                            <Mic className="w-10 h-10 text-blue-500" />
                        </motion.div>
                        <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600">
                            Voice Interview Analysis
                        </CardTitle>
                        <p className="text-muted-foreground mt-2">
                            Here's how you performed in your voice session.
                        </p>
                    </CardHeader>

                    <CardContent className="space-y-8 px-8 pb-12">
                        {/* Score Section */}
                        <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-2xl border border-border/50">
                            <span className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">Overall Score</span>
                            <div className="relative flex items-center justify-center">
                                <svg className="w-32 h-32 transform -rotate-90">
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="60"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        className="text-muted/20"
                                    />
                                    <motion.circle
                                        initial={{ strokeDasharray: "377 377", strokeDashoffset: 377 }}
                                        animate={{ strokeDashoffset: 377 - (377 * (session.overall_score || 0)) / 100 }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        cx="64"
                                        cy="64"
                                        r="60"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        className="text-blue-500"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center flex-col">
                                    <span className="text-3xl font-bold">{session.overall_score || 0}%</span>
                                </div>
                            </div>

                            {session.total_duration_seconds && (
                                <div className="mt-4 flex items-center gap-2 text-muted-foreground bg-muted/50 px-3 py-1 rounded-full text-sm">
                                    <Clock className="w-4 h-4" />
                                    <span>{formatTime(session.total_duration_seconds)}</span>
                                </div>
                            )}
                        </div>

                        {/* 6Q Analysis */}
                        {(session.six_q_score || evaluation.six_q_score) && (
                            <div className="pt-4">
                                <SixQAnalysis
                                    scores={session.six_q_score || evaluation.six_q_score}
                                    cluster={session.personality_cluster || evaluation.personality_cluster}
                                />
                            </div>
                        )}

                        {/* Feedback Section */}
                        <div className="space-y-6">
                            {evaluation.feedback && (
                                <div className="p-5 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
                                    <h3 className="font-semibold text-primary flex items-center gap-2">
                                        <LayoutDashboard className="w-4 h-4" />
                                        AI Feedback
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {evaluation.feedback}
                                    </p>
                                </div>
                            )}

                            <div className="grid md:grid-cols-2 gap-4">
                                {/* Strengths */}
                                <div className="p-5 rounded-xl bg-green-500/5 border border-green-500/10 space-y-3">
                                    <div className="flex items-center gap-2 text-green-600 font-semibold">
                                        <CheckCircle className="w-5 h-5" />
                                        <h3>Key Strengths</h3>
                                    </div>
                                    <ul className="space-y-2">
                                        {evaluation.strengths && evaluation.strengths.length > 0 ? (
                                            evaluation.strengths.map((item: string, i: number) => (
                                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                                                    {item}
                                                </li>
                                            ))
                                        ) : (
                                            <li className="text-sm text-muted-foreground italic">No specific strengths identified.</li>
                                        )}
                                    </ul>
                                </div>

                                {/* Areas for Improvement */}
                                <div className="p-5 rounded-xl bg-red-500/5 border border-red-500/10 space-y-3">
                                    <div className="flex items-center gap-2 text-red-600 font-semibold">
                                        <RotateCcw className="w-5 h-5" />
                                        <h3>Areas for Improvement</h3>
                                    </div>
                                    <ul className="space-y-2">
                                        {evaluation.weaknesses && evaluation.weaknesses.length > 0 ? (
                                            evaluation.weaknesses.map((item: string, i: number) => (
                                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                                                    {item}
                                                </li>
                                            ))
                                        ) : (
                                            <li className="text-sm text-muted-foreground italic">No specific improvements identified.</li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Transcript Preview (Optional) */}
                        {session.transcript && (
                            <div className="mt-8">
                                <h3 className="font-semibold mb-4 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Transcript
                                </h3>
                                <div className="bg-muted/30 rounded-xl p-4 max-h-60 overflow-y-auto text-sm space-y-3">
                                    {Array.isArray(session.transcript) && session.transcript.map((msg: any, i: number) => (
                                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user'
                                                ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                                                : 'bg-muted text-foreground'
                                                }`}>
                                                <p>{msg.text || msg.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <Button
                                variant="outline"
                                className="flex-1 h-12"
                                onClick={() => navigate("/voice-assistant")}
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Start New Session
                            </Button>
                            <Button
                                className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/20"
                                onClick={() => navigate("/dashboard")}
                            >
                                <LayoutDashboard className="w-4 h-4 mr-2" />
                                Go to Dashboard
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default VoiceInterviewResults;
