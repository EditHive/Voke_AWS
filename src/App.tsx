import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import LearningPaths from "./pages/LearningPaths";
import InterviewNew from "./pages/InterviewNew";
import InterviewResults from "./pages/InterviewResults";
import InterviewSession from "./pages/InterviewSession";
import VideoInterview from "./pages/VideoInterview";
import VoiceAssistant from "./pages/VoiceAssistant";
import VideoInterviewResults from "./pages/VideoInterviewResults";
import VideoPracticeHistory from "./pages/VideoPracticeHistory";
import ProgressAnalytics from "./pages/ProgressAnalytics";
import JobMarketInsights from "./pages/JobMarketInsights";
import AdaptiveInterview from "./pages/AdaptiveInterview";
import PeerInterviews from "./pages/PeerInterviews";
import CreatePeerSession from "./pages/CreatePeerSession";
import PeerSessionRoom from "./pages/PeerSessionRoom";
import RatePeerSession from "./pages/RatePeerSession";
import Leaderboard from "./pages/Leaderboard";
import Blog from "./pages/Blog";
import Community from "./pages/Community";
import Help from "./pages/Help";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import { Footer } from "./components/Footer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/learning-paths" element={<LearningPaths />} />
          <Route path="/interview/new" element={<InterviewNew />} />
          <Route path="/interview/results/:id" element={<InterviewResults />} />
          <Route path="/interview/:id" element={<InterviewSession />} />
          <Route path="/video-interview" element={<VideoInterview />} />
          <Route path="/video-interview/:id/results" element={<VideoInterviewResults />} />
          <Route path="/voice-assistant" element={<VoiceAssistant />} />
          <Route path="/video-practice" element={<VideoPracticeHistory />} />
          <Route path="/progress-analytics" element={<ProgressAnalytics />} />
          <Route path="/job-market" element={<JobMarketInsights />} />
          <Route path="/adaptive-interview" element={<AdaptiveInterview />} />
          <Route path="/peer-interviews" element={<PeerInterviews />} />
          <Route path="/peer-interviews/create" element={<CreatePeerSession />} />
          <Route path="/peer-interviews/session/:sessionId" element={<PeerSessionRoom />} />
          <Route path="/peer-interviews/rate/:sessionId" element={<RatePeerSession />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/community" element={<Community />} />
          <Route path="/help" element={<Help />} />
          <Route path="/privacy" element={<Privacy />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
