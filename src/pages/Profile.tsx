import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Brain, LogOut, Upload, FileText, TrendingUp, Target, Award, Calendar, User, Briefcase, Activity, Sparkles, MessageSquare, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "motion/react";
import InterviewAnalytics from "@/components/InterviewAnalytics";
import AICoachChat from "@/components/AICoachChat";
import ResumeAnalyzer from "@/components/ResumeAnalyzer";

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    codeforces_id: "",
    leetcode_id: "",
    github_url: "",
  });
  const [codingStats, setCodingStats] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [stats, setStats] = useState({
    totalInterviews: 0,
    completedSessions: 0,
    averageScore: 0,
    peerSessions: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [skillGaps, setSkillGaps] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
    loadProfile();
    loadStats();
    loadRecentActivity();
    loadSkillGaps();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        const profile = profileData as any;
        setProfile(profile);
        setFormData({
          full_name: profile.full_name || "",
          codeforces_id: profile.codeforces_id || "",
          leetcode_id: profile.leetcode_id || "",
          github_url: profile.github_url || "",
        });
        if (profile.coding_stats) {
          setCodingStats(profile.coding_stats);
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: sessions } = await supabase
        .from("interview_sessions")
        .select("*")
        .eq("user_id", user.id);

      const { data: videoSessions } = await supabase
        .from("video_interview_sessions")
        .select("overall_score")
        .eq("user_id", user.id)
        .not("overall_score", "is", null);

      const { data: peerSessions } = await supabase
        .from("peer_interview_sessions")
        .select("*")
        .or(`host_user_id.eq.${user.id},guest_user_id.eq.${user.id}`);

      const totalInterviews = (sessions?.length || 0) + (videoSessions?.length || 0);
      const completedSessions = sessions?.filter(s => s.status === "completed").length || 0;
      const avgScore = videoSessions?.length
        ? videoSessions.reduce((acc, s) => acc + s.overall_score, 0) / videoSessions.length
        : 0;

      setStats({
        totalInterviews,
        completedSessions,
        averageScore: Math.round(avgScore),
        peerSessions: peerSessions?.length || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: sessions } = await supabase
        .from("interview_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentActivity(sessions || []);
    } catch (error) {
      console.error("Error loading recent activity:", error);
    }
  };

  const loadSkillGaps = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: recommendations } = await supabase
        .from("user_career_recommendations")
        .select("skill_gaps")
        .eq("user_id", user.id)
        .single();

      if (recommendations?.skill_gaps) {
        setSkillGaps(recommendations.skill_gaps as any[] || []);
      }
    } catch (error) {
      console.error("Error loading skill gaps:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update(formData)
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      loadProfile();
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSyncStats = async () => {
    if (!formData.codeforces_id && !formData.leetcode_id) {
      toast.error("Please enter Codeforces or LeetCode handle first");
      return;
    }

    setSyncing(true);
    const newStats: any = { ...codingStats };

    try {
      // Fetch Codeforces
      if (formData.codeforces_id) {
        try {
          const { data, error } = await supabase.functions.invoke('fetch-codeforces-data', {
            body: { handle: formData.codeforces_id }
          });
          if (error) throw error;
          if (data.error) throw new Error(data.error);

          newStats.codeforces = data;
          toast.success("Codeforces stats synced!");
        } catch (e: any) {
          console.error("Codeforces sync error:", e);
          toast.error(`Codeforces: ${e.message || "Failed to sync"}`);
        }
      }

      // Fetch LeetCode
      if (formData.leetcode_id) {
        try {
          const { data, error } = await supabase.functions.invoke('fetch-leetcode-data', {
            body: { username: formData.leetcode_id }
          });
          if (error) throw error;
          if (data.error) throw new Error(data.error);

          newStats.leetcode = data;
          toast.success("LeetCode stats synced!");
        } catch (e: any) {
          console.error("LeetCode sync error:", e);
          toast.error(`LeetCode: ${e.message || "Failed to sync"}`);
        }
      }

      setCodingStats(newStats);

      // Save to profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const updateData: any = {
          coding_stats: newStats,
          codeforces_id: formData.codeforces_id,
          leetcode_id: formData.leetcode_id
        };

        const { error: updateError } = await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", user.id);

        if (updateError) throw updateError;
      }

    } catch (error: any) {
      console.error("Error syncing stats:", error);
      toast.error(`Sync failed: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) {
      toast.error("Please select a file first");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = resumeFile.name.split(".").pop();
      const fileName = `${user.id}/resume.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(fileName, resumeFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("resumes")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ resume_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      toast.success("Resume uploaded successfully!");
      loadProfile();
      setResumeFile(null);
    } catch (error) {
      console.error("Error uploading resume:", error);
      toast.error("Failed to upload resume");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Brain className="h-12 w-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[100px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-blue-500/10 blur-[80px]" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
              Profile & Settings
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="hover:bg-primary/5">
              Dashboard
            </Button>
            <Button variant="destructive" size="sm" onClick={handleLogout} className="shadow-lg shadow-destructive/20 hover:shadow-destructive/40 transition-all">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </motion.header>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-4 py-8 relative z-10"
      >
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { title: "Total Interviews", value: stats.totalInterviews, icon: Target, color: "text-blue-500", bg: "bg-blue-500/10" },
            { title: "Completed", value: stats.completedSessions, icon: Award, color: "text-green-500", bg: "bg-green-500/10" },
            { title: "Avg Score", value: `${stats.averageScore}%`, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-500/10" },
            { title: "Peer Sessions", value: stats.peerSessions, icon: Calendar, color: "text-orange-500", bg: "bg-orange-500/10" }
          ].map((stat, index) => (
            <motion.div key={index} variants={itemVariants} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${stat.bg} group-hover:scale-110 transition-transform duration-300`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <Sparkles className="h-4 w-4 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="profile" className="flex flex-col md:flex-row gap-8">
          <motion.div variants={itemVariants} className="w-full md:w-64 shrink-0">
            <TabsList className="flex flex-col w-full h-auto bg-transparent p-0 gap-2">
              {[
                { value: "profile", label: "Profile Info", icon: User },
                { value: "analytics", label: "Analytics", icon: BarChart3 },
                { value: "coach", label: "AI Coach", icon: MessageSquare },
                { value: "resume-analyzer", label: "Resume Analyzer", icon: TrendingUp },
                { value: "skills", label: "Skills Progress", icon: Brain },
                { value: "activity", label: "Recent Activity", icon: Activity },
                { value: "resume", label: "Resume", icon: FileText }
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="w-full justify-start px-4 py-3 h-auto rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted/50 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <tab.icon className="h-4 w-4" />
                    <span className="font-medium">{tab.label}</span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
          </motion.div>

          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <TabsContent value="profile" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        Personal Information
                      </CardTitle>
                      <CardDescription>Update your profile details and public presence</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input id="email" value={profile?.email || ""} disabled className="bg-muted/50" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="full_name">Full Name</Label>
                          <Input
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            placeholder="Enter your full name"
                            className="focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="codeforces_id">Codeforces Handle</Label>
                          <div className="flex gap-2">
                            <Input
                              id="codeforces_id"
                              value={formData.codeforces_id}
                              onChange={(e) => setFormData({ ...formData, codeforces_id: e.target.value })}
                              placeholder="e.g. tourist"
                              className="focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="leetcode_id">LeetCode Username</Label>
                          <div className="flex gap-2">
                            <Input
                              id="leetcode_id"
                              value={formData.leetcode_id}
                              onChange={(e) => setFormData({ ...formData, leetcode_id: e.target.value })}
                              placeholder="e.g. neal_wu"
                              className="focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                          </div>
                        </div>

                        {/* Coding Stats Display */}
                        {(codingStats?.codeforces || codingStats?.leetcode) && (
                          <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            {codingStats.codeforces && (
                              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                  <Activity className="h-5 w-5 text-blue-500" />
                                  <h3 className="font-semibold text-blue-500">Codeforces</h3>
                                </div>
                                <div className="space-y-1 text-sm">
                                  <p>Rating: <span className="font-bold">{codingStats.codeforces.rating}</span> ({codingStats.codeforces.rank})</p>
                                  <p>Max Rating: <span className="font-bold">{codingStats.codeforces.maxRating}</span></p>
                                </div>
                              </div>
                            )}
                            {codingStats.leetcode && (
                              <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                  <Activity className="h-5 w-5 text-yellow-500" />
                                  <h3 className="font-semibold text-yellow-500">LeetCode</h3>
                                </div>
                                <div className="space-y-1 text-sm">
                                  <p>Solved: <span className="font-bold">{codingStats.leetcode.submitStats?.find((s: any) => s.difficulty === "All")?.count}</span></p>
                                  <p>Rating: <span className="font-bold">{Math.round(codingStats.leetcode.contestRanking?.rating || 0)}</span></p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="github_url">GitHub Profile</Label>
                          <Input
                            id="github_url"
                            value={formData.github_url}
                            onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                            placeholder="https://github.com/yourusername"
                            className="focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pt-4 gap-3">
                        <Button
                          variant="outline"
                          onClick={handleSyncStats}
                          disabled={syncing || (!formData.codeforces_id && !formData.leetcode_id)}
                          className="w-full md:w-auto min-w-[150px]"
                        >
                          {syncing ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="mr-2"
                            >
                              <Activity className="h-4 w-4" />
                            </motion.div>
                          ) : (
                            <Activity className="h-4 w-4 mr-2" />
                          )}
                          {syncing ? "Syncing..." : "Sync Stats"}
                        </Button>
                        <Button
                          onClick={handleSave}
                          disabled={saving}
                          className="w-full md:w-auto min-w-[150px] shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                        >
                          {saving ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="mr-2"
                            >
                              <Sparkles className="h-4 w-4" />
                            </motion.div>
                          ) : (
                            <Sparkles className="h-4 w-4 mr-2" />
                          )}
                          {saving ? "Saving Changes..." : "Save Changes"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="analytics" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* @ts-ignore */}
                  <InterviewAnalytics userId={profile?.id || ""} />
                </motion.div>
              </TabsContent>

              <TabsContent value="coach" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* @ts-ignore */}
                  <AICoachChat userId={profile?.id || ""} />
                </motion.div>
              </TabsContent>

              <TabsContent value="resume-analyzer" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* @ts-ignore */}
                  <ResumeAnalyzer userId={profile?.id || ""} resumeUrl={profile?.resume_url} />
                </motion.div>
              </TabsContent>

              <TabsContent value="skills" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-primary" />
                        Skill Development
                      </CardTitle>
                      <CardDescription>Track your identified skill gaps and learning progress</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {skillGaps.length === 0 ? (
                        <div className="text-center py-12 px-4 rounded-2xl bg-muted/30 border border-dashed border-border">
                          <Target className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                          <h3 className="text-lg font-medium text-foreground">No Skill Gaps Identified</h3>
                          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                            Complete a career guidance assessment to discover your personalized skill development plan.
                          </p>
                          <Button variant="outline" className="mt-6" onClick={() => navigate("/job-market?tab=guidance")}>
                            Start Assessment
                          </Button>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          {skillGaps.map((gap: any, index: number) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="p-5 border border-border/50 rounded-xl bg-background/50 hover:bg-background/80 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className={`h-2 w-2 rounded-full ${gap.importance === 'High' ? 'bg-red-500' : gap.importance === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                                  <h4 className="font-semibold text-foreground">{gap.skill}</h4>
                                </div>
                                <Badge variant={gap.importance === 'High' ? 'destructive' : gap.importance === 'Medium' ? 'default' : 'secondary'} className="capitalize">
                                  {gap.importance} Priority
                                </Badge>
                              </div>
                              {gap.learning_resource && (
                                <p className="text-sm text-muted-foreground mb-4 pl-5 border-l-2 border-border/50">
                                  {gap.learning_resource}
                                </p>
                              )}
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>Progress</span>
                                  <span>{Math.round(Math.random() * 60 + 20)}%</span>
                                </div>
                                <Progress value={Math.random() * 60 + 20} className="h-2" />
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="activity" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        Recent Activity
                      </CardTitle>
                      <CardDescription>Your latest interview sessions and achievements</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {recentActivity.length === 0 ? (
                        <div className="text-center py-12 px-4 rounded-2xl bg-muted/30 border border-dashed border-border">
                          <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                          <h3 className="text-lg font-medium text-foreground">No Recent Activity</h3>
                          <p className="text-muted-foreground mt-2">
                            Start your first interview to see your progress here.
                          </p>
                          <Button className="mt-6" onClick={() => navigate("/interview")}>
                            Start Interview
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {recentActivity.map((activity, index) => (
                            <motion.div
                              key={activity.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-background/50 hover:bg-background/80 transition-all hover:shadow-md"
                            >
                              <div className="flex items-center gap-4">
                                <div className="p-2 rounded-full bg-primary/10">
                                  <Briefcase className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-foreground">{activity.interview_type}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(activity.created_at).toLocaleDateString(undefined, {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </p>
                                </div>
                              </div>
                              <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'} className="capitalize">
                                {activity.status}
                              </Badge>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="resume" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Resume Management
                      </CardTitle>
                      <CardDescription>Upload and manage your resume for AI analysis</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {profile?.resume_url && (
                        <motion.div
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="p-6 border border-primary/20 rounded-2xl bg-primary/5 relative overflow-hidden group"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                          <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-background rounded-xl shadow-sm">
                                <FileText className="h-8 w-8 text-primary" />
                              </div>
                              <div>
                                <p className="font-semibold text-foreground text-lg">Current Resume</p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Sparkles className="h-3 w-3 text-green-500" />
                                  Active & Ready for Analysis
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => window.open(profile.resume_url, "_blank")}
                              className="hover:bg-primary hover:text-primary-foreground transition-colors"
                            >
                              View Document
                            </Button>
                          </div>
                        </motion.div>
                      )}

                      <div className="space-y-4">
                        <Label htmlFor="resume" className="text-base">Upload New Resume</Label>
                        <div className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-8 transition-colors text-center bg-muted/20 hover:bg-muted/40 group cursor-pointer relative">
                          <input
                            id="resume"
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                          />
                          <div className="flex flex-col items-center gap-3 relative z-10 pointer-events-none">
                            <div className="p-4 rounded-full bg-background shadow-sm group-hover:scale-110 transition-transform duration-300">
                              {resumeFile ? (
                                <FileText className="h-8 w-8 text-primary" />
                              ) : (
                                <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {resumeFile ? resumeFile.name : "Click to upload or drag and drop"}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                PDF, DOC, DOCX (Max 5MB)
                              </p>
                            </div>
                          </div>
                        </div>

                        <AnimatePresence>
                          {resumeFile && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="flex justify-end"
                            >
                              <Button
                                onClick={handleResumeUpload}
                                disabled={saving}
                                className="w-full md:w-auto shadow-lg shadow-primary/20"
                              >
                                {saving ? (
                                  <>
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                      className="mr-2"
                                    >
                                      <Upload className="h-4 w-4" />
                                    </motion.div>
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload Selected File
                                  </>
                                )}
                              </Button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </div>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default Profile;
