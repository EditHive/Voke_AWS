import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, LogOut, Play } from "lucide-react";
import { toast } from "sonner";

const InterviewNew = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [jobProfiles, setJobProfiles] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
    loadJobProfiles();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadJobProfiles = async () => {
    const { data } = await supabase
      .from("job_profiles")
      .select("*")
      .order("title");
    setJobProfiles(data || []);
  };

  const startInterview = async (type: string, jobProfileId?: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get resume content if available
      const { data: profile } = await supabase
        .from("profiles")
        .select("resume_url")
        .eq("id", user.id)
        .single();

      const { data: session, error } = await supabase
        .from("interview_sessions")
        .insert({
          user_id: user.id,
          interview_type: type,
          job_profile_id: jobProfileId,
          status: "in_progress",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Interview session started!");
      navigate(`/interview/${session.id}`);
    } catch (error) {
      console.error("Error starting interview:", error);
      toast.error("Failed to start interview");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

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
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Start New Interview</h2>
          <p className="text-muted-foreground">Choose your interview type to begin practicing</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-medium transition-shadow">
            <CardHeader>
              <CardTitle>General Interview</CardTitle>
              <CardDescription>Practice common interview questions and behavioral scenarios</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => startInterview("general")}
                disabled={loading}
              >
                <Play className="w-4 h-4 mr-2" />
                Start General Interview
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-medium transition-shadow">
            <CardHeader>
              <CardTitle>Technical Interview</CardTitle>
              <CardDescription>Focus on technical skills, coding, and problem-solving</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => startInterview("technical")}
                disabled={loading}
              >
                <Play className="w-4 h-4 mr-2" />
                Start Technical Interview
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-medium transition-shadow">
            <CardHeader>
              <CardTitle>Behavioral Interview</CardTitle>
              <CardDescription>Practice STAR method and soft skills questions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => startInterview("behavioral")}
                disabled={loading}
              >
                <Play className="w-4 h-4 mr-2" />
                Start Behavioral Interview
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-medium transition-shadow">
            <CardHeader>
              <CardTitle>Resume-Based Interview</CardTitle>
              <CardDescription>Get questions based on your uploaded resume</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => startInterview("resume")}
                disabled={loading}
              >
                <Play className="w-4 h-4 mr-2" />
                Start Resume Interview
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Role-Specific Interviews */}
        {jobProfiles.length > 0 && (
          <>
            <h3 className="text-2xl font-bold mb-4">Role-Specific Interviews</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {jobProfiles.map((profile) => (
                <Card key={profile.id} className="hover:shadow-medium transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{profile.icon || "💼"}</span>
                      <CardTitle>{profile.title}</CardTitle>
                    </div>
                    <CardDescription>{profile.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full"
                      variant="secondary"
                      onClick={() => startInterview("role-specific", profile.id)}
                      disabled={loading}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start {profile.title} Interview
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default InterviewNew;
