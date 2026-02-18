import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, LogOut, TrendingUp, Upload, Play, Target, Users, Mic, Settings } from "lucide-react";
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
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">Voke</h1>
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
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
              <Settings className="w-5 h-5" />
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
          <Card className="hover:shadow-medium transition-shadow cursor-pointer group overflow-hidden relative" onClick={() => navigate("/interview/new")}>
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-600/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <img src="/images/icon_software_dev.png" alt="Text Interview" className="w-10 h-10 object-contain drop-shadow-md" />
              </div>
              <CardTitle>Text Interview</CardTitle>
              <CardDescription>Practice with AI chat</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-medium transition-shadow cursor-pointer group overflow-hidden relative" onClick={() => navigate("/video-interview")}>
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500/10 to-pink-600/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <img src="/images/icon_video_practice.png" alt="Video Practice" className="w-10 h-10 object-contain drop-shadow-md" />
              </div>
              <CardTitle>Video Practice</CardTitle>
              <CardDescription>Record & get AI feedback</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-medium transition-shadow cursor-pointer group overflow-hidden relative" onClick={() => navigate("/profile")}>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <img src="/images/icon_resume_analysis.png" alt="Upload Resume" className="w-10 h-10 object-contain drop-shadow-md" />
              </div>
              <CardTitle>Upload Resume</CardTitle>
              <CardDescription>Get personalized questions</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-medium transition-shadow cursor-pointer group overflow-hidden relative" onClick={() => navigate("/learning-paths")}>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-600/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <img src="/images/icon_data_scientist.png" alt="Learning Paths" className="w-10 h-10 object-contain drop-shadow-md" />
              </div>
              <CardTitle>Learning Paths</CardTitle>
              <CardDescription>Explore career roadmaps</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-medium transition-shadow cursor-pointer group overflow-hidden relative" onClick={() => navigate("/job-market")}>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-600/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <img src="/images/icon_job_market.png" alt="Job Market" className="w-10 h-10 object-contain drop-shadow-md" />
              </div>
              <CardTitle>Job Market</CardTitle>
              <CardDescription>AI trends & guidance</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-medium transition-shadow cursor-pointer group overflow-hidden relative" onClick={() => navigate("/adaptive-interview")}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/10 to-violet-600/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <img src="/images/icon_role_practice.png" alt="Adaptive Interview" className="w-10 h-10 object-contain drop-shadow-md" />
              </div>
              <CardTitle>Adaptive Interview</CardTitle>
              <CardDescription>Skill gap practice</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-medium transition-shadow cursor-pointer group overflow-hidden relative" onClick={() => navigate("/peer-interviews")}>
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-600/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <img src="/images/icon_product_manager.png" alt="Peer Interviews" className="w-10 h-10 object-contain drop-shadow-md" />
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
