import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Clock, Target, Plus, Loader2, Video, Search, Star, Zap, ArrowRight, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "motion/react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Mock Data for Demo
const MOCK_AVAILABLE_SESSIONS = [
  {
    id: "mock1",
    topic: "Frontend System Design",
    host_name: "Sarah Chen",
    difficulty: "Advanced",
    scheduled_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    duration: 45,
    avatar: "/avatars/sarah.jpg"
  },
  {
    id: "mock2",
    topic: "React Hooks & Performance",
    host_name: "Alex Rivera",
    difficulty: "Intermediate",
    scheduled_at: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
    duration: 30,
    avatar: "/avatars/alex.jpg"
  },
  {
    id: "mock3",
    topic: "Behavioral Interview Practice",
    host_name: "Emily Zhang",
    difficulty: "Beginner",
    scheduled_at: new Date(Date.now() + 1800000).toISOString(), // 30 mins from now
    duration: 30,
    avatar: "/avatars/emily.jpg"
  }
];

const PeerInterviews = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'browse' | 'upcoming'>('browse');
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const joinSession = (sessionId: string) => {
    toast.success("Joining session environment...");
    navigate(`/peer-interviews/session/${sessionId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Loading peer network...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/dashboard")}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Peer Connect</h1>
              <p className="text-xs text-muted-foreground">Collaborative Interview Practice</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button onClick={() => navigate("/peer-interviews/create")} className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md hover:shadow-lg transition-all">
              <Plus className="h-4 w-4 mr-2" />
              New Session
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            <h2 className="text-4xl font-bold tracking-tight">
              Find your perfect <br />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Interview Partner</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl">
              Practice with peers from around the world. Get real-time feedback, improve your communication, and master technical concepts together.
            </p>
            
            <div className="flex gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by topic, role, or skill..." 
                  className="pl-10 h-12 bg-card/50 backdrop-blur-sm border-border/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button size="lg" variant="outline" className="h-12 px-6 border-blue-500/20 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                <Zap className="w-4 h-4 mr-2" />
                Instant Match
              </Button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <Card className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white border-0 shadow-xl shadow-blue-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-full bg-white/20 backdrop-blur-md">
                    <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-100">Your Rating</p>
                    <h3 className="text-3xl font-bold">4.8/5.0</h3>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-blue-100">
                    <span>Sessions Completed</span>
                    <span className="font-bold">12</span>
                  </div>
                  <div className="flex justify-between text-sm text-blue-100">
                    <span>Feedback Received</span>
                    <span className="font-bold">98% Positive</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs & Content */}
        <div className="space-y-6">
          <div className="flex items-center gap-6 border-b border-border/40 pb-1">
            <button 
              onClick={() => setActiveTab('browse')}
              className={`pb-3 text-sm font-medium transition-all relative ${activeTab === 'browse' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Browse Sessions
              {activeTab === 'browse' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
            <button 
              onClick={() => setActiveTab('upcoming')}
              className={`pb-3 text-sm font-medium transition-all relative ${activeTab === 'upcoming' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              My Upcoming
              {activeTab === 'upcoming' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTab === 'browse' && MOCK_AVAILABLE_SESSIONS.map((session, idx) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="group hover:border-primary/50 transition-all hover:shadow-lg bg-card/50 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <Badge variant={
                        session.difficulty === "Advanced" ? "destructive" :
                        session.difficulty === "Intermediate" ? "default" : "secondary"
                      } className="mb-2">
                        {session.difficulty}
                      </Badge>
                      <div className="p-2 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                        <Video className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                      </div>
                    </div>
                    <CardTitle className="line-clamp-1">{session.topic}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={session.avatar} />
                        <AvatarFallback>{session.host_name[0]}</AvatarFallback>
                      </Avatar>
                      Hosted by {session.host_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-6">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Today
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {session.duration} min
                      </div>
                    </div>
                    <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" onClick={() => joinSession(session.id)}>
                      Join Session
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {activeTab === 'upcoming' && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No upcoming sessions</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  You haven't scheduled any peer interviews yet. Browse available sessions or create your own.
                </p>
                <Button onClick={() => navigate("/peer-interviews/create")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Session
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PeerInterviews;
