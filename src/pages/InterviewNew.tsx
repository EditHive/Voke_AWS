import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Brain, MessageSquare, Sparkles, Mic, LogOut, Play, Settings, Code, FileText, Briefcase, Server, Database, Cloud, Palette, BarChart, Laptop } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "motion/react";

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

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const getRoleIcon = (title: string) => {
    const titleLower = title.toLowerCase();

    if (titleLower.includes('backend')) {
      return { icon: Server, gradient: 'from-purple-500 to-indigo-600', shadow: 'shadow-purple-500/50' };
    } else if (titleLower.includes('data') || titleLower.includes('scientist')) {
      return { icon: BarChart, gradient: 'from-cyan-500 to-blue-600', shadow: 'shadow-cyan-500/50' };
    } else if (titleLower.includes('devops')) {
      return { icon: Cloud, gradient: 'from-teal-500 to-cyan-600', shadow: 'shadow-teal-500/50' };
    } else if (titleLower.includes('frontend')) {
      return { icon: Palette, gradient: 'from-orange-500 to-amber-600', shadow: 'shadow-orange-500/50' };
    } else if (titleLower.includes('product')) {
      return { icon: Briefcase, gradient: 'from-pink-500 to-rose-600', shadow: 'shadow-pink-500/50' };
    } else if (titleLower.includes('software')) {
      return { icon: Laptop, gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/50' };
    } else if (titleLower.includes('database')) {
      return { icon: Database, gradient: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/50' };
    } else {
      return { icon: Code, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/50' };
    }
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate("/")}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-all duration-300">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">Voke</h1>
          </div>
          <nav className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" className="hidden md:flex" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="outline" onClick={handleLogout} className="ml-2">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-32 pb-16 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent tracking-tight">
            Choose Your Challenge
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Select an interview type to begin your practice session. Our AI will adapt to your responses in real-time.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
        >
          <InterviewCard
            title="General"
            description="Master common interview questions and behavioral scenarios."
            icon={<MessageSquare className="w-8 h-8 text-blue-500" />}
            gradient="from-blue-500/10 to-cyan-500/10"
            border="hover:border-blue-500/50"
            onClick={() => startInterview("general")}
            loading={loading}
          />
          <InterviewCard
            title="Technical"
            description="Deep dive into technical skills, coding, and system design."
            icon={<Code className="w-8 h-8 text-violet-500" />}
            gradient="from-violet-500/10 to-purple-500/10"
            border="hover:border-violet-500/50"
            onClick={() => startInterview("technical")}
            loading={loading}
          />
          <InterviewCard
            title="Behavioral"
            description="Perfect your STAR method responses and soft skills."
            icon={<Brain className="w-8 h-8 text-pink-500" />}
            gradient="from-pink-500/10 to-rose-500/10"
            border="hover:border-pink-500/50"
            onClick={() => startInterview("behavioral")}
            loading={loading}
          />
          <InterviewCard
            title="Resume Based"
            description="Tailored questions based on your specific experience."
            icon={<FileText className="w-8 h-8 text-amber-500" />}
            gradient="from-amber-500/10 to-orange-500/10"
            border="hover:border-amber-500/50"
            onClick={() => startInterview("resume")}
            loading={loading}
          />
        </motion.div>

        {/* Role-Specific Interviews */}
        {jobProfiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-border" />
              <h3 className="text-2xl font-bold text-foreground/80">Role-Specific Tracks</h3>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobProfiles.map((profile, index) => (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + (index * 0.1) }}
                >
                  <Card
                    className="group relative overflow-hidden border-border/50 bg-card/50 hover:bg-card/80 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 cursor-pointer"
                    onClick={() => startInterview("role-specific", profile.id)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardHeader>
                      <div className="flex items-center gap-4 mb-2">
                        {(() => {
                          const { icon: Icon, gradient, shadow } = getRoleIcon(profile.title);
                          return (
                            <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${shadow} group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                              <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 to-transparent"></div>
                            </div>
                          );
                        })()}
                        <div>
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {profile.title}
                          </CardTitle>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Sparkles className="w-3 h-3" />
                            <span>Specialized Track</span>
                          </div>
                        </div>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {profile.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
                        variant="secondary"
                        disabled={loading}
                      >
                        <Play className="w-4 h-4 mr-2 group-hover:fill-current" />
                        Start Interview
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

interface InterviewCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  border: string;
  onClick: () => void;
  loading: boolean;
}

const InterviewCard = ({ title, description, icon, gradient, border, onClick, loading }: InterviewCardProps) => (
  <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
    <Card
      className={`group relative h-full overflow-hidden border-border/50 bg-card/50 hover:bg-card/80 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-pointer ${border}`}
      onClick={onClick}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

      <CardHeader className="relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-background/80 backdrop-blur-sm shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 border border-border/50">
          {icon}
        </div>
        <CardTitle className="text-xl mb-2 group-hover:text-foreground transition-colors">
          {title}
        </CardTitle>
        <CardDescription className="text-base leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="relative z-10 mt-auto">
        <Button
          className="w-full opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300"
          disabled={loading}
        >
          <Play className="w-4 h-4 mr-2 fill-current" />
          Start Now
        </Button>
      </CardContent>
    </Card>
  </motion.div>
);

export default InterviewNew;
