import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, CheckCircle, Circle, BookOpen, Mic, Settings } from "lucide-react";
import { toast } from "sonner";

const LearningPaths = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [jobProfiles, setJobProfiles] = useState<any[]>([]);
  const [learningPaths, setLearningPaths] = useState<any[]>([]);
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const loadData = async () => {
    try {
      const { data: profiles } = await supabase
        .from("job_profiles")
        .select("*")
        .order("category");

      setJobProfiles(profiles || []);

      const { data: paths } = await supabase
        .from("learning_paths")
        .select("*")
        .order("priority");

      setLearningPaths(paths || []);

      if (user) {
        const { data: progress } = await supabase
          .from("user_progress")
          .select("*")
          .eq("user_id", user.id);

        setUserProgress(progress || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load learning paths");
    } finally {
      setLoading(false);
    }
  };

  const toggleProgress = async (pathId: string) => {
    if (!user) {
      toast.error("Please sign in to track your progress");
      navigate("/auth");
      return;
    }

    const existing = userProgress.find(p => p.learning_path_id === pathId);

    if (existing) {
      await supabase
        .from("user_progress")
        .update({ completed: !existing.completed, completed_at: !existing.completed ? new Date().toISOString() : null })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("user_progress")
        .insert({ user_id: user.id, learning_path_id: pathId, completed: true, completed_at: new Date().toISOString() });
    }

    loadData();
  };

  const isCompleted = (pathId: string) => {
    const progress = userProgress.find(p => p.learning_path_id === pathId);
    return progress?.completed || false;
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
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => user ? navigate("/dashboard") : navigate("/")}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">Voke</h1>
          </div>
          <nav className="flex items-center gap-4">
            {user && (
              <>
                <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                  Dashboard
                </Button>
                <ThemeToggle />
                <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
                  <Settings className="w-5 h-5" />
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            )}
            {!user && (
              <Button onClick={() => navigate("/auth")}>Sign In</Button>
            )}
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2">Learning Paths</h2>
          <p className="text-xl text-muted-foreground">Explore what you need to learn for different tech roles</p>
        </div>

        {/* Learning Paths */}
        {learningPaths.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-2">No Learning Paths Yet</h3>
            <p className="text-muted-foreground mb-6">Learning paths are being curated for you!</p>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Show paths grouped by job profile if profiles exist */}
            {jobProfiles.length > 0 ? (
              jobProfiles.map((profile) => {
                const pathsForProfile = learningPaths.filter(p => p.job_profile_id === profile.id);

                if (pathsForProfile.length === 0) return null;

                return (
                  <Card key={profile.id}>
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-lg bg-gradient-hero flex items-center justify-center text-3xl">
                          {profile.icon || "💼"}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-2xl mb-2">{profile.title}</CardTitle>
                          <CardDescription className="text-base">{profile.description}</CardDescription>
                          <span className="inline-block mt-2 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium">
                            {profile.category}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        {pathsForProfile.map((path) => (
                          <div
                            key={path.id}
                            className="flex items-start gap-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => toggleProgress(path.id)}
                          >
                            <div className="mt-0.5">
                              {isCompleted(path.id) ? (
                                <CheckCircle className="w-5 h-5 text-primary" />
                              ) : (
                                <Circle className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold mb-1">{path.title}</h4>
                              {path.description && (
                                <p className="text-sm text-muted-foreground">{path.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              /* Show all paths without grouping if no profiles */
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">All Learning Paths</CardTitle>
                  <CardDescription>Explore our curated learning paths</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {learningPaths.map((path) => (
                      <div
                        key={path.id}
                        className="flex items-start gap-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => toggleProgress(path.id)}
                      >
                        <div className="mt-0.5">
                          {isCompleted(path.id) ? (
                            <CheckCircle className="w-5 h-5 text-primary" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{path.title}</h4>
                          {path.description && (
                            <p className="text-sm text-muted-foreground">{path.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {!user && (
          <Card className="mt-8 bg-gradient-hero text-primary-foreground p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Sign in to track your progress</h3>
            <p className="mb-6 opacity-90">Create an account to mark items as completed and monitor your learning journey</p>
            <Button size="lg" className="bg-white text-primary hover:bg-white/90" onClick={() => navigate("/auth")}>
              Get Started
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
};

export default LearningPaths;
