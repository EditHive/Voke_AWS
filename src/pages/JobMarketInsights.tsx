import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, TrendingUp, Sparkles, Target, BookOpen, Lightbulb, RefreshCw, ArrowLeft, LogOut, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { exportRoadmapToPDF } from "@/utils/pdfExport";

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

      // Load user profile for name
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      
      if (profileData?.full_name) {
        setUserName(profileData.full_name);
      }

      // Load trends
      const { data: trendsData } = await supabase
        .from("job_market_trends")
        .select("*")
        .order("last_updated", { ascending: false });

      setTrends(trendsData || []);

      // Load user recommendations
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

  const getDemandBadge = (level: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      high: "default",
      medium: "secondary",
      low: "destructive",
    };
    return <Badge variant={variants[level] || "secondary"}>{level} demand</Badge>;
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
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-foreground">Job Market Insights</h1>
                <p className="text-sm text-muted-foreground">AI-powered career guidance</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button onClick={handleLogout} variant="ghost" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="trends">Market Trends</TabsTrigger>
            <TabsTrigger value="guidance">Personal Guidance</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Latest Job Market Trends
                    </CardTitle>
                    <CardDescription>
                      AI-researched insights about current tech job market
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-3 py-2 border border-border rounded-md bg-background"
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
              <CardContent className="space-y-4">
                {trends.length === 0 ? (
                  <div className="text-center py-12">
                    <Sparkles className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">No Trends Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Click "Research" to analyze the latest job market trends
                    </p>
                  </div>
                ) : (
                  trends.map((trend) => (
                    <Card key={trend.id} className="border-l-4 border-l-primary">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{trend.title}</CardTitle>
                            <div className="flex gap-2 mt-2">
                              {getDemandBadge(trend.demand_level)}
                              <Badge variant="outline">{trend.category}</Badge>
                              {trend.growth_rate && (
                                <Badge variant="secondary">{trend.growth_rate}</Badge>
                              )}
                            </div>
                          </div>
                          {trend.salary_range && (
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Salary Range</p>
                              <p className="font-bold text-primary">{trend.salary_range}</p>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-muted-foreground">{trend.description}</p>

                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Trending Skills
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {trend.trending_skills.map((skill: string, idx: number) => (
                              <Badge key={idx} variant="secondary">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {trend.key_companies && trend.key_companies.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Key Hiring Companies</h4>
                            <div className="flex flex-wrap gap-2">
                              {trend.key_companies.map((company: string, idx: number) => (
                                <Badge key={idx} variant="outline">
                                  {company}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Lightbulb className="h-4 w-4" />
                            Preparation Tips
                          </h4>
                          <ul className="list-disc list-inside space-y-1">
                            {trend.preparation_tips.map((tip: string, idx: number) => (
                              <li key={idx} className="text-muted-foreground text-sm">
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Last updated: {new Date(trend.last_updated).toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guidance" className="space-y-6">
            <Card>
              <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Personalized Career Guidance
                  </CardTitle>
                  <CardDescription>
                    AI-generated recommendations based on your profile and performance
                  </CardDescription>
                </div>
                <div className="flex gap-2">
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
              <CardContent className="space-y-6">
                {!recommendations ? (
                  <div className="text-center py-12">
                    <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">No Guidance Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Click "Generate" to get personalized career recommendations
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Market Insights */}
                    <Card className="bg-muted/50">
                      <CardHeader>
                        <CardTitle className="text-lg">Market Insights</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {recommendations.market_insights}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Recommended Roles */}
                    <div>
                      <h3 className="text-lg font-bold mb-3">Recommended Roles for You</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recommendations.recommended_roles.map((role: any, idx: number) => (
                          <Card key={idx}>
                            <CardHeader>
                              <CardTitle className="text-base">{role.title}</CardTitle>
                              <Badge variant="secondary">{role.market_demand}</Badge>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground">{role.reason}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Skill Gaps */}
                    <div>
                      <h3 className="text-lg font-bold mb-3">Skills to Develop</h3>
                      <div className="space-y-3">
                        {recommendations.skill_gaps.map((gap: any, idx: number) => (
                          <Card key={idx}>
                            <CardContent className="pt-6">
                              <div className="flex items-start gap-3">
                                <Target className="h-5 w-5 text-primary mt-1" />
                                <div className="flex-1">
                                  <h4 className="font-semibold">{gap.skill}</h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {gap.importance}
                                  </p>
                                  <p className="text-sm text-primary mt-2">
                                    📚 {gap.learning_resource}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Learning Priorities */}
                    <div>
                      <h3 className="text-lg font-bold mb-3">Learning Priorities</h3>
                      <div className="space-y-3">
                        {recommendations.learning_priorities
                          .sort((a: any, b: any) => a.priority - b.priority)
                          .map((priority: any) => (
                            <Card key={priority.priority}>
                              <CardContent className="pt-6">
                                <div className="flex gap-4">
                                  <div className="flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                                      {priority.priority}
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold">{priority.topic}</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {priority.reason}
                                    </p>
                                    <Badge variant="outline" className="mt-2">
                                      {priority.timeline}
                                    </Badge>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </div>

                    {/* Preparation Roadmap */}
                    <Card className="border-2 border-primary">
                      <CardHeader>
                        <CardTitle>3-Month Preparation Roadmap</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {recommendations.preparation_roadmap}
                        </p>
                      </CardContent>
                    </Card>

                    <p className="text-xs text-muted-foreground text-center">
                      Last updated: {new Date(recommendations.updated_at).toLocaleString()}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
