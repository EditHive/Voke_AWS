import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ArrowLeft, Calendar, CheckCircle2, Circle, Download, ExternalLink,
    Target, TrendingUp, BookOpen, Sparkles, Trophy, Zap
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "motion/react";

interface WeeklyTask {
    month: number;
    week: number;
    tasks: string[];
    completed: boolean;
}

interface Resource {
    title: string;
    type: string;
    url: string;
    cost: string;
    priority: string;
}

interface Milestone {
    month: number;
    title: string;
    description: string;
    achieved: boolean;
}

interface CareerPlan {
    id: string;
    target_role: string;
    current_skill_level: string;
    month_1_goals: any;
    month_2_goals: any;
    month_3_goals: any;
    weekly_tasks: WeeklyTask[];
    resources: Resource[];
    milestones: Milestone[];
    progress_percentage: number;
    created_at: string;
}

export default function CareerPlanView() {
    const { planId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState<CareerPlan | null>(null);
    const [selectedMonth, setSelectedMonth] = useState(1);

    useEffect(() => {
        loadCareerPlan();
    }, [planId]);

    const loadCareerPlan = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate("/auth");
                return;
            }

            const { data, error } = await supabase
                .from("user_career_plans")
                .select("*")
                .eq("id", planId)
                .eq("user_id", user.id)
                .single();

            if (error) throw error;
            setPlan(data);
        } catch (error) {
            console.error("Error loading career plan:", error);
            toast({
                title: "Error",
                description: "Failed to load career plan",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleTaskCompletion = async (taskIndex: number) => {
        if (!plan) return;

        const updatedTasks = [...plan.weekly_tasks];
        updatedTasks[taskIndex].completed = !updatedTasks[taskIndex].completed;

        // Calculate new progress
        const completedTasks = updatedTasks.filter(t => t.completed).length;
        const totalTasks = updatedTasks.length;
        const newProgress = Math.round((completedTasks / totalTasks) * 100);

        try {
            const { error } = await supabase
                .from("user_career_plans")
                .update({
                    weekly_tasks: updatedTasks,
                    progress_percentage: newProgress,
                })
                .eq("id", plan.id);

            if (error) throw error;

            setPlan({
                ...plan,
                weekly_tasks: updatedTasks,
                progress_percentage: newProgress,
            });

            if (newProgress === 100) {
                toast({
                    title: "🎉 Congratulations!",
                    description: "You've completed your 3-month career plan!",
                });
            }
        } catch (error) {
            console.error("Error updating task:", error);
        }
    };

    const getMonthTasks = (month: number) => {
        return plan?.weekly_tasks.filter(t => t.month === month) || [];
    };

    const getMonthResources = (month: number) => {
        return plan?.resources.filter(r => {
            if (month === 1) return r.priority === "high";
            if (month === 2) return r.priority === "medium";
            return r.priority === "low";
        }) || [];
    };

    const getMonthMilestone = (month: number) => {
        return plan?.milestones.find(m => m.month === month);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Sparkles className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
                    <p className="text-muted-foreground">Loading your career plan...</p>
                </div>
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Card className="p-8 text-center">
                    <p className="text-muted-foreground mb-4">Career plan not found</p>
                    <Button onClick={() => navigate("/job-recommendations")}>
                        Back to Job Recommendations
                    </Button>
                </Card>
            </div>
        );
    }

    const monthGoals = [plan.month_1_goals, plan.month_2_goals, plan.month_3_goals];

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
                            <Button variant="ghost" size="icon" onClick={() => navigate("/job-recommendations")}>
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                                    3-Month Career Plan
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Target: {plan.target_role}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <div className="text-2xl font-bold">{plan.progress_percentage}%</div>
                                <div className="text-xs text-muted-foreground">Complete</div>
                            </div>
                            <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Export PDF
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* Main Content */}
            <main className="container mx-auto px-4 pt-32 pb-16 max-w-6xl">
                {/* Progress Overview */}
                <Card className="mb-8 overflow-hidden border-2 border-primary/20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <CardHeader className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <CardTitle className="text-2xl">Your Progress</CardTitle>
                            <Badge variant="secondary" className="text-lg px-4 py-2">
                                {plan.current_skill_level} Level
                            </Badge>
                        </div>
                        <Progress value={plan.progress_percentage} className="h-3" />
                        <div className="flex justify-between text-sm text-muted-foreground mt-2">
                            <span>Started {new Date(plan.created_at).toLocaleDateString()}</span>
                            <span>
                                {plan.weekly_tasks.filter(t => t.completed).length} / {plan.weekly_tasks.length} tasks completed
                            </span>
                        </div>
                    </CardHeader>
                </Card>

                {/* Month Tabs */}
                <Tabs value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                    <TabsList className="grid w-full grid-cols-3 mb-8">
                        <TabsTrigger value="1" className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Month 1
                        </TabsTrigger>
                        <TabsTrigger value="2" className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Month 2
                        </TabsTrigger>
                        <TabsTrigger value="3" className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Month 3
                        </TabsTrigger>
                    </TabsList>

                    {[1, 2, 3].map((month) => (
                        <TabsContent key={month} value={month.toString()} className="space-y-6">
                            {/* Month Goals */}
                            <Card className="border-l-4 border-l-violet-500">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Target className="h-5 w-5 text-violet-600" />
                                        {monthGoals[month - 1]?.title || `Month ${month} Goals`}
                                    </CardTitle>
                                    <CardDescription>
                                        Focus areas for this month
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {monthGoals[month - 1]?.focus_areas?.map((area: string, idx: number) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <Zap className="h-4 w-4 text-yellow-500" />
                                                <span className="font-medium">{area}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {monthGoals[month - 1]?.milestone && (
                                        <div className="mt-4 p-4 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                                            <div className="flex items-center gap-2 font-semibold text-violet-600 dark:text-violet-400 mb-1">
                                                <Trophy className="h-4 w-4" />
                                                Milestone
                                            </div>
                                            <p className="text-sm">{monthGoals[month - 1].milestone}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Weekly Tasks */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                        Weekly Tasks
                                    </CardTitle>
                                    <CardDescription>
                                        Check off tasks as you complete them
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        {getMonthTasks(month).map((weekData, weekIdx) => (
                                            <div key={weekIdx} className="space-y-3">
                                                <h4 className="font-semibold flex items-center gap-2">
                                                    <Calendar className="h-4 w-4" />
                                                    Week {weekData.week}
                                                </h4>
                                                <div className="space-y-2 pl-6">
                                                    {weekData.tasks.map((task, taskIdx) => {
                                                        const globalTaskIndex = plan.weekly_tasks.findIndex(
                                                            t => t.month === month && t.week === weekData.week
                                                        );
                                                        return (
                                                            <div key={taskIdx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                                                                <Checkbox
                                                                    checked={weekData.completed}
                                                                    onCheckedChange={() => toggleTaskCompletion(globalTaskIndex)}
                                                                    className="mt-1"
                                                                />
                                                                <span className={weekData.completed ? "line-through text-muted-foreground" : ""}>
                                                                    {task}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Learning Resources */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BookOpen className="h-5 w-5 text-blue-600" />
                                        Learning Resources
                                    </CardTitle>
                                    <CardDescription>
                                        Recommended courses and materials
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {getMonthResources(month).map((resource, idx) => (
                                            <Card key={idx} className="hover:shadow-lg transition-shadow">
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <CardTitle className="text-base">{resource.title}</CardTitle>
                                                        <Badge variant={resource.cost === "free" ? "secondary" : "default"} className="shrink-0">
                                                            {resource.cost}
                                                        </Badge>
                                                    </div>
                                                    <Badge variant="outline" className="w-fit text-xs">
                                                        {resource.type}
                                                    </Badge>
                                                </CardHeader>
                                                <CardContent>
                                                    <Button variant="outline" size="sm" asChild className="w-full">
                                                        <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="h-3 w-3 mr-2" />
                                                            View Resource
                                                        </a>
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Milestone */}
                            {getMonthMilestone(month) && (
                                <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                            <Trophy className="h-6 w-6" />
                                            Month {month} Milestone
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <h4 className="font-semibold text-lg mb-2">
                                            {getMonthMilestone(month)?.title}
                                        </h4>
                                        <p className="text-muted-foreground mb-4">
                                            {getMonthMilestone(month)?.description}
                                        </p>
                                        {getMonthMilestone(month)?.achieved && (
                                            <Badge className="bg-emerald-500">
                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                Achieved!
                                            </Badge>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>
                    ))}
                </Tabs>
            </main>
        </div>
    );
}
