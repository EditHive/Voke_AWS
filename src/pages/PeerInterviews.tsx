import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Clock, Target, Plus, Loader2, Video, Search, Star, Zap, ArrowRight, UserPlus, BookOpen, CheckCircle2, MessageSquare, UserCheck, XCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOnlinePresence } from "@/components/OnlinePresenceProvider";
import { PeerChat } from "@/components/PeerChat";

interface PeerSession {
  id: string;
  topic: string;
  difficulty_level: string;
  duration_minutes: number;
  scheduled_at: string;
  host_user_id: string;
  guest_user_id: string | null;
  status: string;
  host_profile?: {
    full_name: string | null;
    avatar_url?: string | null;
  };
  guest_profile?: {
    full_name: string | null;
    avatar_url?: string | null;
  };
}

const PeerInterviews = () => {
  const navigate = useNavigate();
  const { onlineUsers } = useOnlinePresence();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'browse' | 'upcoming' | 'requests'>('browse');
  const [searchQuery, setSearchQuery] = useState("");
  const [sessions, setSessions] = useState<PeerSession[]>([]);
  const [userSessions, setUserSessions] = useState<PeerSession[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    fetchSessions();
    
    // Subscribe to changes
    const channel = supabase
      .channel('public:peer_interview_sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'peer_interview_sessions' }, () => {
        fetchSessions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch all available sessions (future, scheduled or pending)
      // We include sessions from the last hour to ensure sessions starting "now" are visible
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data: allSessions, error } = await supabase
        .from('peer_interview_sessions')
        .select('*')
        .in('status', ['scheduled', 'pending'])
        .gt('scheduled_at', oneHourAgo)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;

      console.log("Fetched sessions:", allSessions);
      console.log("Current User:", user?.id);

      // Fetch profiles for hosts and guests
      const userIds = new Set<string>();
      allSessions?.forEach(s => {
        userIds.add(s.host_user_id);
        if (s.guest_user_id) userIds.add(s.guest_user_id);
      });
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', Array.from(userIds));

      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      // Transform data to match interface
      const formattedSessions: PeerSession[] = (allSessions || []).map(session => ({
        ...session,
        host_profile: profileMap.get(session.host_user_id) || { full_name: 'Unknown User' },
        guest_profile: session.guest_user_id ? profileMap.get(session.guest_user_id) : undefined
      }));

      if (user) {
        // Filter for "Browse": Not hosted by me, and (no guest OR guest is me - though if guest is me it should be in upcoming)
        // Actually for Browse: Not hosted by me AND No guest (Available to request)
        const browse = formattedSessions.filter(s => 
          s.host_user_id !== user.id && !s.guest_user_id && s.status === 'scheduled'
        );
        setSessions(browse);

        // Filter for "Upcoming": Hosted by me OR Guest is me
        const upcoming = formattedSessions.filter(s => 
          s.host_user_id === user.id || s.guest_user_id === user.id
        );
        setUserSessions(upcoming);
      } else {
        setSessions(formattedSessions.filter(s => !s.guest_user_id && s.status === 'scheduled'));
        setUserSessions([]);
      }

    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSession = async (sessionId: string) => {
    if (!currentUserId) {
      toast.error("Please login to request a session");
      navigate("/auth");
      return;
    }

    try {
      const { error } = await supabase
        .from('peer_interview_sessions')
        .update({ 
          guest_user_id: currentUserId,
          status: 'pending' // Set to pending for approval
        })
        .eq('id', sessionId);

      if (error) throw error;

      toast.success("Request sent to host!");
      fetchSessions();
      setActiveTab('upcoming');
    } catch (error: any) {
      console.error("Error requesting session:", error);
      console.error("Error details:", error.message, error.details, error.hint);
      toast.error(`Failed to request session: ${error.message || 'Unknown error'}`);
    }
  };

  const handleApproveRequest = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('peer_interview_sessions')
        .update({ status: 'scheduled' })
        .eq('id', sessionId);

      if (error) throw error;
      toast.success("Session approved!");
      fetchSessions();
    } catch (error) {
      console.error("Error approving session:", error);
      toast.error("Failed to approve session");
    }
  };

  const handleDeclineRequest = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('peer_interview_sessions')
        .update({ 
          guest_user_id: null,
          status: 'scheduled' // Reset to scheduled so others can book
        })
        .eq('id', sessionId);

      if (error) throw error;
      toast.success("Request declined.");
      fetchSessions();
    } catch (error) {
      console.error("Error declining session:", error);
      toast.error("Failed to decline session");
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    // In a real app, use a proper Dialog component. For now, browser confirm is quick and effective.
    if (!window.confirm("Are you sure you want to delete this session? This action cannot be undone.")) return;

    try {
      const { error } = await supabase
        .from('peer_interview_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      toast.success("Session deleted successfully");
      fetchSessions();
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Failed to delete session");
    }
  };

  const handleJoinSession = (sessionId: string) => {
    navigate(`/peer-interviews/session/${sessionId}`);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredSessions = sessions.filter(session => 
    session.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.difficulty_level.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Finding peers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
       {/* Background Elements */}
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/dashboard")}>
            <img 
              src="/images/voke_logo.png" 
              alt="Voke Logo" 
              className="w-10 h-10 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Peer Connect</h1>
              <p className="text-xs text-muted-foreground">Collaborative Practice</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button onClick={() => navigate("/peer-interviews/create")} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all">
              <Plus className="h-4 w-4 mr-2" />
              New Session
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1 relative z-10">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Master interviews with <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Real Peers</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              Practice technical and behavioral interviews with peers from top companies. Get real-time feedback and improve together.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by topic, role, or skill..." 
                  className="pl-10 h-12 bg-card/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button size="lg" variant="outline" className="h-12 px-6 border-blue-500/20 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                <Zap className="w-4 h-4 mr-2" />
                Quick Match
              </Button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <Card className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-0 shadow-xl shadow-blue-500/20 relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <CardContent className="p-8 relative z-10 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-full bg-white/20 backdrop-blur-md">
                      <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-100">Community Rating</p>
                      <h3 className="text-3xl font-bold">4.9/5.0</h3>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-blue-100 border-b border-white/10 pb-2">
                      <span>Active Peers</span>
                      <span className="font-bold">{onlineUsers.size} Online</span>
                    </div>
                    <div className="flex justify-between text-sm text-blue-100">
                      <span>Sessions Today</span>
                      <span className="font-bold">45</span>
                    </div>
                  </div>
                </div>
                <Button variant="secondary" className="w-full mt-6 bg-white text-blue-600 hover:bg-blue-50 border-0">
                  View Leaderboard
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs & Content */}
        <div className="space-y-6">
          <Tabs defaultValue="browse" value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <div className="flex items-center justify-between border-b border-border/40 pb-1 mb-6">
              <TabsList className="bg-transparent p-0 h-auto gap-6">
                <TabsTrigger 
                  value="browse"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 text-muted-foreground data-[state=active]:text-primary transition-all"
                >
                  Browse Sessions
                </TabsTrigger>
                <TabsTrigger 
                  value="upcoming"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 text-muted-foreground data-[state=active]:text-primary transition-all"
                >
                  My Upcoming
                  {userSessions.filter(s => !(s.host_user_id === currentUserId && s.status === 'pending')).length > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 min-w-[1.25rem] text-[10px]">
                      {userSessions.filter(s => !(s.host_user_id === currentUserId && s.status === 'pending')).length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="requests"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 text-muted-foreground data-[state=active]:text-primary transition-all"
                >
                  Requests
                  {userSessions.filter(s => s.host_user_id === currentUserId && s.status === 'pending').length > 0 && (
                    <Badge variant="destructive" className="ml-2 h-5 px-1.5 min-w-[1.25rem] text-[10px]">
                      {userSessions.filter(s => s.host_user_id === currentUserId && s.status === 'pending').length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="browse" className="mt-0">
              <AnimatePresence mode="popLayout">
                {filteredSessions.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-16 text-center bg-card/30 rounded-2xl border border-dashed border-border"
                  >
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                      <Search className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No sessions found</h3>
                    <p className="text-muted-foreground max-w-sm mb-6">
                      Try adjusting your search or create a new session to get started.
                    </p>
                    <Button onClick={() => navigate("/peer-interviews/create")}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Session
                    </Button>
                  </motion.div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSessions.map((session, idx) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Card className="group hover:border-primary/50 transition-all hover:shadow-lg bg-card/50 backdrop-blur-sm h-full flex flex-col">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start mb-2">
                              <Badge variant={
                                session.difficulty_level === "advanced" ? "destructive" :
                                session.difficulty_level === "intermediate" ? "default" : "secondary"
                              } className="capitalize">
                                {session.difficulty_level}
                              </Badge>
                              <div className="flex items-center gap-2">
                                {onlineUsers.has(session.host_user_id) && (
                                  <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Online" />
                                )}
                                <div className="p-2 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                                  <Video className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                </div>
                              </div>
                            </div>
                            <CardTitle className="line-clamp-1 text-lg">{session.topic}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-2">
                              <Avatar className="w-6 h-6 border border-border">
                                <AvatarImage src={session.host_profile?.avatar_url || undefined} />
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                  {getInitials(session.host_profile?.full_name || "Anonymous")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">Hosted by {session.host_profile?.full_name || "Anonymous"}</span>
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="flex-1 flex flex-col justify-end">
                            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-6 bg-muted/30 p-3 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary/70" />
                                {new Date(session.scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                <span className="text-xs opacity-70">
                                  {new Date(session.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary/70" />
                                {session.duration_minutes} min
                              </div>
                            </div>
                            <Button 
                              className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-sm" 
                              onClick={() => handleRequestSession(session.id)}
                            >
                              Request to Join
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </TabsContent>

            <TabsContent value="requests" className="mt-0">
              <AnimatePresence mode="popLayout">
                {userSessions.filter(s => s.host_user_id === currentUserId && s.status === 'pending').length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-16 text-center bg-card/30 rounded-2xl border border-dashed border-border"
                  >
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                      <UserPlus className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No pending requests</h3>
                    <p className="text-muted-foreground max-w-sm mb-6">
                      When users request to join your sessions, they will appear here.
                    </p>
                  </motion.div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userSessions
                      .filter(s => s.host_user_id === currentUserId && s.status === 'pending')
                      .map((session, idx) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Card className="group border-yellow-500/20 bg-gradient-to-br from-card to-yellow-500/5 hover:shadow-lg transition-all h-full flex flex-col">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start mb-2">
                              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                                Request Received
                              </Badge>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                              </div>
                            </div>
                            <CardTitle className="line-clamp-1 text-lg">{session.topic}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-2">
                              <Avatar className="w-6 h-6 border border-border">
                                <AvatarImage src={session.guest_profile?.avatar_url || undefined} />
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                  {getInitials(session.guest_profile?.full_name || "Guest")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium text-foreground">
                                {session.guest_profile?.full_name || "Unknown User"}
                              </span>
                              <span className="text-xs text-muted-foreground">wants to join</span>
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="flex-1 flex flex-col justify-end">
                            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-6 bg-background/50 p-3 rounded-lg border border-border/50">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" />
                                <div className="flex flex-col">
                                  <span className="font-medium text-foreground">
                                    {new Date(session.scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </span>
                                  <span className="text-xs">
                                    {new Date(session.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" />
                                <div className="flex flex-col">
                                  <span className="font-medium text-foreground">{session.duration_minutes} min</span>
                                  <span className="text-xs">Duration</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button 
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={() => handleApproveRequest(session.id)}
                              >
                                <UserCheck className="w-4 h-4 mr-2" />
                                Accept
                              </Button>
                              <Button 
                                variant="destructive"
                                className="flex-1"
                                onClick={() => handleDeclineRequest(session.id)}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </TabsContent>

            <TabsContent value="upcoming" className="mt-0">
              <AnimatePresence mode="popLayout">
                {userSessions.filter(s => !(s.host_user_id === currentUserId && s.status === 'pending')).length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-16 text-center bg-card/30 rounded-2xl border border-dashed border-border"
                  >
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                      <Calendar className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No upcoming sessions</h3>
                    <p className="text-muted-foreground max-w-sm mb-6">
                      You haven't scheduled any peer interviews yet. Browse available sessions or create your own.
                    </p>
                    <Button onClick={() => navigate("/peer-interviews/create")}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Session
                    </Button>
                  </motion.div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userSessions
                      .filter(s => !(s.host_user_id === currentUserId && s.status === 'pending'))
                      .map((session, idx) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Card className="group border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:shadow-lg transition-all h-full flex flex-col">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start mb-2">
                              <Badge variant="outline" className="bg-background/50 backdrop-blur-sm border-primary/30 text-primary">
                                {session.host_user_id === currentUserId ? "Hosting" : "Guest"}
                              </Badge>
                              <div className="flex items-center gap-2">
                                {session.status === 'pending' ? (
                                  <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">
                                    Pending Approval
                                  </Badge>
                                ) : (
                                  <div className="flex items-center gap-2 text-xs font-medium text-green-600 bg-green-500/10 px-2 py-1 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Confirmed
                                  </div>
                                )}
                                {session.host_user_id === currentUserId && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => handleDeleteSession(session.id)}
                                    title="Delete Session"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <CardTitle className="line-clamp-1 text-lg">{session.topic}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-2">
                              <Avatar className="w-6 h-6 border border-border">
                                <AvatarImage src={session.host_profile?.avatar_url || undefined} />
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                  {getInitials(session.host_profile?.full_name || "Anonymous")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">
                                {session.host_user_id === currentUserId ? "You" : session.host_profile?.full_name}
                              </span>
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="flex-1 flex flex-col justify-end">
                            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-6 bg-background/50 p-3 rounded-lg border border-border/50">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" />
                                <div className="flex flex-col">
                                  <span className="font-medium text-foreground">
                                    {new Date(session.scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </span>
                                  <span className="text-xs">
                                    {new Date(session.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" />
                                <div className="flex flex-col">
                                  <span className="font-medium text-foreground">{session.duration_minutes} min</span>
                                  <span className="text-xs">Duration</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Actions based on role and status */}
                            {session.status === 'scheduled' ? (
                              <div className="flex gap-2">
                                <Button 
                                  className="flex-1 bg-primary hover:bg-primary/90" 
                                  onClick={() => handleJoinSession(session.id)}
                                >
                                  Enter Room
                                </Button>
                                <PeerChat 
                                  sessionId={session.id}
                                  currentUserId={currentUserId!}
                                  otherUserName={session.host_user_id === currentUserId 
                                    ? (session.guest_profile?.full_name || "Guest") 
                                    : (session.host_profile?.full_name || "Host")}
                                />
                              </div>
                            ) : (
                              <Button disabled variant="secondary" className="w-full">
                                Waiting for Approval
                              </Button>
                            )}

                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default PeerInterviews;
