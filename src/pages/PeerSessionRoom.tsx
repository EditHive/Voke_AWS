import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2, Users, Clock } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";

const PeerSessionRoom = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [connectionState, setConnectionState] = useState<string>("connecting");
  const [userId, setUserId] = useState<string>("");
  const [isHost, setIsHost] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    checkAuth();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (session && userId) {
      initializeWebRTC();
      subscribeToSignaling();
      
      // Start timer
      const timer = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [session, userId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUserId(user.id);
    await loadSession(user.id);
  };

  const loadSession = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from("peer_interview_sessions")
        .select(`
          *,
          host_profile:host_user_id (full_name),
          guest_profile:guest_user_id (full_name)
        `)
        .eq("id", sessionId)
        .single();

      if (error) throw error;

      if (data.host_user_id !== uid && data.guest_user_id !== uid) {
        toast.error("You are not a participant of this session");
        navigate("/peer-interviews");
        return;
      }

      setSession(data);
      setIsHost(data.host_user_id === uid);
      
      // Update session status to in_progress
      await supabase
        .from("peer_interview_sessions")
        .update({ status: "in_progress" })
        .eq("id", sessionId);
    } catch (error) {
      console.error("Error loading session:", error);
      toast.error("Failed to load session");
      navigate("/peer-interviews");
    } finally {
      setLoading(false);
    }
  };

  const initializeWebRTC = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      // Add local stream tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        setRemoteStream(remoteStream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal("ice-candidate", event.candidate);
        }
      };

      // Handle connection state
      pc.onconnectionstatechange = () => {
        setConnectionState(pc.connectionState);
        if (pc.connectionState === "connected") {
          toast.success("Connected to peer");
        } else if (pc.connectionState === "failed") {
          toast.error("Connection failed");
        }
      };

      setPeerConnection(pc);

      // If host, create and send offer
      if (isHost) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal("offer", offer);
      }
    } catch (error) {
      console.error("Error initializing WebRTC:", error);
      toast.error("Failed to access camera/microphone");
    }
  };

  const subscribeToSignaling = () => {
    const channel = supabase.channel(`session:${sessionId}`);

    channel
      .on("broadcast", { event: "signal" }, async ({ payload }) => {
        if (payload.from === userId) return;

        try {
          if (payload.type === "offer" && !isHost && peerConnection) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.data));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            sendSignal("answer", answer);
          } else if (payload.type === "answer" && isHost && peerConnection) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.data));
          } else if (payload.type === "ice-candidate" && peerConnection) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(payload.data));
          }
        } catch (error) {
          console.error("Error handling signal:", error);
        }
      })
      .subscribe();

    channelRef.current = channel;
  };

  const sendSignal = (type: string, data: any) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "signal",
        payload: { type, data, from: userId },
      });
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const endCall = async () => {
    try {
      // Update session status
      await supabase
        .from("peer_interview_sessions")
        .update({ status: "completed" })
        .eq("id", sessionId);

      cleanup();
      navigate(`/peer-interviews/rate/${sessionId}`);
    } catch (error) {
      console.error("Error ending call:", error);
      cleanup();
      navigate("/peer-interviews");
    }
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (peerConnection) {
      peerConnection.close();
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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
            <div>
              <h1 className="text-xl font-bold text-foreground">{session?.topic}</h1>
              <p className="text-sm text-muted-foreground">
                {isHost ? "Hosting" : "Participating"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="gap-2">
              <Clock className="h-3 w-3" />
              {formatTime(timeElapsed)}
            </Badge>
            <Badge
              variant={
                connectionState === "connected"
                  ? "default"
                  : connectionState === "connecting"
                  ? "secondary"
                  : "destructive"
              }
            >
              {connectionState}
            </Badge>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Remote Video */}
          <Card className="relative aspect-video bg-muted overflow-hidden">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {!remoteStream && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Waiting for peer to join...</p>
                </div>
              </div>
            )}
            <div className="absolute bottom-4 left-4 bg-background/80 px-3 py-1 rounded-md">
              <p className="text-sm font-medium">
                {isHost
                  ? session?.guest_profile?.full_name || "Guest"
                  : session?.host_profile?.full_name || "Host"}
              </p>
            </div>
          </Card>

          {/* Local Video */}
          <Card className="relative aspect-video bg-muted overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
            />
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <VideoOff className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            <div className="absolute bottom-4 left-4 bg-background/80 px-3 py-1 rounded-md">
              <p className="text-sm font-medium">You</p>
            </div>
          </Card>
        </div>

        {/* Controls */}
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-center gap-4">
              <Button
                variant={isAudioEnabled ? "default" : "destructive"}
                size="lg"
                onClick={toggleAudio}
                className="w-16 h-16 rounded-full"
              >
                {isAudioEnabled ? (
                  <Mic className="h-6 w-6" />
                ) : (
                  <MicOff className="h-6 w-6" />
                )}
              </Button>

              <Button
                variant={isVideoEnabled ? "default" : "destructive"}
                size="lg"
                onClick={toggleVideo}
                className="w-16 h-16 rounded-full"
              >
                {isVideoEnabled ? (
                  <Video className="h-6 w-6" />
                ) : (
                  <VideoOff className="h-6 w-6" />
                )}
              </Button>

              <Button
                variant="destructive"
                size="lg"
                onClick={endCall}
                className="w-16 h-16 rounded-full"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Session Info */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Session Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Duration</p>
              <p className="font-medium">{session?.duration_minutes} minutes</p>
            </div>
            <div>
              <p className="text-muted-foreground">Difficulty</p>
              <Badge variant="outline">{session?.difficulty_level}</Badge>
            </div>
            {session?.meeting_notes && (
              <div className="col-span-2">
                <p className="text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{session.meeting_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
};

export default PeerSessionRoom;
