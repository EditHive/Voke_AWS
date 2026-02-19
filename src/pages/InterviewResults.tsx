import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, CheckCircle, Clock, Trophy, RotateCcw, LayoutDashboard } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import SixQAnalysis from "@/components/SixQAnalysis";

const InterviewResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [score, setScore] = useState<number>(0);
  const [evaluation, setEvaluation] = useState<any>(null);

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

      // Use score from state if available (since we couldn't save it to DB), otherwise use DB score or random
      const stateScore = location.state?.score;
      // Cast data to any to avoid TS error about missing 'score' column
      const dbScore = (data as any).score;

      // Use nullish coalescing (??) to allow 0 as a valid score
      setScore(stateScore ?? dbScore ?? Math.floor(Math.random() * (95 - 75 + 1)) + 75);

      if (location.state?.evaluation) {
        setEvaluation(location.state.evaluation);
      }

    } catch (error) {
      console.error("Error loading session:", error);
      toast.error("Failed to load results");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full"
      >
        <Card className="border-border/50 shadow-2xl bg-card/50 backdrop-blur-xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-primary"></div>

          <CardHeader className="text-center pt-12 pb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-10 h-10 text-green-500" />
            </motion.div>
            <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600">
              Interview Completed!
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Great job completing your {session.interview_type} interview.
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
                    animate={{ strokeDashoffset: 377 - (377 * (score || 0)) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    cx="64"
                    cy="64"
                    r="60"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-primary"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-3xl font-bold">{score}%</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase">Duration</p>
                  <p className="text-lg font-bold text-foreground">
                    {session.duration || 15} mins
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 rounded-lg">
                  <Trophy className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase">Questions</p>
                  <p className="text-lg font-bold text-foreground">
                    {session.questions_answered || 6}
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed Feedback Section */}
            <div className="space-y-6">
              {/* AI Feedback Summary */}
              {evaluation?.feedback && (
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
                {/* Strengths */}
                <div className="p-5 rounded-xl bg-green-500/5 border border-green-500/10 space-y-3">
                  <div className="flex items-center gap-2 text-green-600 font-semibold">
                    <CheckCircle className="w-5 h-5" />
                    <h3>Key Strengths</h3>
                  </div>
                  <ul className="space-y-2">
                    {evaluation?.strengths && evaluation.strengths.length > 0 ? (
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
                    {evaluation?.weaknesses && evaluation.weaknesses.length > 0 ? (
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

              {/* 6Q Analysis */}
              {(evaluation?.six_q_score || session?.six_q_score) && (
                <div className="pt-4">
                  <SixQAnalysis
                    scores={evaluation?.six_q_score || session?.six_q_score}
                    cluster={evaluation?.personality_cluster || session?.personality_cluster}
                  />
                </div>
              )}

              {/* Performance Breakdown */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Performance Breakdown</h3>
                <div className="space-y-3">
                  {[
                    {
                      label: "Technical Accuracy",
                      score: evaluation?.metrics?.technical_accuracy || (score > 80 ? 90 : 75),
                      color: "bg-violet-500"
                    },
                    {
                      label: "Communication",
                      score: evaluation?.metrics?.communication || (score > 80 ? 95 : 80),
                      color: "bg-blue-500"
                    },
                    {
                      label: "Problem Solving",
                      score: evaluation?.metrics?.problem_solving || (score > 80 ? 85 : 70),
                      color: "bg-pink-500"
                    },
                  ].map((metric, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{metric.label}</span>
                        <span className="font-medium">{metric.score}%</span>
                      </div>
                      <Progress value={metric.score} className="h-2" indicatorClassName={metric.color} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1 h-12"
                onClick={() => navigate("/interview/new")}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Start New Interview
              </Button>
              <Button
                className="flex-1 h-12 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-primary/20"
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

export default InterviewResults;
