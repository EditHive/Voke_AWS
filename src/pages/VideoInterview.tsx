import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, LogOut, Video, StopCircle, Play, Upload, ArrowRight, Settings } from "lucide-react";
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
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">Voke</h1>
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Video Interview Practice</h2>
          <p className="text-muted-foreground">Record your answer and get AI feedback on your delivery and body language</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Preview/Recording */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Recording</CardTitle>
                <CardDescription>
                  {!isPreviewing && !recordedBlob && "Click 'Start Camera' to begin"}
                  {isPreviewing && !isRecording && "Ready to record"}
                  {isRecording && `Recording: ${formatTime(recordingTime)}`}
                  {recordedBlob && "Preview your recording"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isRecording || isPreviewing}
                    controls={!!recordedBlob && !isRecording}
                    className="w-full h-full object-cover"
                  />
                  {isRecording && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      REC {formatTime(recordingTime)}
                    </div>
                  )}
                </div>

                <div className="flex gap-4 justify-center">
                  {!isPreviewing && !recordedBlob && (
                    <Button onClick={startCamera} size="lg">
                      <Video className="w-5 h-5 mr-2" />
                      Start Camera
                    </Button>
                  )}

                  {isPreviewing && !isRecording && !recordedBlob && (
                    <Button onClick={startRecording} size="lg" className="bg-red-500 hover:bg-red-600">
                      <Play className="w-5 h-5 mr-2" />
                      Start Recording
                    </Button>
                  )}

                  {isRecording && (
                    <Button onClick={stopRecording} size="lg" variant="destructive">
                      <StopCircle className="w-5 h-5 mr-2" />
                      Stop Recording
                    </Button>
                  )}

                  {recordedBlob && !isUploading && !isAnalyzing && (
                    <>
                      <Button onClick={retake} size="lg" variant="outline">
                        Retake
                      </Button>
                      <Button onClick={uploadAndAnalyze} size="lg">
                        <Upload className="w-5 h-5 mr-2" />
                        Submit for Analysis
                      </Button>
                    </>
                  )}

                  {(isUploading || isAnalyzing) && (
                    <div className="flex flex-col items-center gap-4 w-full">
                      <Progress value={isUploading ? 50 : 75} className="w-full" />
                      <p className="text-sm text-muted-foreground">
                        {isUploading ? "Uploading video..." : "Analyzing your performance..."}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question and Tips */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Interview Question</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium mb-4">{currentQuestion}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newQuestion = COMMON_QUESTIONS[Math.floor(Math.random() * COMMON_QUESTIONS.length)];
                    setCurrentQuestion(newQuestion);
                  }}
                >
                  Get New Question
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tips for Success</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold mb-1">🎥 Camera Setup</h4>
                  <p className="text-muted-foreground">Position yourself at eye level with good lighting</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">👁️ Eye Contact</h4>
                  <p className="text-muted-foreground">Look at the camera, not the screen</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">😊 Body Language</h4>
                  <p className="text-muted-foreground">Sit up straight, smile, and use natural gestures</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">🗣️ Speaking</h4>
                  <p className="text-muted-foreground">Speak clearly and at a moderate pace</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">⏱️ Time</h4>
                  <p className="text-muted-foreground">Aim for 1-2 minutes per answer</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VideoInterview;
