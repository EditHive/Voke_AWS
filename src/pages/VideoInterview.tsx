import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, LogOut, Video, StopCircle, Play, Upload, Settings, Camera, RefreshCw, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/ThemeToggle";

const COMMON_QUESTIONS = [
  "Tell me about yourself and your background.",
  "Why do you want to work for our company?",
  "Describe a challenging project you worked on.",
  "What are your greatest strengths and weaknesses?",
  "Where do you see yourself in five years?",
  "Tell me about a time you worked in a team.",
  "How do you handle stress and pressure?",
  "Describe a time you failed and what you learned.",
];

const VideoInterview = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    checkAuth();
    // Select random question
    const randomQuestion = COMMON_QUESTIONS[Math.floor(Math.random() * COMMON_QUESTIONS.length)];
    setCurrentQuestion(randomQuestion);

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        },
        audio: true
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsPreviewing(true);
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Failed to access camera and microphone");
    }
  };

  const startRecording = () => {
    if (!stream) return;

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp8,opus'
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);

      // Show preview
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = URL.createObjectURL(blob);
      }
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
    setRecordingTime(0);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Stop camera stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  };

  const uploadAndAnalyze = async () => {
    if (!recordedBlob) return;

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create session record
      const { data: session, error: sessionError } = await supabase
        .from("video_interview_sessions")
        .insert({
          user_id: user.id,
          question: currentQuestion,
          duration_seconds: recordingTime,
          status: "uploading"
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Upload video
      const fileName = `${user.id}/${session.id}.webm`;
      const { error: uploadError } = await supabase.storage
        .from("video-interviews")
        .upload(fileName, recordedBlob, {
          contentType: 'video/webm',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("video-interviews")
        .getPublicUrl(fileName);

      // Update session with video URL
      await supabase
        .from("video_interview_sessions")
        .update({ video_url: publicUrl, status: "analyzing" })
        .eq("id", session.id);

      setIsUploading(false);
      setIsAnalyzing(true);

      // Call analysis function
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        "analyze-video-interview",
        {
          body: { sessionId: session.id, videoUrl: publicUrl, question: currentQuestion }
        }
      );

      if (analysisError) throw analysisError;

      setIsAnalyzing(false);
      toast.success("Analysis complete!");
      navigate(`/video-interview/${session.id}/results`);
    } catch (error) {
      console.error("Error uploading video:", error);
      toast.error("Failed to upload and analyze video");
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  const retake = () => {
    setRecordedBlob(null);
    setRecordingTime(0);
    startCamera();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-md border-b border-border/40 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Video className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
              AI Video Interview
            </h1>
          </div>
          <nav className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              Exit
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content - Split Screen */}
      <main className="flex-1 container mx-auto px-4 py-6 overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-6 h-full">
          
          {/* Left Side: AI Avatar & Question */}
          <div className="flex flex-col gap-6 h-full overflow-y-auto pr-2 [&::-webkit-scrollbar]:hidden">
            {/* AI Avatar Container */}
            <div className="relative aspect-square max-h-[400px] mx-auto w-full max-w-[400px]">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="relative h-full w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-violet-500/20 bg-black/40 backdrop-blur-sm">
                <img 
                  src="/ai-avatar-video.png" 
                  alt="AI Interviewer" 
                  className="w-full h-full object-cover"
                />
                {/* AI Status Overlay */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-4 bg-violet-500 rounded-full animate-[bounce_1s_infinite]"></span>
                      <span className="w-1.5 h-6 bg-purple-500 rounded-full animate-[bounce_1.2s_infinite]"></span>
                      <span className="w-1.5 h-4 bg-fuchsia-500 rounded-full animate-[bounce_0.8s_infinite]"></span>
                    </div>
                    <span className="text-xs font-medium text-white/90">AI Interviewer Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Question Card */}
            <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-lg">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-violet-500 uppercase tracking-wider">Current Question</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      const newQuestion = COMMON_QUESTIONS[Math.floor(Math.random() * COMMON_QUESTIONS.length)];
                      setCurrentQuestion(newQuestion);
                    }}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Change Question
                  </Button>
                </div>
                <p className="text-xl md:text-2xl font-medium leading-relaxed">
                  "{currentQuestion}"
                </p>
              </div>
            </Card>

            {/* Tips Card */}
            <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-lg shrink-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  Tips for Success
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex gap-3 items-start">
                  <span className="text-lg">🎥</span>
                  <div>
                    <h4 className="font-semibold mb-0.5">Camera Setup</h4>
                    <p className="text-muted-foreground text-xs">Position yourself at eye level with good lighting.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-lg">👁️</span>
                  <div>
                    <h4 className="font-semibold mb-0.5">Eye Contact</h4>
                    <p className="text-muted-foreground text-xs">Look at the camera, not the screen.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-lg">😊</span>
                  <div>
                    <h4 className="font-semibold mb-0.5">Body Language</h4>
                    <p className="text-muted-foreground text-xs">Sit up straight, smile, and use natural gestures.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side: User Camera & Controls */}
          <div className="flex flex-col gap-6 h-full justify-center">
            <div className="relative aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-border/50 group">
              {!isPreviewing && !recordedBlob ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/10 backdrop-blur-sm p-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                    <Camera className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Ready to Start?</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Enable your camera to begin the interview practice. Make sure you're in a well-lit environment.
                  </p>
                  <Button onClick={startCamera} size="lg" className="rounded-full px-8 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25 transition-all hover:scale-105">
                    <Video className="w-5 h-5 mr-2" />
                    Enable Camera
                  </Button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isRecording || isPreviewing}
                    controls={!!recordedBlob && !isRecording}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Recording Overlay */}
                  {isRecording && (
                    <div className="absolute top-6 right-6 flex items-center gap-3 bg-red-500/90 backdrop-blur-md text-white px-4 py-2 rounded-full font-mono font-medium animate-in fade-in slide-in-from-top-4">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                      {formatTime(recordingTime)}
                    </div>
                  )}

                  {/* Controls Overlay (Bottom) */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center gap-4">
                    {isPreviewing && !isRecording && !recordedBlob && (
                      <Button onClick={startRecording} size="lg" className="rounded-full bg-red-500 hover:bg-red-600 text-white border-0 shadow-lg hover:scale-105 transition-all">
                        <div className="w-4 h-4 rounded-full bg-white mr-2"></div>
                        Start Recording
                      </Button>
                    )}

                    {isRecording && (
                      <Button onClick={stopRecording} size="lg" variant="destructive" className="rounded-full shadow-lg hover:scale-105 transition-all">
                        <StopCircle className="w-5 h-5 mr-2" />
                        Stop Recording
                      </Button>
                    )}

                    {recordedBlob && !isUploading && !isAnalyzing && (
                      <div className="flex gap-3">
                        <Button onClick={retake} variant="secondary" className="rounded-full backdrop-blur-md bg-white/10 hover:bg-white/20 text-white border-white/20">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Retake
                        </Button>
                        <Button onClick={uploadAndAnalyze} className="rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white border-0 shadow-lg hover:scale-105 transition-all">
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Submit Answer
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Processing Overlay */}
              {(isUploading || isAnalyzing) && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 z-20">
                  <div className="w-full max-w-md space-y-6 text-center">
                    <div className="relative w-24 h-24 mx-auto">
                      <div className="absolute inset-0 rounded-full border-t-4 border-violet-500 animate-spin"></div>
                      <div className="absolute inset-2 rounded-full border-r-4 border-purple-500 animate-spin [animation-direction:reverse]"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Upload className="w-8 h-8 text-white/50" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {isUploading ? "Uploading Interview..." : "AI Analysis in Progress..."}
                      </h3>
                      <p className="text-white/60 text-sm mb-6">
                        {isUploading 
                          ? "Securely transferring your video to our servers." 
                          : "Our AI is analyzing your body language, tone, and content."}
                      </p>
                      <Progress value={isUploading ? 45 : 85} className="h-2 bg-white/10" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Tips/Status Text */}
            <div className="text-center">
              {!isRecording && !recordedBlob && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-violet-500">Tip:</span> Maintain eye contact with the camera and speak clearly.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VideoInterview;
