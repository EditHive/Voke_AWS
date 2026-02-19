import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Briefcase, MapPin, DollarSign, TrendingUp, Sparkles, RefreshCw,
    ArrowLeft, ExternalLink, BookmarkPlus, X, CheckCircle2, Building2,
    Zap, Clock, Target
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "motion/react";

interface JobPosting {
    id: string;
    title: string;
    company: string;
    description: string;
    salary_range: string | null;
    location: string;
    remote_ok: boolean;
    experience_level: string;
    skills_required: string[];
    application_url: string | null;
}

interface JobRecommendation {
    id: string;
    job_posting_id: string;
    match_score: number;
    match_reasons: string[];
    skill_gaps: Array<{ skill: string; priority: string; estimated_time: string }>;
    status: string;
    job_postings: JobPosting;
}

export default function JobRecommendations() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
    const [filteredRecs, setFilteredRecs] = useState<JobRecommendation[]>([]);
    const [filterLevel, setFilterLevel] = useState<string>("all");
    const [filterRemote, setFilterRemote] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("match_score");

    useEffect(() => {
        loadRecommendations();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [recommendations, filterLevel, filterRemote, sortBy]);

    const loadRecommendations = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate("/auth");
                return;
            }

            const { data, error } = await supabase
                .from("job_recommendations")
                .select(`
          *,
          job_postings (*)
        `)
                .eq("user_id", user.id)
                .order("match_score", { ascending: false });

            if (error) throw error;

            setRecommendations(data || []);
        } catch (error) {
            console.error("Error loading recommendations:", error);
            toast({
                title: "Error",
                description: "Failed to load job recommendations",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const generateRecommendations = async () => {
        setGenerating(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase.functions.invoke("generate-job-recommendations", {
                body: { userId: user.id, forceRefresh: true },
            });

            if (error) throw error;

            toast({
                title: "Success!",
                description: `Generated ${data.count} job recommendations`,
            });

            await loadRecommendations();
        } catch (error: any) {
            console.error("Error generating recommendations:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to generate recommendations",
                variant: "destructive",
            });
        } finally {
            setGenerating(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...recommendations];

        // Filter by experience level
        if (filterLevel !== "all") {
            filtered = filtered.filter(
                (rec) => rec.job_postings.experience_level === filterLevel
            );
        }

        // Filter by remote
        if (filterRemote === "remote") {
            filtered = filtered.filter((rec) => rec.job_postings.remote_ok);
        } else if (filterRemote === "onsite") {
            filtered = filtered.filter((rec) => !rec.job_postings.remote_ok);
        }

        // Sort
        filtered.sort((a, b) => {
            if (sortBy === "match_score") {
                return b.match_score - a.match_score;
            }
            return 0;
        });

        setFilteredRecs(filtered);
    };

    const getMatchColor = (score: number) => {
        if (score >= 80) return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
        if (score >= 60) return "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30";
        return "text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/30";
    };

    const getPriorityColor = (priority: string) => {
        if (priority === "high") return "destructive";
        if (priority === "medium") return "default";
        return "secondary";
    };

    const updateStatus = async (recId: string, status: string) => {
        try {
            const { error } = await supabase
                .from("job_recommendations")
                .update({ status })
                .eq("id", recId);

            if (error) throw error;

            setRecommendations((prev) =>
                prev.map((rec) => (rec.id === recId ? { ...rec, status } : rec))
            );

            toast({
                title: "Updated",
                description: `Job marked as ${status}`,
            });
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const createCareerPlan = async (rec: JobRecommendation) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            toast({
                title: "Creating Career Plan...",
                description: "This may take a moment",
            });

            const { data, error } = await supabase.functions.invoke("create-career-plan", {
                body: {
                    userId: user.id,
                    targetRole: rec.job_postings.title,
                    jobRecommendationId: rec.id,
                },
            });

            if (error) throw error;

            toast({
                title: "Success!",
                description: "Your 3-month career plan is ready",
            });

            // Navigate to career plan view (we'll create this component next)
            navigate(`/career-plan/${data.plan.id}`);
        } catch (error: any) {
            console.error("Error creating career plan:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to create career plan",
                variant: "destructive",
            });
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
        <div className="min-h-screen bg-background">
            {/* Header */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl"
            >
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                                    Job Recommendations
                                </h1>
                                <p className="text-sm text-muted-foreground">AI-matched opportunities for you</p>
                            </div>
                        </div>

                        <Button onClick={generateRecommendations} disabled={generating}>
                            <Sparkles className={`h-4 w-4 mr-2 ${generating ? "animate-spin" : ""}`} />
                            {generating ? "Generating..." : "Generate Recommendations"}
                        </Button>
                    </div>
                </div>
            </motion.header>

            {/* Main Content */}
            <main className="container mx-auto px-4 pt-32 pb-16 max-w-7xl">
                {recommendations.length === 0 ? (
                    <Card className="p-12 text-center border-dashed">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <Briefcase className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-2xl font-semibold mb-2">No Recommendations Yet</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            Complete some interview sessions first, then generate personalized job recommendations based on your performance.
                        </p>
                        <Button onClick={generateRecommendations} disabled={generating} size="lg">
                            <Sparkles className="h-5 w-5 mr-2" />
                            Generate Recommendations
                        </Button>
                    </Card>
                ) : (
                    <>
                        {/* Filters */}
                        <div className="flex flex-wrap gap-4 mb-8">
                            <Select value={filterLevel} onValueChange={setFilterLevel}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Experience Level" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Levels</SelectItem>
                                    <SelectItem value="entry">Entry Level</SelectItem>
                                    <SelectItem value="mid">Mid Level</SelectItem>
                                    <SelectItem value="senior">Senior Level</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={filterRemote} onValueChange={setFilterRemote}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Work Location" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Locations</SelectItem>
                                    <SelectItem value="remote">Remote Only</SelectItem>
                                    <SelectItem value="onsite">On-site Only</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="ml-auto text-sm text-muted-foreground flex items-center gap-2">
                                <Target className="h-4 w-4" />
                                {filteredRecs.length} {filteredRecs.length === 1 ? "match" : "matches"}
                            </div>
                        </div>

                        {/* Job Cards */}
                        <div className="grid gap-6">
                            <AnimatePresence mode="popLayout">
                                {filteredRecs.map((rec, index) => (
                                    <motion.div
                                        key={rec.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary">
                                            <CardHeader className="pb-4">
                                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-start gap-4 mb-3">
                                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                                                {rec.job_postings.company.charAt(0)}
                                                            </div>
                                                            <div className="flex-1">
                                                                <CardTitle className="text-2xl mb-1">{rec.job_postings.title}</CardTitle>
                                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                                    <Building2 className="h-4 w-4" />
                                                                    <span className="font-medium">{rec.job_postings.company}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-wrap gap-2 mt-3">
                                                            <Badge variant="outline" className="flex items-center gap-1">
                                                                <MapPin className="h-3 w-3" />
                                                                {rec.job_postings.location}
                                                            </Badge>
                                                            {rec.job_postings.remote_ok && (
                                                                <Badge variant="secondary">Remote OK</Badge>
                                                            )}
                                                            <Badge variant="outline" className="capitalize">
                                                                {rec.job_postings.experience_level}
                                                            </Badge>
                                                            {rec.job_postings.salary_range && (
                                                                <Badge variant="outline" className="flex items-center gap-1">
                                                                    <DollarSign className="h-3 w-3" />
                                                                    {rec.job_postings.salary_range}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className={`text-center px-6 py-4 rounded-2xl border-2 ${getMatchColor(rec.match_score)}`}>
                                                        <div className="text-4xl font-bold mb-1">{rec.match_score}%</div>
                                                        <div className="text-xs font-medium uppercase">Match Score</div>
                                                    </div>
                                                </div>
                                            </CardHeader>

                                            <CardContent className="space-y-6">
                                                {/* Description */}
                                                <p className="text-muted-foreground leading-relaxed">
                                                    {rec.job_postings.description}
                                                </p>

                                                {/* Skills Required */}
                                                {rec.job_postings.skills_required && rec.job_postings.skills_required.length > 0 && (
                                                    <div>
                                                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                                                            <Zap className="h-4 w-4 text-yellow-500" />
                                                            Skills Required
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {rec.job_postings.skills_required.map((skill, idx) => (
                                                                <Badge key={idx} variant="secondary">
                                                                    {skill}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Why You Match */}
                                                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                                                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                                        <CheckCircle2 className="h-5 w-5" />
                                                        Why You're a Great Fit
                                                    </h4>
                                                    <ul className="space-y-2">
                                                        {rec.match_reasons.map((reason, idx) => (
                                                            <li key={idx} className="flex items-start gap-2 text-sm">
                                                                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                                                                <span>{reason}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                {/* Skill Gaps */}
                                                {rec.skill_gaps && rec.skill_gaps.length > 0 && (
                                                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                                                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                                            <BookmarkPlus className="h-5 w-5" />
                                                            Skills to Learn
                                                        </h4>
                                                        <div className="grid sm:grid-cols-2 gap-3">
                                                            {rec.skill_gaps.map((gap, idx) => (
                                                                <div key={idx} className="flex items-center justify-between gap-2 text-sm">
                                                                    <span className="font-medium">{gap.skill}</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge variant={getPriorityColor(gap.priority)} className="text-xs">
                                                                            {gap.priority}
                                                                        </Badge>
                                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                            <Clock className="h-3 w-3" />
                                                                            {gap.estimated_time}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                <div className="flex flex-wrap gap-3 pt-4 border-t">
                                                    <Button onClick={() => createCareerPlan(rec)} className="flex-1 sm:flex-none">
                                                        <Sparkles className="h-4 w-4 mr-2" />
                                                        Create Career Plan
                                                    </Button>
                                                    {rec.job_postings.application_url && (
                                                        <Button variant="outline" asChild className="flex-1 sm:flex-none">
                                                            <a href={rec.job_postings.application_url} target="_blank" rel="noopener noreferrer">
                                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                                Apply Now
                                                            </a>
                                                        </Button>
                                                    )}
                                                    {rec.status !== "saved" && (
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => updateStatus(rec.id, "saved")}
                                                            className="flex-1 sm:flex-none"
                                                        >
                                                            <BookmarkPlus className="h-4 w-4 mr-2" />
                                                            Save
                                                        </Button>
                                                    )}
                                                    {rec.status !== "rejected" && (
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => updateStatus(rec.id, "rejected")}
                                                            className="flex-1 sm:flex-none"
                                                        >
                                                            <X className="h-4 w-4 mr-2" />
                                                            Not Interested
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
