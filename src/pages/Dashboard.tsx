import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, FileText, LogOut, TrendingUp, Upload, Play, Target, Users } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);

      const { data: sessionsData } = await supabase
        .from("interview_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setSessions(sessionsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
            <Button variant="ghost" onClick={() => navigate("/learning-paths")}>
              Learning Paths
            </Button>
            <Button variant="ghost" onClick={() => navigate("/video-practice")}>
              Video Practice
            </Button>
            <Button variant="ghost" onClick={() => navigate("/job-market")}>
              Job Market
            </Button>
            <Button variant="ghost" onClick={() => navigate("/leaderboard")}>
              Leaderboard
            </Button>
            <Button variant="ghost" onClick={() => navigate("/profile")}>
              Profile
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {profile?.full_name || "User"}!</h2>
          <p className="text-muted-foreground">Ready to practice your interview skills?</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
          <Card className="hover:shadow-medium transition-shadow cursor-pointer" onClick={() => navigate("/interview/new")}>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-gradient-hero flex items-center justify-center mb-4">
                <Play className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle>Text Interview</CardTitle>
              <CardDescription>Practice with AI chat</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-medium transition-shadow cursor-pointer" onClick={() => navigate("/video-interview")}>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-destructive flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-destructive-foreground" />
              </div>
              <CardTitle>Video Practice</CardTitle>
              <CardDescription>Record & get AI feedback</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-medium transition-shadow cursor-pointer" onClick={() => navigate("/profile")}>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-secondary-foreground" />
              </div>
              <CardTitle>Upload Resume</CardTitle>
              <CardDescription>Get personalized questions</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-medium transition-shadow cursor-pointer" onClick={() => navigate("/learning-paths")}>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-accent-foreground" />
              </div>
              <CardTitle>Learning Paths</CardTitle>
              <CardDescription>Explore career roadmaps</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-medium transition-shadow cursor-pointer" onClick={() => navigate("/job-market")}>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-chart-1 flex items-center justify-center mb-4 bg-black">
                <TrendingUp className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle>Job Market</CardTitle>
              <CardDescription>AI trends & guidance</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-medium transition-shadow cursor-pointer" onClick={() => navigate("/adaptive-interview")}>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle>Adaptive Interview</CardTitle>
              <CardDescription>Skill gap practice</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-medium transition-shadow cursor-pointer" onClick={() => navigate("/peer-interviews")}>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-secondary-foreground" />
              </div>
              <CardTitle>Peer Interviews</CardTitle>
              <CardDescription>Practice with peers</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Interview Sessions</CardTitle>
            <CardDescription>Your practice history</CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No sessions yet. Start your first interview practice!
              </p>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{session.interview_type} Interview</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(session.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/interview/${session.id}`)}>
                      Continue
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
