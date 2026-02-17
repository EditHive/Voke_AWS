import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, LogOut, ArrowLeft, TrendingUp, Eye, MessageSquare, Award } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const VideoInterviewResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    loadResults();
  }, [id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadResults = async () => {
    try {
      const { data, error } = await supabase
        .from("video_interview_sessions")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setSession(data);
    } catch (error) {
      console.error("Error loading results:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Session Not Found</CardTitle>
            <CardDescription>The video interview session could not be found</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/dashboard")}>Return to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">Quantum Query</h1>
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Button variant="ghost" onClick={() => navigate("/video-practice")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Video Practice
        </Button>

        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Interview Analysis Results</h2>
          <p className="text-muted-foreground">Detailed feedback on your performance</p>
        </div>

        {/* Overall Score */}
        <Card className="mb-6 bg-gradient-hero text-primary-foreground">
          <CardContent className="pt-6">
            <div className="text-center">
              <Award className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Overall Score</h3>
              <div className="text-6xl font-bold mb-2">{session.overall_score || 0}</div>
              <p className="text-lg opacity-90">out of 100</p>
            </div>
          </CardContent>
        </Card>

        {/* Question */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Interview Question</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{session.question}</p>
          </CardContent>
        </Card>

        {/* Score Breakdown */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <CardTitle>Delivery</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(session.delivery_score || 0)}`}>
                {session.delivery_score || 0}
              </div>
              <Progress value={session.delivery_score || 0} className="mb-2" />
              <p className="text-sm text-muted-foreground">
                Speech clarity, pace, and articulation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                <CardTitle>Body Language</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(session.body_language_score || 0)}`}>
                {session.body_language_score || 0}
              </div>
              <Progress value={session.body_language_score || 0} className="mb-2" />
              <p className="text-sm text-muted-foreground">
                Posture, gestures, and facial expressions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <CardTitle>Confidence</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(session.confidence_score || 0)}`}>
                {session.confidence_score || 0}
              </div>
              <Progress value={session.confidence_score || 0} className="mb-2" />
              <p className="text-sm text-muted-foreground">
                Overall presence and assurance
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Feedback */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Detailed Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              {session.feedback_summary ? (
                <div dangerouslySetInnerHTML={{ __html: session.feedback_summary.replace(/\n/g, "<br>") }} />
              ) : (
                <p className="text-muted-foreground">Analysis is still in progress...</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Analysis Details */}
        {session.analysis_result && (
          <Card>
            <CardHeader>
              <CardTitle>Key Observations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {session.analysis_result.strengths && (
                  <div>
                    <h4 className="font-semibold text-green-600 mb-2">✅ Strengths</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {session.analysis_result.strengths.map((strength: string, idx: number) => (
                        <li key={idx}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {session.analysis_result.improvements && (
                  <div>
                    <h4 className="font-semibold text-yellow-600 mb-2">⚠️ Areas for Improvement</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {session.analysis_result.improvements.map((improvement: string, idx: number) => (
                        <li key={idx}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-4 justify-center mt-8">
          <Button size="lg" onClick={() => navigate("/video-interview")}>
            Practice Another Question
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
};

export default VideoInterviewResults;
