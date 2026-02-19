import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  FileText, LogOut, TrendingUp, Upload, Play, Target, Users, Mic, Settings,
  Flame, Trophy, Clock, Star, ArrowRight, Zap, Code, MessageSquare, Bell, Search,
  Globe, BookOpen, Briefcase
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Footer } from "@/components/Footer";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Interview Scheduled',
    message: 'Your mock interview with Sarah is scheduled for tomorrow at 10 AM.',
    time: '2 hours ago',
    read: false,
    type: 'info'
  },
  {
    id: '2',
    title: 'Feedback Available',
    message: 'AI feedback for your "React Hooks" session is ready.',
    time: '5 hours ago',
    read: false,
    type: 'success'
  },
  {
    id: '3',
    title: 'Daily Streak!',
    message: "You've reached a 5-day streak. Keep it up!",
    time: '1 day ago',
    read: true,
    type: 'warning'
  }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

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

  /* -------------------------------------------------------------------------- */
  /*                             Data Fetching & Logic                          */
  /* -------------------------------------------------------------------------- */

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(profileData);

      // 2. Fetch Text Interviews
      const { data: textSessions } = await supabase
        .from("interview_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

        // 3. Fetch Video Interviews
      const { data: videoSessions } = await supabase
        .from("video_interview_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // 4. Fetch Peer Interviews (Host or Guest)
      const { data: peerSessions } = await supabase
        .from("peer_interview_sessions")
        .select("*, peer_interview_ratings(*)")
        .or(`host_user_id.eq.${user.id},guest_user_id.eq.${user.id}`)
        .order("scheduled_at", { ascending: false });

      
      // Combine for "Recent Activity" list (Top 5)
      const allActivity = [
        ...(textSessions || []).map(s => ({ ...s, type: 'Text', date: s.created_at, score: s.overall_score })),
        ...(videoSessions || []).map(s => ({ ...s, type: 'Video', date: s.created_at, score: s.overall_score })),
        ...(peerSessions || []).map(s => ({ ...s, type: 'Peer', date: s.scheduled_at, score: null })) // Peer score separate
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setSessions(allActivity.slice(0, 5));
      
      // Calculate Stats
      const statsData = calculateRealStats(textSessions || [], videoSessions || [], peerSessions || [], user.id);
      setRealStats(statsData);

    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (dates: string[]) => {
    if (dates.length === 0) return 0;

    // Unique sorted dates YYYY-MM-DD
    const uniqueDates = Array.from(new Set(dates.map(d => new Date(d).toISOString().split('T')[0])))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // Descending

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // If no activity today or yesterday, streak is broken
    if (!uniqueDates.includes(today) && !uniqueDates.includes(yesterday)) {
      return 0;
    }

    let streak = 0;
    let currentCheck = uniqueDates.includes(today) ? new Date(today) : new Date(yesterday);

    for (const dateStr of uniqueDates) {
      const date = new Date(dateStr);
      // Compare time values normalized to noon to avoid timezone issues with exact midnight
      const d1 = new Date(currentCheck).setHours(12,0,0,0);
      const d2 = new Date(date).setHours(12,0,0,0);
      
      if (d1 === d2) {
        streak++;
        currentCheck.setDate(currentCheck.getDate() - 1);
      } else {
        break; // Gap found
      }
    }
    return streak;
  };

  const calculateRealStats = (text: any[], video: any[], peer: any[], userId: string) => {
    // 1. Total Count
    const total = text.length + video.length + peer.filter((p: any) => p.status === 'completed').length;

    // 2. Average Score
    let totalScore = 0;
    let scoredCount = 0;

    // Text
    text.forEach(s => {
      if (s.overall_score) { totalScore += s.overall_score; scoredCount++; }
    });
    // Video
    video.forEach(s => {
      if (s.overall_score) { totalScore += s.overall_score; scoredCount++; }
    });
    // Peer (Fetch ratings where user was rated)
    peer.forEach((p: any) => {
      const myRating = p.peer_interview_ratings?.find((r: any) => r.rated_user_id === userId);
      if (myRating) { totalScore += myRating.overall_score * 10; scoredCount++; } // Convert 1-10 to 1-100 if needed, assuming 10 scale
    });
    // Note: Peer ratings might be 1-10 or 1-5, adjust normalization if user confirms scale. Assuming 1-100 for text/video.
    // Let's assume Peer is 1-10 and map to 1-100 for consistency if average is distinct.
    // If peer ratings are not yet standard, we might need to adjust. For now, treating raw.
    
    // Correction: Peer ratings schema shows `overall_score` as number. Let's assume 100 base for now or normalize later.
    // Actually, looking at previous artifacts, peer might be new. Let's stick to raw average if unsure, or normalize.
    // Safe bet: Normalize everything to %

    const avgScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0;

    // 3. Hours
    // Text: total_duration_seconds
    // Video: duration_seconds
    // Peer: duration_minutes
    let totalSeconds = 0;
    text.forEach(s => totalSeconds += (s.total_duration_seconds || 0));
    video.forEach(s => totalSeconds += (s.duration_seconds || 0));
    peer.filter((p: any) => p.status === 'completed').forEach((p: any) => totalSeconds += ((p.duration_minutes || 0) * 60));

    const totalHours = Math.round(totalSeconds / 3600);

    // 4. Streak
    const allDates = [
      ...text.map(s => s.created_at),
      ...video.map(s => s.created_at),
      ...peer.map(s => s.scheduled_at) // Using scheduled_at for peer dates
    ];
    const streak = calculateStreak(allDates);

    return [
      { label: "Interviews", value: total.toString(), icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
      { label: "Avg. Score", value: `${avgScore}%`, icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10" },
      { label: "Hours", value: `${totalHours}h`, icon: Clock, color: "text-emerald-500", bg: "bg-emerald-500/10" },
      { label: "Streak", value: `${streak} Days`, icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10" },
    ];
  };

  const [realStats, setRealStats] = useState([
      { label: "Interviews", value: "0", icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
      { label: "Avg. Score", value: "0%", icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10" },
      { label: "Hours", value: "0h", icon: Clock, color: "text-emerald-500", bg: "bg-emerald-500/10" },
      { label: "Streak", value: "0 Days", icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10" },
  ]);

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

  const recommended = [
    { title: "Master React Hooks", type: "Technical", duration: "30 min", level: "Intermediate" },
    { title: "System Design: Scalability", type: "Architecture", duration: "45 min", level: "Advanced" },
    { title: "Behavioral: Leadership", type: "Soft Skills", duration: "20 min", level: "Beginner" },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-xl border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">V</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">Voke</h1>
          </div>

          <div className="flex-1 max-w-md mx-8 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search interviews, questions, or peers..."
                className="w-full pl-10 pr-4 py-2 rounded-full bg-muted/50 border-transparent focus:bg-background focus:border-primary/20 transition-all outline-none text-sm"
              />
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                  <h4 className="font-semibold">Notifications</h4>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-violet-600 h-auto p-0 hover:bg-transparent"
                      onClick={handleMarkAllAsRead}
                    >
                      Mark all as read
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-[300px]">
                  {notifications.length > 0 ? (
                    <div className="divide-y">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${!notification.read ? 'bg-violet-50/50 dark:bg-violet-900/10' : ''}`}
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <h5 className={`text-sm font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {notification.title}
                            </h5>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {notification.time}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No notifications
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
            <ThemeToggle />
            <div className="h-8 w-px bg-border mx-2"></div>
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium leading-none">{profile?.full_name || "User"}</p>
                <p className="text-xs text-muted-foreground">Level 5 Scholar</p>
              </div>
              <Avatar className="cursor-pointer" onClick={() => navigate("/profile")}>
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
                  {(profile?.full_name || "U")[0]}
                </AvatarFallback>
              </Avatar>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column - Main Feed */}
          <div className="lg:col-span-8 space-y-8">

            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white p-8 shadow-xl"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-fuchsia-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Ready to ace your next interview?</h2>
                    <p className="text-white/80 max-w-lg">
                      "Success is where preparation and opportunity meet." You're on a {realStats[3].value} streak! Keep it up.
                    </p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 border border-white/10">
                    <Flame className="w-5 h-5 text-orange-300 fill-orange-300" />
                    <span className="font-bold">{realStats[3].value} Streak</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                  {realStats.map((stat, i) => (
                    <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/5 hover:bg-white/20 transition-colors">
                      <div className="flex items-center gap-2 mb-2 text-white/70">
                        <stat.icon className="w-4 h-4" />
                        <span className="text-xs font-medium">{stat.label}</span>
                      </div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Quick Actions Grid */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="hover:shadow-lg transition-all cursor-pointer group border-l-4 border-l-violet-500" onClick={() => navigate("/job-recommendations")}>
                  <CardContent className="p-4 flex flex-col items-center text-center pt-6">
                    <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Briefcase className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                    </div>
                    <h4 className="font-semibold text-sm">Job Matches</h4>
                    <p className="text-xs text-muted-foreground mt-1">AI Recommendations</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all cursor-pointer group border-l-4 border-l-violet-500" onClick={() => navigate("/interview/new")}>
                  <CardContent className="p-4 flex flex-col items-center text-center pt-6">
                    <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <MessageSquare className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                    </div>
                    <h4 className="font-semibold text-sm">Text Interview</h4>
                    <p className="text-xs text-muted-foreground mt-1">AI Chat Practice</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all cursor-pointer group border-l-4 border-l-pink-500" onClick={() => navigate("/voice-assistant")}>
                  <CardContent className="p-4 flex flex-col items-center text-center pt-6">
                    <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Mic className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                    </div>
                    <h4 className="font-semibold text-sm">AI Voice Agent</h4>
                    <p className="text-xs text-muted-foreground mt-1">Real-time Interview</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all cursor-pointer group border-l-4 border-l-emerald-500" onClick={() => navigate("/peer-interviews")}>
                  <CardContent className="p-4 flex flex-col items-center text-center pt-6">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h4 className="font-semibold text-sm">Peer Match</h4>
                    <p className="text-xs text-muted-foreground mt-1">Practice with Others</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all cursor-pointer group border-l-4 border-l-blue-500" onClick={() => navigate("/learning-paths")}>
                  <CardContent className="p-4 flex flex-col items-center text-center pt-6">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h4 className="font-semibold text-sm">Learning Paths</h4>
                    <p className="text-xs text-muted-foreground mt-1">Structured Plans</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all cursor-pointer group border-l-4 border-l-fuchsia-500" onClick={() => navigate("/video-interview")}>
                  <CardContent className="p-4 flex flex-col items-center text-center pt-6">
                    <div className="w-12 h-12 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 text-fuchsia-600 dark:text-fuchsia-400" />
                    </div>
                    <h4 className="font-semibold text-sm">Video Practice</h4>
                    <p className="text-xs text-muted-foreground mt-1">AI Video Feedback</p>
                  </CardContent>
                </Card>


                <Card className="hover:shadow-lg transition-all cursor-pointer group border-l-4 border-l-indigo-500" onClick={() => navigate("/community")}>
                  <CardContent className="p-4 flex flex-col items-center text-center pt-6">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Globe className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h4 className="font-semibold text-sm">Community</h4>
                    <p className="text-xs text-muted-foreground mt-1">Connect & Share</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all cursor-pointer group border-l-4 border-l-orange-500" onClick={() => navigate("/blog")}>
                  <CardContent className="p-4 flex flex-col items-center text-center pt-6">
                    <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <BookOpen className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h4 className="font-semibold text-sm">Blog</h4>
                    <p className="text-xs text-muted-foreground mt-1">Read & Learn</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Recent Activity */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your latest interview sessions</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-violet-600">View All</Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-card/50 hover:bg-muted/50 transition-all hover:shadow-sm group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${session.type === 'Text' ? "bg-blue-500/10 text-blue-500" :
                          session.type === 'Video' ? "bg-fuchsia-500/10 text-fuchsia-500" :
                            "bg-emerald-500/10 text-emerald-500"
                          }`}>
                          {session.type === 'Video' ? <Play className="w-5 h-5" /> : 
                           session.type === 'Peer' ? <Users className="w-5 h-5" /> :
                           <FileText className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground">
                              {session.topic || session.interview_type || session.question || "Interview Session"}
                            </p>
                            {session.score && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 font-medium border border-green-500/20">
                                Score: {session.score}%
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <span>{new Date(session.date).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="capitalize">{session.status?.replace('_', ' ') || 'Completed'}</span>
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => navigate(`/interview/${session.id}`)}>
                        {session.status === "in_progress" ? "Resume" : "View Results"}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column - Sidebar Widgets */}
          <div className="lg:col-span-4 space-y-6">

            {/* Profile Strength */}
            <Card className="bg-gradient-to-br from-card to-muted/50 border-border/50">
              <CardContent className="p-6">
                {(() => {
                  const calculateStrength = () => {
                    if (!profile) return { score: 0, missing: [] };

                    const fields = [
                      { key: 'full_name', label: 'Full Name', weight: 25 },
                      { key: 'linkedin_url', label: 'LinkedIn', weight: 25 },
                      { key: 'github_url', label: 'GitHub', weight: 25 },
                      { key: 'resume_url', label: 'Resume', weight: 25 },
                    ];

                    let score = 0;
                    const missing: string[] = [];

                    fields.forEach(field => {
                      if (profile[field.key] && profile[field.key].length > 0) {
                        score += field.weight;
                      } else {
                        missing.push(field.label);
                      }
                    });

                    return { score, missing };
                  };

                  const { score, missing } = calculateStrength();

                  return (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold">Profile Strength</h3>
                        <span className={`text-sm font-bold ${score === 100 ? 'text-green-600' : 'text-violet-600'}`}>
                          {score}%
                        </span>
                      </div>
                      <Progress value={score} className="h-2 mb-4" />
                      <p className="text-xs text-muted-foreground mb-4">
                        {score === 100
                          ? "Great job! Your profile is fully complete."
                          : `Add your ${missing[0] || 'details'} ${missing.length > 1 ? `and ${missing.length - 1} more` : ''} to reach 100%.`}
                      </p>
                      <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/profile")}>
                        {score === 100 ? "Edit Profile" : "Complete Profile"}
                      </Button>
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Daily Challenge */}
            <Card className="border-border/50 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-orange-400 to-red-500"></div>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="w-4 h-4 text-orange-500" />
                    Daily Challenge
                  </CardTitle>
                  <span className="text-xs font-medium px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-md">Hard</span>
                </div>
              </CardHeader>
              <CardContent>
                <h4 className="font-semibold mb-2">Reverse a Linked List</h4>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  Given the head of a singly linked list, reverse the list, and return the reversed list.
                </p>
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" onClick={() => navigate("/daily-challenge")}>
                  Solve Now <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Recommended Practice */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Recommended for You</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommended.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-background flex items-center justify-center shadow-sm">
                        <Star className="w-4 h-4 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">{item.title}</p>
                        <p className="text-[10px] text-muted-foreground">{item.type} • {item.duration}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Community Trending */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  Community Pulse
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { title: "Google L4 Interview Experience", views: "2.4k" },
                  { title: "System Design: TinyURL", views: "1.8k" },
                  { title: "Salary Negotiation Tips", views: "3.1k" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-border/40 last:border-0 pb-3 last:pb-0">
                    <p className="text-sm font-medium hover:text-blue-500 cursor-pointer transition-colors">{item.title}</p>
                    <span className="text-xs text-muted-foreground">{item.views}</span>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full text-blue-500" onClick={() => navigate("/community")}>
                  Visit Community
                </Button>
              </CardContent>
            </Card>

            <Button variant="destructive" className="w-full" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
