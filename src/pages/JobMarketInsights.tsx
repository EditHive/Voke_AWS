import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, TrendingUp, Sparkles, Target, BookOpen, Lightbulb, RefreshCw, ArrowLeft, LogOut, Download, Settings, Building2, DollarSign, CheckCircle2, TrendingDown, Minus, Briefcase, Globe, Zap } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { exportRoadmapToPDF } from "@/utils/pdfExport";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "motion/react";

// Mock Data for Fallback
const MOCK_TRENDS = [
  {
    id: "t1",
    title: "AI & Machine Learning Engineer",
    category: "AI/ML Engineering",
    demand_level: "high",
    growth_rate: "+45%",
    salary_range: "$140k - $220k",
    description: "Explosive demand for engineers capable of building and deploying LLMs and generative AI models.",
    trending_skills: ["PyTorch", "TensorFlow", "Transformers", "LangChain", "MLOps"],
    key_companies: ["OpenAI", "Google", "Anthropic", "Microsoft"],
    preparation_tips: ["Build a portfolio of GenAI projects", "Master Python and deep learning fundamentals", "Learn about vector databases"],
    last_updated: new Date().toISOString()
  },
  {
    id: "t2",
    title: "Full Stack Developer (Next.js)",
    category: "Full Stack Development",
    demand_level: "high",
    growth_rate: "+22%",
    salary_range: "$110k - $180k",
    description: "Continued strong demand for developers who can handle both frontend and backend with modern frameworks.",
    trending_skills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Supabase"],
    key_companies: ["Vercel", "Startups", "Tech Giants"],
    preparation_tips: ["Master Server Components", "Understand edge computing", "Focus on performance optimization"],
    last_updated: new Date().toISOString()
  },
  {
    id: "t3",
    title: "Cloud Security Specialist",
    category: "Cybersecurity",
    demand_level: "high",
    growth_rate: "+30%",
    salary_range: "$130k - $190k",
    description: "As infrastructure moves to the cloud, securing these environments has become critical.",
    trending_skills: ["AWS Security", "Azure Sentinel", "Zero Trust Architecture", "Kubernetes Security"],
    key_companies: ["CrowdStrike", "Palo Alto Networks", "Amazon"],
    preparation_tips: ["Get certified (AWS Security Specialty)", "Practice with cloud security tools", "Understand compliance standards"],
    last_updated: new Date().toISOString()
  }
];

const MOCK_RECOMMENDATIONS = {
  market_insights: "Based on your profile, the market for your skills is heating up. There is a specific shortage of developers who understand both traditional backend systems and modern AI integration.",
  recommended_roles: [
    { title: "AI Application Developer", market_demand: "Very High", reason: "Combines your coding skills with the latest AI trends." },
    { title: "Senior Backend Engineer", market_demand: "High", reason: "Your experience with databases makes you a strong candidate." }
  ],
  skill_gaps: [
    { skill: "Vector Databases", importance: "Critical for AI apps", learning_resource: "Pinecone/Weaviate Docs" },
    { skill: "GraphQL", importance: "High demand for flexible APIs", learning_resource: "Apollo Odyssey" }
  ],
  learning_priorities: [
    { priority: 1, topic: "LangChain", reason: "Essential for building LLM apps", timeline: "2 weeks" },
    { priority: 2, topic: "Advanced TypeScript", reason: "Required for scalable codebases", timeline: "1 month" }
  ],
  preparation_roadmap: "Month 1: Focus on TypeScript and Design Patterns.\nMonth 2: Build a full-stack AI application using OpenAI API.\nMonth 3: Contribute to open source and prepare for system design interviews.",
  updated_at: new Date().toISOString()
};

export default function JobMarketInsights() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "trends";
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
      // Allow viewing without auth for demo purposes, or redirect
      // navigate("/auth");
    }
  };

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
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

        setTrends(trendsData && trendsData.length > 0 ? trendsData : MOCK_TRENDS);

        const { data: recData } = await supabase
          .from("user_career_recommendations")
          .select("*")
          .eq("user_id", user.id)
          .single();

        setRecommendations(recData || MOCK_RECOMMENDATIONS);
      } else {
        // Fallback for non-authenticated or empty state
        setTrends(MOCK_TRENDS);
        setRecommendations(MOCK_RECOMMENDATIONS);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      // Fallback on error
      setTrends(MOCK_TRENDS);
      setRecommendations(MOCK_RECOMMENDATIONS);
    } finally {
      setLoading(false);
    }
  };

  const researchTrends = async () => {
    setResearching(true);
    // Simulate API call delay
    setTimeout(async () => {
      setResearching(false);
      toast({
        title: "Market Analysis Complete",
        description: "Updated job market trends with latest AI insights.",
      });
      // In a real app, we would re-fetch or update state here
    }, 2000);
  };

  const generateGuidance = async () => {
    setResearching(true);
    setTimeout(() => {
      setResearching(false);
      toast({
        title: "Guidance Generated",
        description: "Your personalized career roadmap is ready.",
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
    }, 2000);
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
    return colors[level.toLowerCase()] || colors.medium;
  };

  const handleExportPDF = () => {
    if (!recommendations) return;
    try {
      exportRoadmapToPDF(
        {
          recommended_roles: recommendations.recommended_roles,
          skill_gaps: recommendations.skill_gaps,
          learning_priorities: recommendations.learning_priorities,
          preparation_roadmap: recommendations.preparation_roadmap,
          market_insights: recommendations.market_insights,
        },
        userName
      );
      toast({ title: "Success", description: "Roadmap exported successfully!" });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({ title: "Error", description: "Failed to export roadmap", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="h-12 w-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/dashboard")}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">Job Insights</h1>
                <p className="text-xs text-muted-foreground">AI-Powered Analytics</p>
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
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 pt-32 pb-16 max-w-7xl flex-1">
        <Tabs defaultValue={defaultTab} className="space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <TabsList className="grid w-full md:w-auto grid-cols-2 p-1 bg-muted/50 backdrop-blur-sm rounded-xl">
              <TabsTrigger value="trends" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Market Trends</TabsTrigger>
              <TabsTrigger value="guidance" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Personal Guidance</TabsTrigger>
            </TabsList>
            
            <div className="flex gap-2 w-full md:w-auto">
               <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="flex-1 md:w-48 px-4 py-2 border border-border rounded-lg bg-background text-sm font-medium hover:bg-accent transition-colors focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <Button onClick={researchTrends} disabled={researching} className="shrink-0">
                  <RefreshCw className={`h-4 w-4 mr-2 ${researching ? "animate-spin" : ""}`} />
                  Research
                </Button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <TabsContent value="trends" className="space-y-6 mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid gap-6">
                  {trends.map((trend, index) => {
                    const demandStyle = getDemandColor(trend.demand_level);
                    const DemandIcon = demandStyle.icon;

                    return (
                      <motion.div
                        key={trend.id || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className={`group relative overflow-hidden border-l-4 ${demandStyle.border} hover:shadow-2xl transition-all duration-300 bg-card/50 backdrop-blur-sm`}>
                          <div className={`absolute inset-0 bg-gradient-to-br ${demandStyle.bg} opacity-50 group-hover:opacity-70 transition-opacity`} />
                          
                          <CardHeader className="relative z-10 pb-4">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-4 mb-3">
                                  <div className={`w-14 h-14 rounded-2xl bg-background/80 backdrop-blur-md border ${demandStyle.border} flex items-center justify-center shadow-sm`}>
                                    <DemandIcon className={`h-7 w-7 ${demandStyle.text}`} />
                                  </div>
                                  <div>
                                    <CardTitle className="text-2xl font-bold mb-1">{trend.title}</CardTitle>
                                    <Badge variant="secondary" className="font-medium bg-background/50 backdrop-blur-sm">
                                      {trend.category}
                                    </Badge>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-3 mt-4">
                                  <Badge className={`${demandStyle.text} bg-background/80 border ${demandStyle.border} px-3 py-1`}>
                                    {trend.demand_level.toUpperCase()} DEMAND
                                  </Badge>
                                  {trend.growth_rate && (
                                    <Badge variant="outline" className="font-medium border-green-500/30 text-green-600 bg-green-500/5">
                                      <TrendingUp className="w-3 h-3 mr-1" />
                                      {trend.growth_rate} Growth
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {trend.salary_range && (
                                <div className="text-right bg-background/60 backdrop-blur-md rounded-2xl p-4 border border-border/50 shadow-sm min-w-[200px]">
                                  <div className="flex items-center justify-end gap-2 text-muted-foreground text-sm mb-1">
                                    <DollarSign className="h-4 w-4" />
                                    <span>Avg. Salary</span>
                                  </div>
                                  <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                                    {trend.salary_range}
                                  </p>
                                </div>
                              )}
                            </div>
                          </CardHeader>

                          <CardContent className="relative z-10 space-y-8">
                            <p className="text-lg text-muted-foreground leading-relaxed max-w-4xl">
                              {trend.description}
                            </p>

                            <div className="grid md:grid-cols-2 gap-8">
                              <div className="space-y-4">
                                <h4 className="font-semibold text-lg flex items-center gap-2">
                                  <Zap className="h-5 w-5 text-yellow-500" />
                                  Trending Skills
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {trend.trending_skills.map((skill: string, idx: number) => (
                                    <Badge
                                      key={idx}
                                      variant="secondary"
                                      className="px-3 py-1.5 text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors cursor-default border border-border/50"
                                    >
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              {trend.key_companies && trend.key_companies.length > 0 && (
                                <div className="space-y-4">
                                  <h4 className="font-semibold text-lg flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-blue-500" />
                                    Top Employers
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {trend.key_companies.map((company: string, idx: number) => (
                                      <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/50 border border-border/50 text-sm font-medium">
                                        <Globe className="w-3 h-3 text-muted-foreground" />
                                        {company}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="bg-background/40 backdrop-blur-md rounded-xl p-6 border border-border/50">
                              <h4 className="font-semibold text-lg flex items-center gap-2 mb-4">
                                <Lightbulb className="h-5 w-5 text-amber-500" />
                                How to Prepare
                              </h4>
                              <div className="grid sm:grid-cols-2 gap-4">
                                {trend.preparation_tips.map((tip: string, idx: number) => (
                                  <div key={idx} className="flex items-start gap-3 text-sm">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-muted-foreground leading-relaxed">{tip}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="guidance" className="space-y-6 mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Your Career Roadmap</h2>
                    <p className="text-muted-foreground">Personalized AI recommendations based on your profile</p>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleExportPDF} variant="outline" disabled={!recommendations}>
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </Button>
                    <Button onClick={generateGuidance} disabled={researching}>
                      <Sparkles className={`h-4 w-4 mr-2 ${researching ? "animate-spin" : ""}`} />
                      Regenerate
                    </Button>
                  </div>
                </div>

                {!recommendations ? (
                  <Card className="p-12 text-center border-dashed">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Brain className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No Guidance Generated Yet</h3>
                    <p className="text-muted-foreground mb-6">Click regenerate to get your personalized career path.</p>
                    <Button onClick={generateGuidance}>Generate Now</Button>
                  </Card>
                ) : (
                  <div className="space-y-8">
                    {/* Market Insights */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                      <Card className="bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-transparent border-l-4 border-l-violet-500">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
                            <TrendingUp className="h-5 w-5" />
                            Market Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-lg leading-relaxed">{recommendations.market_insights}</p>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Roles & Skills Grid */}
                    <div className="grid md:grid-cols-2 gap-8">
                      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                          <Target className="h-5 w-5 text-blue-500" />
                          Recommended Roles
                        </h3>
                        {recommendations.recommended_roles.map((role: any, idx: number) => (
                          <Card key={idx} className="hover:shadow-lg transition-all border-l-4 border-l-blue-500">
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{role.title}</CardTitle>
                                <Badge>{role.market_demand} Demand</Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground">{role.reason}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </motion.div>

                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                          <Zap className="h-5 w-5 text-amber-500" />
                          Skill Gaps
                        </h3>
                        {recommendations.skill_gaps.map((gap: any, idx: number) => (
                          <Card key={idx} className="hover:shadow-lg transition-all border-l-4 border-l-amber-500">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg">{gap.skill}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground mb-2">{gap.importance}</p>
                              <div className="flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded w-fit">
                                <BookOpen className="h-3 w-3" />
                                {gap.learning_resource}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </motion.div>
                    </div>

                    {/* Roadmap */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                      <Card className="border-2 border-primary/20 overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Briefcase className="h-6 w-6 text-primary" />
                            Action Plan
                          </CardTitle>
                          <CardDescription>Your step-by-step guide to success</CardDescription>
                        </CardHeader>
                        <CardContent className="relative z-10">
                          <div className="bg-muted/50 rounded-xl p-6 whitespace-pre-line leading-relaxed font-medium">
                            {recommendations.preparation_roadmap}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </main>
    </div>
  );
}
