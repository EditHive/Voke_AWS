import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, Clock, Target, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";

const PeerInterviews = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [availableSessions, setAvailableSessions] = useState<any[]>([]);
  const [mySessions, setMySessions] = useState<any[]>([]);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUserId(user.id);
    await loadSessions(user.id);
  };

  const loadSessions = async (userId: string) => {
    try {
      // Load available sessions (not joined yet)
      const { data: available } = await supabase
        .from("peer_interview_sessions")
        .select(`
          *,
          profiles:host_user_id (full_name)
        `)
        .eq("status", "scheduled")
        .is("guest_user_id", null)
        .neq("host_user_id", userId)
        .order("scheduled_at", { ascending: true });

      // Load my sessions (hosting or joined)
      const { data: mine } = await supabase
        .from("peer_interview_sessions")
        .select(`
          *,
          host_profile:host_user_id (full_name),
          guest_profile:guest_user_id (full_name)
        `)
        .or(`host_user_id.eq.${userId},guest_user_id.eq.${userId}`)
        .order("scheduled_at", { ascending: true });

      setAvailableSessions(available || []);
      setMySessions(mine || []);
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const joinSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("peer_interview_sessions")
        .update({ guest_user_id: userId })
        .eq("id", sessionId);

      if (error) throw error;

      toast.success("Successfully joined session!");
      loadSessions(userId);
    } catch (error) {
      console.error("Error joining session:", error);
      toast.error("Failed to join session");
    }
  };

  const cancelSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("peer_interview_sessions")
        .update({ status: "cancelled" })
        .eq("id", sessionId);

      if (error) throw error;

      toast.success("Session cancelled");
      loadSessions(userId);
    } catch (error) {
      console.error("Error cancelling session:", error);
      toast.error("Failed to cancel session");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Peer Interviews</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button onClick={() => navigate("/peer-interviews/create")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Session
            </Button>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="available" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="available">Available Sessions</TabsTrigger>
            <TabsTrigger value="my-sessions">My Sessions</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            {availableSessions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No available sessions at the moment</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate("/peer-interviews/create")}
                  >
                    Create Your Own Session
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableSessions.map((session) => (
                  <Card key={session.id} className="hover:shadow-medium transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{session.topic}</CardTitle>
                          <CardDescription>
                            Host: {session.profiles?.full_name || "Anonymous"}
                          </CardDescription>
                        </div>
                        <Badge variant={
                          session.difficulty_level === "advanced" ? "destructive" :
                          session.difficulty_level === "intermediate" ? "default" : "secondary"
                        }>
                          {session.difficulty_level}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(session.scheduled_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {session.duration_minutes} minutes
                        </div>
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={() => joinSession(session.id)}
                      >
                        Join Session
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-sessions" className="space-y-4">
            {mySessions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">You haven't created or joined any sessions yet</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate("/peer-interviews/create")}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {mySessions.map((session) => {
                  const isHost = session.host_user_id === userId;
                  const partnerName = isHost 
                    ? session.guest_profile?.full_name || "Waiting for partner"
                    : session.host_profile?.full_name || "Host";

                  return (
                    <Card key={session.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{session.topic}</CardTitle>
                            <CardDescription>
                              {isHost ? "Hosting" : "Participating"} • {partnerName}
                            </CardDescription>
                          </div>
                          <Badge variant={
                            session.status === "completed" ? "default" :
                            session.status === "cancelled" ? "destructive" : "secondary"
                          }>
                            {session.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {new Date(session.scheduled_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {session.duration_minutes} minutes
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {session.status === "scheduled" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/peer-interviews/session/${session.id}`)}
                              >
                                {isHost ? "Start Session" : "Join Session"}
                              </Button>
                              {isHost && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => cancelSession(session.id)}
                                >
                                  Cancel
                                </Button>
                              )}
                            </>
                          )}
                          {session.status === "completed" && (
                            <Button
                              size="sm"
                              onClick={() => navigate(`/peer-interviews/rate/${session.id}`)}
                            >
                              Rate Partner
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PeerInterviews;
