import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, 
  MessageSquare, MonitorUp, MoreVertical, 
  Users, Hand, LayoutGrid, Settings, Send,
  Code, Copy, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const PeerSessionRoom = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeSidePanel, setActiveSidePanel] = useState<'chat' | 'info' | 'code' | null>(null);
  const [messages, setMessages] = useState<{sender: string, text: string, time: string}[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Simulate initialization
    setTimeout(() => {
      setLoading(false);
      startCamera();
      toast.success("Connected to secure session");
    }, 1500);

    // Clock
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      toast.error("Could not access camera. Using avatar mode.");
    }
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    toast.info(isAudioEnabled ? "Microphone muted" : "Microphone active");
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    toast.info(isVideoEnabled ? "Camera off" : "Camera active");
  };

  const toggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
    toast.info(isScreenSharing ? "Stopped presenting" : "Started presenting screen");
  };

  const sendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;
    
    setMessages([...messages, {
      sender: "You",
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setNewMessage("");
  };

  const endCall = () => {
    toast.success("Session ended");
    navigate("/peer-interviews");
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 rounded-full border-t-4 border-blue-500 animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-r-4 border-cyan-500 animate-spin [animation-direction:reverse]"></div>
        </div>
        <h2 className="text-2xl font-bold mb-2">Joining Meeting...</h2>
        <p className="text-muted-foreground">Establishing secure connection</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#202124] text-white overflow-hidden flex flex-col">
      {/* Top Bar (Auto-hides or minimal) */}
      <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-start pointer-events-none">
        <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-lg pointer-events-auto">
          <h1 className="font-medium text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            Frontend System Design Interview
            <Badge variant="outline" className="ml-2 border-white/20 text-white text-[10px] h-5">
              {sessionId?.slice(0, 8)}
            </Badge>
          </h1>
        </div>
      </div>

      {/* Main Video Grid */}
      <div className={`flex-1 p-4 flex gap-4 transition-all duration-300 ${activeSidePanel ? 'pr-[360px]' : ''}`}>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 h-full max-h-[calc(100vh-100px)]">
          
          {/* Remote Peer (Mock) */}
          <div className="relative bg-[#3c4043] rounded-2xl overflow-hidden shadow-2xl group">
            <img 
              src="/images/mock-peer-video.jpg" 
              alt="Peer Video" 
              className="w-full h-full object-cover opacity-90"
              onError={(e) => e.currentTarget.src = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1000&auto=format&fit=crop"} 
            />
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm p-1.5 rounded-full">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <div className="absolute bottom-4 left-4">
              <span className="text-sm font-medium text-white drop-shadow-md">Sarah Chen</span>
            </div>
            
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>

          {/* Local User */}
          <div className="relative bg-[#3c4043] rounded-2xl overflow-hidden shadow-2xl">
            {isVideoEnabled ? (
              <video 
                ref={localVideoRef} 
                autoPlay 
                muted 
                playsInline 
                className="w-full h-full object-cover transform scale-x-[-1]" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Avatar className="w-32 h-32">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback className="text-4xl bg-blue-600">ME</AvatarFallback>
                </Avatar>
              </div>
            )}
            <div className="absolute bottom-4 left-4">
              <span className="text-sm font-medium text-white drop-shadow-md">You</span>
            </div>
            {!isAudioEnabled && (
              <div className="absolute top-4 right-4 bg-red-500/90 p-1.5 rounded-full">
                <MicOff className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="h-20 bg-[#202124] border-t border-white/10 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-4 min-w-[200px]">
          <span className="text-sm font-medium text-gray-300">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div className="h-4 w-[1px] bg-white/20" />
          <span className="text-sm text-gray-300 truncate max-w-[150px]">
            {sessionId}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={isAudioEnabled ? "secondary" : "destructive"}
                  size="icon" 
                  className={`rounded-full w-12 h-12 ${isAudioEnabled ? 'bg-[#3c4043] hover:bg-[#4a4e51] text-white border-none' : ''}`}
                  onClick={toggleAudio}
                >
                  {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Turn {isAudioEnabled ? 'off' : 'on'} microphone</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={isVideoEnabled ? "secondary" : "destructive"}
                  size="icon" 
                  className={`rounded-full w-12 h-12 ${isVideoEnabled ? 'bg-[#3c4043] hover:bg-[#4a4e51] text-white border-none' : ''}`}
                  onClick={toggleVideo}
                >
                  {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Turn {isVideoEnabled ? 'off' : 'on'} camera</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="secondary"
                  size="icon" 
                  className={`rounded-full w-12 h-12 bg-[#3c4043] hover:bg-[#4a4e51] text-white border-none ${isScreenSharing ? 'text-blue-400' : ''}`}
                  onClick={toggleScreenShare}
                >
                  <MonitorUp className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Present now</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="secondary"
                  size="icon" 
                  className="rounded-full w-12 h-12 bg-[#3c4043] hover:bg-[#4a4e51] text-white border-none"
                >
                  <Hand className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Raise hand</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="secondary"
                  size="icon" 
                  className="rounded-full w-12 h-12 bg-[#3c4043] hover:bg-[#4a4e51] text-white border-none"
                >
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>More options</TooltipContent>
            </Tooltip>

            <Button 
              variant="destructive" 
              className="rounded-full px-6 h-12 ml-2 bg-red-600 hover:bg-red-700"
              onClick={endCall}
            >
              <PhoneOff className="w-5 h-5 mr-2" />
              End Call
            </Button>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-3 min-w-[200px] justify-end">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className={`text-white hover:bg-[#3c4043] ${activeSidePanel === 'info' ? 'text-blue-400' : ''}`}
                  onClick={() => setActiveSidePanel(activeSidePanel === 'info' ? null : 'info')}
                >
                  <Users className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Participants</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className={`text-white hover:bg-[#3c4043] ${activeSidePanel === 'chat' ? 'text-blue-400' : ''}`}
                  onClick={() => setActiveSidePanel(activeSidePanel === 'chat' ? null : 'chat')}
                >
                  <MessageSquare className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Chat</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className={`text-white hover:bg-[#3c4043] ${activeSidePanel === 'code' ? 'text-blue-400' : ''}`}
                  onClick={() => setActiveSidePanel(activeSidePanel === 'code' ? null : 'code')}
                >
                  <Code className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Code Editor</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Side Panel */}
      <div className={`absolute top-4 bottom-24 right-4 w-[340px] bg-[#202124] rounded-2xl shadow-2xl border border-white/10 transform transition-transform duration-300 flex flex-col overflow-hidden z-30 ${activeSidePanel ? 'translate-x-0' : 'translate-x-[400px]'}`}>
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#202124]">
          <h3 className="font-medium text-lg">
            {activeSidePanel === 'chat' && 'In-call messages'}
            {activeSidePanel === 'info' && 'People'}
            {activeSidePanel === 'code' && 'Collaborative Editor'}
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setActiveSidePanel(null)}>
            Close
          </Button>
        </div>

        {activeSidePanel === 'chat' && (
          <>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                <div className="bg-[#3c4043] p-3 rounded-lg rounded-tl-none">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-semibold text-sm">Sarah Chen</span>
                    <span className="text-xs text-gray-400">10:02 AM</span>
                  </div>
                  <p className="text-sm text-gray-200">Hi! Can you hear me okay?</p>
                </div>
                {messages.map((msg, i) => (
                  <div key={i} className={`p-3 rounded-lg ${msg.sender === 'You' ? 'bg-blue-600 rounded-tr-none ml-auto max-w-[85%]' : 'bg-[#3c4043] rounded-tl-none mr-auto max-w-[85%]'}`}>
                    <div className="flex justify-between items-baseline mb-1 gap-2">
                      <span className="font-semibold text-sm">{msg.sender}</span>
                      <span className="text-xs text-gray-300/80">{msg.time}</span>
                    </div>
                    <p className="text-sm text-white">{msg.text}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-white/10 bg-[#202124]">
              <form onSubmit={sendMessage} className="relative">
                <Input 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Send a message..." 
                  className="bg-[#3c4043] border-none text-white pr-10 rounded-full"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  variant="ghost" 
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-300 hover:bg-transparent"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        )}

        {activeSidePanel === 'info' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Contributors (2)</span>
              <Button variant="ghost" size="icon" className="h-8 w-8"><UserPlus className="w-4 h-4" /></Button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback className="bg-blue-600 text-xs">ME</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">You (Host)</p>
                </div>
                <Mic className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/images/mock-peer-video.jpg" />
                  <AvatarFallback>SC</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">Sarah Chen</p>
                </div>
                <Mic className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        )}

        {activeSidePanel === 'code' && (
          <div className="flex-1 flex flex-col">
            <div className="p-2 bg-[#3c4043] flex items-center justify-between">
              <Badge variant="outline" className="text-xs border-white/20">JavaScript</Badge>
              <Button variant="ghost" size="sm" className="h-6 text-xs"><Copy className="w-3 h-3 mr-1" /> Copy</Button>
            </div>
            <div className="flex-1 bg-[#1e1e1e] p-4 font-mono text-sm text-gray-300 overflow-auto">
              <pre>{`function twoSum(nums, target) {
  const map = new Map();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    
    map.set(nums[i], i);
  }
  
  return [];
}`}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PeerSessionRoom;
