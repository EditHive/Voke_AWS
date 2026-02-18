import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, TrendingUp, Sparkles, Target, BookOpen, Lightbulb, RefreshCw, ArrowLeft, LogOut, Download, Settings, Building2, DollarSign, CheckCircle2, TrendingDown, Minus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { exportRoadmapToPDF } from "@/utils/pdfExport";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "motion/react";

export default function JobMarketInsights() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [researching, setResearching] = useState(false);
  const [trends, setTrends] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Software Engineering");
  const [userName, setUserName] = useState<string>("User");

  const categories = [
    "Software Engineering",
    "Data Science",
    "Cloud Computing",
    "Cybersecurity",
    "AI/ML Engineering",
    "DevOps",
    "Full Stack Development",
  ];

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
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (profileData?.full_name) {
        setUserName(profileData.full_name);
      }

      const { data: trendsData } = await supabase
        .from("job_market_trends")
        .select("*")
        .order("last_updated", { ascending: false });

      setTrends(trendsData || []);

      const { data: recData } = await supabase
        .from("user_career_recommendations")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setRecommendations(recData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const researchTrends = async () => {
    setResearching(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "research-job-trends",
        {
          body: { category: selectedCategory },
        }
      );

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job market trends updated!",
      });
      await loadData();
    } catch (error) {
      console.error("Error researching trends:", error);
      toast({
        title: "Error",
        description: "Failed to research trends",
        variant: "destructive",
      });
    } finally {
      setResearching(false);
    }
  };

  const generateGuidance = async () => {
    setResearching(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.functions.invoke(
        "generate-career-guidance",
        {
          body: { userId: user.id },
        }
      );

      if (error) throw error;

      toast({
        title: "Success",
        description: "Career guidance generated successfully! You can now start an adaptive interview.",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/adaptive-interview")}
          >
            Start Interview
          </Button>
        ),
      });
      await loadData();
    } catch (error) {
      console.error("Error generating guidance:", error);
      toast({
        title: "Error",
        description: "Failed to generate guidance",
        variant: "destructive",
      });
    } finally {
      setResearching(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getDemandColor = (level: string) => {
    const colors: Record<string, { bg: string; border: string; text: string; icon: any }> = {
      high: {
        bg: "from-emerald-500/10 to-green-500/10",
        border: "border-emerald-500/30",
        text: "text-emerald-600 dark:text-emerald-400",
        icon: TrendingUp
      },
      medium: {
        bg: "from-amber-500/10 to-yellow-500/10",
        border: "border-amber-500/30",
        text: "text-amber-600 dark:text-amber-400",
        icon: Minus
      },
      low: {
        bg: "from-rose-500/10 to-red-500/10",
        border: "border-rose-500/30",
        text: "text-rose-600 dark:text-rose-400",
        icon: TrendingDown
      },
    };
    return colors[level] || colors.medium;
  };

  const handleExportPDF = () => {
    if (!recommendations) {
      toast({
        title: "No data to export",
        description: "Please generate career guidance first",
        variant: "destructive",
      });
      return;
    }

    try {
      exportRoadmapToPDF(
        {
          recommended_roles: recommendations.recommended_roles as any,
          skill_gaps: recommendations.skill_gaps as any,
          learning_priorities: recommendations.learning_priorities as any,
          preparation_roadmap: recommendations.preparation_roadmap as string,
          market_insights: recommendations.market_insights as string,
        },
        userName
      );

      toast({
        title: "Success",
        description: "Roadmap exported successfully!",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Error",
        description: "Failed to export roadmap",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">Job Market Insights</h1>
                <p className="text-sm text-muted-foreground">AI-powered career guidance</p>
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <Button variant="ghost" className="hidden md:flex" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
                <Settings className="w-5 h-5" />
              </Button>
              <Button onClick={handleLogout} variant="outline">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-32 pb-16 max-w-7xl">
        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="trends">Market Trends</TabsTrigger>
            <TabsTrigger value="guidance">Personal Guidance</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <TrendingUp className="h-6 w-6 text-primary" />
                      Latest Job Market Trends
                    </CardTitle>
                    <CardDescription className="mt-2">
                      AI-researched insights about current tech job market
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-4 py-2 border border-border rounded-lg bg-background text-sm font-medium hover:bg-accent transition-colors"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <Button onClick={researchTrends} disabled={researching}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${researching ? "animate-spin" : ""}`} />
                      Research
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {trends.length === 0 ? (
                  <div className="text-center py-16">
                    <Sparkles className="h-20 w-20 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-2xl font-semibold mb-2">No Trends Yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Click "Research" to analyze the latest job market trends using AI
                    </p>
                  </div>
                ) : (
                  <motion.div
                    className="grid gap-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ staggerChildren: 0.1 }}
                  >
                    {trends.map((trend, index) => {
                      const demandStyle = getDemandColor(trend.demand_level);
                      const DemandIcon = demandStyle.icon;

                      return (
                        <motion.div
                          key={trend.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card className={`group relative overflow-hidden border-l-4 ${demandStyle.border} hover:shadow-xl transition-all duration-300 bg-gradient-to-br ${demandStyle.bg}`}>
                            <CardHeader className="pb-4">
                              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${demandStyle.bg} border ${demandStyle.border} flex items-center justify-center`}>
                                      <DemandIcon className={`h-6 w-6 ${demandStyle.text}`} />
                                    </div>
                                    <div>
                                      <CardTitle className="text-2xl mb-1">{trend.title}</CardTitle>
                                      <Badge variant="outline" className="font-medium">
                                        {trend.category}
                                      </Badge>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-2 mt-3">
                                    <Badge className={`${demandStyle.text} bg-background/50 border ${demandStyle.border}`}>
                                      <DemandIcon className="h-3 w-3 mr-1" />
                                      {trend.demand_level} demand
                                    </Badge>
                                    {trend.growth_rate && (
                                      <Badge variant="secondary" className="font-medium">
                                        📈 {trend.growth_rate}
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                {trend.salary_range && (
                                  <div className="text-right bg-background/50 backdrop-blur-sm rounded-xl p-4 border border-border/50">
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                      <DollarSign className="h-4 w-4" />
                                      <span>Salary Range</span>
                                    </div>
                                    <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                                      {trend.salary_range}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </CardHeader>

                            <CardContent className="space-y-6">
                              <p className="text-base text-muted-foreground leading-relaxed">
                                {trend.description}
                              </p>

                              <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-lg flex items-center gap-2">
                                    <Target className="h-5 w-5 text-primary" />
                                    Trending Skills
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {trend.trending_skills.map((skill: string, idx: number) => (
                                      <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="px-3 py-1 text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors cursor-default"
                                      >
                                        {skill}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>

                                {trend.key_companies && trend.key_companies.length > 0 && (
                                  <div className="space-y-3">
                                    <h4 className="font-semibold text-lg flex items-center gap-2">
                                      <Building2 className="h-5 w-5 text-primary" />
                                      Key Hiring Companies
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                      {trend.key_companies.map((company: string, idx: number) => (
                                        <Badge
                                          key={idx}
                                          variant="outline"
                                          className="px-3 py-1 text-sm font-medium hover:bg-accent transition-colors cursor-default"
                                        >
                                          {company}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="bg-background/50 backdrop-blur-sm rounded-xl p-5 border border-border/50">
                                <h4 className="font-semibold text-lg flex items-center gap-2 mb-4">
                                  <Lightbulb className="h-5 w-5 text-amber-500" />
                                  Preparation Tips
                                </h4>
                                <ul className="space-y-2">
                                  {trend.preparation_tips.map((tip: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-3 text-sm">
                                      <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                      <span className="text-muted-foreground leading-relaxed">{tip}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <p className="text-xs text-muted-foreground flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Last updated: {new Date(trend.last_updated).toLocaleString()}
                              </p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guidance" className="space-y-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <BookOpen className="h-6 w-6 text-primary" />
                      Personalized Career Guidance
                    </CardTitle>
                    <CardDescription className="mt-2">
                      AI-generated recommendations based on your profile and performance
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={handleExportPDF}
                      variant="outline"
                      disabled={!recommendations}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </Button>
                    <Button onClick={generateGuidance} disabled={researching}>
                      <Sparkles className={`h-4 w-4 mr-2 ${researching ? "animate-spin" : ""}`} />
                      Generate
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                {!recommendations ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center border border-violet-500/20">
                      <Brain className="h-10 w-10 text-violet-500" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-2">No Guidance Yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Click "Generate" to get personalized career recommendations powered by AI
                    </p>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-8"
                  >
                    {/* Market Insights */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Card className="relative overflow-hidden border-l-4 border-l-violet-500 bg-gradient-to-br from-violet-500/5 to-purple-500/5">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-500/10 to-transparent rounded-full blur-3xl"></div>
                        <CardHeader>
                          <CardTitle className="text-xl flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-violet-500" />
                            Market Insights
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                            {recommendations.market_insights}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Recommended Roles */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center border border-blue-500/20">
                          <Target className="h-5 w-5 text-blue-500" />
                        </div>
                        <h3 className="text-2xl font-bold">Recommended Roles for You</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recommendations.recommended_roles.map((role: any, idx: number) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 + (idx * 0.1) }}
                          >
                            <Card className="group relative overflow-hidden border-border/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <CardHeader>
                                <div className="flex items-start justify-between gap-2">
                                  <CardTitle className="text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {role.title}
                                  </CardTitle>
                                  <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20">
                                    {role.market_demand}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm text-muted-foreground leading-relaxed">{role.reason}</p>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Skill Gaps */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center border border-amber-500/20">
                          <Target className="h-5 w-5 text-amber-500" />
                        </div>
                        <h3 className="text-2xl font-bold">Skills to Develop</h3>
                      </div>
                      <div className="grid gap-4">
                        {recommendations.skill_gaps.map((gap: any, idx: number) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + (idx * 0.1) }}
                          >
                            <Card className="group relative overflow-hidden border-l-4 border-l-amber-500 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-amber-500/5 to-transparent">
                              <CardContent className="pt-6">
                                <div className="flex items-start gap-4">
                                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center flex-shrink-0 border border-amber-500/30">
                                    <Target className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-lg mb-2">{gap.skill}</h4>
                                    <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                                      {gap.importance}
                                    </p>
                                    <div className="flex items-center gap-2 text-sm bg-background/50 rounded-lg px-3 py-2 border border-border/50">
                                      <BookOpen className="h-4 w-4 text-primary" />
                                      <span className="text-primary font-medium">{gap.learning_resource}</span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Learning Priorities */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 flex items-center justify-center border border-emerald-500/20">
                          <Lightbulb className="h-5 w-5 text-emerald-500" />
                        </div>
                        <h3 className="text-2xl font-bold">Learning Priorities</h3>
                      </div>
                      <div className="grid gap-4">
                        {recommendations.learning_priorities
                          .sort((a: any, b: any) => a.priority - b.priority)
                          .map((priority: any, idx: number) => (
                            <motion.div
                              key={priority.priority}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.7 + (idx * 0.1) }}
                            >
                              <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 hover:border-emerald-500/50">
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <CardContent className="pt-6">
                                  <div className="flex gap-4">
                                    <div className="flex-shrink-0">
                                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-emerald-500/20">
                                        {priority.priority}
                                      </div>
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-lg mb-2">{priority.topic}</h4>
                                      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                                        {priority.reason}
                                      </p>
                                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                                        ⏱️ {priority.timeline}
                                      </Badge>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                      </div>
                    </motion.div>

                    {/* Preparation Roadmap */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                    >
                      <Card className="relative overflow-hidden border-2 border-primary/50 bg-gradient-to-br from-primary/5 via-purple-500/5 to-fuchsia-500/5">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl"></div>
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
                              <Target className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-2xl">3-Month Preparation Roadmap</CardTitle>
                              <CardDescription>Your personalized path to success</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-background/50 backdrop-blur-sm rounded-xl p-6 border border-border/50">
                            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                              {recommendations.preparation_roadmap}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Last updated: {new Date(recommendations.updated_at).toLocaleString()}
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
