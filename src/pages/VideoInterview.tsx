import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, Video, StopCircle, Camera, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { QuickFeedback } from "@/components/QuickFeedback";
import Groq from 'groq-sdk';
import {
  TIME_LIMITS,
  calculateQuestionCount,
  getQuestionsForSession,
  formatTimeRemaining,
  InterviewState,
} from "@/utils/interviewHelpers";
import { loadUserProfileContext, ProfileContext } from "@/utils/profileContext";

const getGroqClient = () => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    console.warn("VITE_GROQ_API_KEY is missing.");
    return null;
  }
  return new Groq({ apiKey, dangerouslyAllowBrowser: true });
};

const groq = getGroqClient();

const ROLE_SPECIFIC_QUESTIONS = {
  "General": [
    "Tell me about yourself.",
    "Why do you want to work for our company?",
    "What are your greatest strengths and weaknesses?",
    "Where do you see yourself in five years?",
    "Tell me about a time you worked in a team.",
    "How do you handle stress and pressure?",
    "Describe a time you failed and what you learned.",
    "What motivates you in your work?",
  ],
  "Software Engineer": [
    "Tell me about yourself and your technical background.",
    "Describe a challenging technical problem you solved recently.",
    "How do you approach debugging a complex issue?",
    "Explain a technical concept to a non-technical person.",
    "Tell me about your experience with system design.",
    "How do you stay updated with new technologies?",
    "Describe a time when you had to optimize code for performance.",
    "What's your approach to code reviews?",
  ],
  "Product Manager": [
    "Tell me about yourself and your product management experience.",
    "How do you prioritize features in a product roadmap?",
    "Describe a time you had to make a difficult product decision.",
    "How do you gather and incorporate user feedback?",
    "Tell me about a product you launched from start to finish.",
    "How do you work with engineering and design teams?",
    "Describe your approach to defining product metrics.",
    "How do you handle conflicting stakeholder requirements?",
  ],
  "Data Scientist": [
    "Tell me about yourself and your data science background.",
    "Describe a machine learning project you're proud of.",
    "How do you approach feature engineering?",
    "Explain how you would validate a model's performance.",
    "Tell me about a time you derived insights from complex data.",
    "How do you communicate technical findings to non-technical stakeholders?",
    "Describe your experience with A/B testing.",
    "What's your approach to handling imbalanced datasets?",
  ],
  "Marketing Manager": [
    "Tell me about yourself and your marketing experience.",
    "Describe a successful marketing campaign you led.",
    "How do you measure marketing ROI?",
    "Tell me about a time you had to pivot a marketing strategy.",
    "How do you approach customer segmentation?",
    "Describe your experience with digital marketing channels.",
    "How do you stay current with marketing trends?",
    "Tell me about a time you worked with a limited budget.",
  ],
};

const TimedVideoInterview = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Interview setup state
  const [selectedRole, setSelectedRole] = useState<string>("General");
  const [timeLimit, setTimeLimit] = useState<number>(10);
  const [interviewState, setInterviewState] = useState<InterviewState>(InterviewState.SETUP);

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Recording state
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<any>(null);
  const [currentAnswerId, setCurrentAnswerId] = useState<string | null>(null);

  // Context state
  const [codingStats, setCodingStats] = useState<any>(null);
  const [profileContext, setProfileContext] = useState<ProfileContext | null>(null);

  useEffect(() => {
    checkAuth();
    loadCodingStats();
    loadContext();
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const loadCodingStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("coding_stats")
        .eq("id", user.id)
        .single();

      if (profile && (profile as any).coding_stats) {
        setCodingStats((profile as any).coding_stats);
      }
    } catch (error) {
      console.error("Error loading coding stats:", error);
    }
  };

  const loadContext = async () => {
    try {
      const context = await loadUserProfileContext();
      setProfileContext(context);
    } catch (error) {
      console.error("Error loading profile context:", error);
    }
  };

  useEffect(() => {
    if (stream && videoRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const startInterview = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const questionCount = calculateQuestionCount(timeLimit);
      const sessionQuestions = getQuestionsForSession(selectedRole, questionCount, ROLE_SPECIFIC_QUESTIONS);
      setQuestions(sessionQuestions);

      // Create interview session
      const { data: session, error } = await supabase
        .from("interview_sessions")
        .insert({
          user_id: user.id,
          role: selectedRole,
          time_limit_minutes: timeLimit,
          status: "in_progress",
          interview_type: "timed_video",
        })
        .select()
        .single();

      if (error) throw error;

      setSessionId(session.id);
      setTimeRemaining(timeLimit * 60);
      setCurrentQuestionIndex(0);
      setInterviewState(InterviewState.QUESTION);

      // Start overall timer
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            endInterview();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Enable camera
      await startCamera();
    } catch (error) {
      console.error("Error starting interview:", error);
      toast.error("Failed to start interview");
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });
      setStream(mediaStream);
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
      handleUpload(blob);
    };

    mediaRecorder.start(1000);
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
    setRecordingTime(0);

    const recordingInterval = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);

    mediaRecorderRef.current.addEventListener('stop', () => {
      clearInterval(recordingInterval);
    });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // State will be updated in handleUpload called by onstop
    }
  };

  const handleUpload = async (blob: Blob) => {
    if (!sessionId) return;

    setInterviewState(InterviewState.ANALYZING);
    setIsAnalyzing(true);

    // Safety timeout: if upload takes too long, move on anyway
    const safetyTimeout = setTimeout(() => {
      if (isAnalyzing) {
        console.warn("Upload timed out, forcing next question");
        toast.error("Upload taking too long, moving to next question");
        handleNextQuestion();
        setIsAnalyzing(false);
      }
    }, 15000); // 15 seconds timeout

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Transcribe audio
      let transcribedText = "";
      try {
        if (groq) {
          const audioFile = new File([blob], 'answer.webm', { type: 'audio/webm' });
          const transcription = await groq.audio.transcriptions.create({
            file: audioFile,
            model: 'whisper-large-v3',
            language: 'en',
            response_format: 'json',
          });
          transcribedText = transcription.text;
        }
      } catch (error) {
        console.error("Transcription error:", error);
      }

      // Upload video
      // Storage policy requires path to start with user_id
      const fileName = `${user.id}/${sessionId}/${currentQuestionIndex}_${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from("video-interviews")
        .upload(fileName, blob, {
          contentType: 'video/webm',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("video-interviews")
        .getPublicUrl(fileName);

      // Create answer record
      const { data: answer, error: answerError } = await supabase
        .from("interview_answers")
        .insert({
          session_id: sessionId,
          question_number: currentQuestionIndex + 1,
          question: questions[currentQuestionIndex],
          video_url: publicUrl,
          transcript: transcribedText,
          duration_seconds: recordingTime,
        })
        .select()
        .single();

      if (answerError) throw answerError;

      setCurrentAnswerId(answer.id);

      // Move to next question immediately - don't wait for analysis
      clearTimeout(safetyTimeout);
      toast.success("Answer saved! Moving to next question...");
      handleNextQuestion();
      setIsAnalyzing(false);

      // Run analysis in background
      supabase.functions.invoke(
        "quick-analyze-answer",
        {
          body: {
            answerId: answer.id,
            question: questions[currentQuestionIndex],
            transcript: transcribedText,
            role: selectedRole,
            coding_stats: codingStats,
            profile_context: profileContext?.context
          }
        }
      ).then(({ error }) => {
        if (error) console.error("Background analysis error:", error);
      }).catch(err => {
        console.error("Background analysis failed:", err);
      });

    } catch (error: any) {
      console.error("Error uploading:", error);
      clearTimeout(safetyTimeout);
      toast.error(`Failed to save answer: ${error.message || error.error_description || "Unknown error"}`);
      setInterviewState(InterviewState.QUESTION);
      setIsAnalyzing(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentFeedback(null);
      setInterviewState(InterviewState.QUESTION);
    } else {
      endInterview();
    }
  };

  const endInterview = async () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    setInterviewState(InterviewState.COMPLETED);

    // Generate overall feedback
    if (sessionId) {
      try {
        await supabase.functions.invoke("generate-overall-feedback", {
          body: { sessionId }
        });

        // Navigate to results
        navigate(`/video-interview/results/${sessionId}`);
      } catch (error) {
        console.error("Error generating overall feedback:", error);
        toast.error("Failed to generate overall feedback");
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render setup screen
  if (interviewState === InterviewState.SETUP) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-background/80 backdrop-blur-md border-b border-border/40 sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
              <img src="/images/voke_logo.png" alt="Voke Logo" className="w-8 h-8 object-contain" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                Video Interview
              </h1>
            </div>
            <nav className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </nav>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Setup Your Interview</h2>
            <p className="text-muted-foreground text-lg">
              Configure your interview session and get ready to practice
            </p>
          </div>

          <div className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-xl border-border/50">
              <CardContent className="p-6 space-y-6">
                <div>
                  <label className="text-sm font-semibold text-violet-500 uppercase tracking-wider mb-2 block">
                    Interview Role
                  </label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Software Engineer">Software Engineer</SelectItem>
                      <SelectItem value="Product Manager">Product Manager</SelectItem>
                      <SelectItem value="Data Scientist">Data Scientist</SelectItem>
                      <SelectItem value="Marketing Manager">Marketing Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-violet-500 uppercase tracking-wider mb-2 block">
                    Time Limit
                  </label>
                  <Select value={timeLimit.toString()} onValueChange={(v) => setTimeLimit(parseInt(v))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select time limit" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_LIMITS.map(limit => (
                        <SelectItem key={limit.value} value={limit.value.toString()}>
                          {limit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={startInterview}
                    size="lg"
                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg"
                  >
                    <Video className="w-5 h-5 mr-2" />
                    Start Interview
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">What to Expect:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• First question will always be "Tell me about yourself"</li>
                  <li>• You'll get quick feedback after each answer</li>
                  <li>• Interview ends when time runs out or all questions are answered</li>
                  <li>• Overall summary will be provided at the end</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Render interview screen
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background/80 backdrop-blur-md border-b border-border/40 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
              Video Interview
            </h1>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-violet-500" />
              <span className="font-mono font-semibold">{formatTimeRemaining(timeRemaining)}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1}
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={endInterview}
              className="bg-red-500 hover:bg-red-600"
            >
              <StopCircle className="w-4 h-4 mr-2" />
              End Interview
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Video */}
          <div className="space-y-6">
            <Card className="bg-card/30 backdrop-blur-xl border-border/50 overflow-hidden">
              <div className="aspect-video bg-black relative group">
                {!isPreviewing ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white p-8">
                    <Camera className="w-16 h-16 mb-4 text-violet-500" />
                    <h3 className="text-xl font-semibold mb-2">Camera Initializing...</h3>
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
                    {isRecording && (
                      <div className="absolute top-6 right-6 flex items-center gap-3 bg-red-500/90 backdrop-blur-md text-white px-4 py-2 rounded-full font-mono font-medium">
                        <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                        {formatTime(recordingTime)}
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>

            {interviewState === InterviewState.QUESTION && !isRecording && (
              <Button
                onClick={startRecording}
                size="lg"
                className="w-full bg-red-500 hover:bg-red-600 text-white"
              >
                <div className="w-4 h-4 rounded-full bg-white mr-2"></div>
                Start Recording Answer
              </Button>
            )}

            {isRecording && (
              <Button
                onClick={stopRecording}
                size="lg"
                variant="destructive"
                className="w-full"
              >
                <StopCircle className="w-5 h-5 mr-2" />
                Stop Recording
              </Button>
            )}
          </div>

          {/* Right: Content */}
          <div className="space-y-6">
            {interviewState === InterviewState.QUESTION && (
              <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20">
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold text-violet-500 uppercase tracking-wider mb-2">
                    Question {currentQuestionIndex + 1}
                  </h3>
                  <p className="text-xl font-medium leading-relaxed">
                    "{questions[currentQuestionIndex]}"
                  </p>
                </CardContent>
              </Card>
            )}

            {interviewState === InterviewState.ANALYZING && (
              <Card className="bg-card/50 backdrop-blur-xl border-border/50">
                <CardContent className="p-12 text-center">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-violet-500" />
                  <h3 className="text-lg font-semibold mb-2">Saving Answer...</h3>
                  <p className="text-sm text-muted-foreground">
                    Uploading your response and moving to next question
                  </p>
                </CardContent>
              </Card>
            )}

            {interviewState === InterviewState.FEEDBACK && currentFeedback && (
              <QuickFeedback
                modelAnswer={currentFeedback.model_answer}
                whatsGood={currentFeedback.whats_good}
                whatsWrong={currentFeedback.whats_wrong}
                deliveryScore={currentFeedback.delivery_score}
                bodyLanguageScore={currentFeedback.body_language_score}
                confidenceScore={currentFeedback.confidence_score}
                onNext={handleNextQuestion}
                isLastQuestion={currentQuestionIndex === questions.length - 1}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TimedVideoInterview;
