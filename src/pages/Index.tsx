import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, Target, TrendingUp, Zap, CheckCircle, ArrowRight, Code, Briefcase, Database, Sparkles, Users, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
// import Nav from "@/components/nav";
const Index = () => {
  const navigate = useNavigate();
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
        {/* <Nav /> */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(139,92,246,0.1),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(217,70,239,0.1),transparent_50%)]"></div>
        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Interview Preparation
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent leading-tight">
              Elevate Your Interview Skills with AI
            </h1>
            <p className="text-xl md:text-xl mb-10 text-gray-600 leading-relaxed">
              The complete AI toolkit to ace interviews and land your dream role. Practice with AI-powered interviews, get instant feedback, and track your progress.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button 
                size="lg" 
                onClick={() => handleNavigate("/auth")} 
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/30 px-8 py-6 text-lg rounded-xl"
              >
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-violet-200 text-violet-700 hover:bg-violet-50 px-8 py-6 text-lg rounded-xl" 
                onClick={() => handleNavigate("/learning-paths")}
              >
                Explore Learning Paths
              </Button>
            </div>
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-violet-600" />
                <span>10,000+ Users</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-violet-600" />
                <span>Trusted by Top Companies</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Supercharge Your Interview Preparation
            </h2>
            <p className="text-xl text-gray-600">Everything you need to succeed in your next interview</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <Card className="p-8 hover:shadow-xl transition-all border-0 bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl cursor-pointer" onClick={() => handleNavigate("/auth")}>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-violet-500/30">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">AI-Powered Feedback</h3>
              <p className="text-gray-600 leading-relaxed">
                Get detailed, constructive feedback on every answer with model responses to learn from
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all border-0 bg-gradient-to-br from-fuchsia-50 to-pink-50 rounded-2xl cursor-pointer" onClick={() => handleNavigate("/video-interview")}>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center mb-6 shadow-lg shadow-fuchsia-500/30">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Video Practice</h3>
              <p className="text-gray-600 leading-relaxed">
                Record your responses and get AI feedback on delivery, body language, and confidence
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all border-0 bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl cursor-pointer" onClick={() => handleNavigate("/auth")}>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30">
                <Target className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Role-Specific Practice</h3>
              <p className="text-gray-600 leading-relaxed">
                Practice interviews tailored to your target role and industry
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all border-0 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl cursor-pointer" onClick={() => handleNavigate("/auth")}>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Resume Analysis</h3>
              <p className="text-gray-600 leading-relaxed">
                Upload your resume for personalized interview questions based on your experience
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all border-0 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl cursor-pointer" onClick={() => handleNavigate("/job-market")}>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Job Market Insights</h3>
              <p className="text-gray-600 leading-relaxed">
                AI-researched trends and personalized career guidance for interview preparation
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Job Profiles Section */}
      <section className="py-24 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Get Ready for Jobs at Leading Firms
            </h2>
            <p className="text-xl text-gray-600">
              Explore what you need to learn for your dream role and practice with realistic simulations
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="p-8 hover:shadow-xl transition-all cursor-pointer border-0 bg-white rounded-2xl group" onClick={() => handleNavigate("/learning-paths")}>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform">
                <Code className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Software Developer</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-violet-600 flex-shrink-0" />
                  <span>Data Structures & Algorithms</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-violet-600 flex-shrink-0" />
                  <span>System Design</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-violet-600 flex-shrink-0" />
                  <span>Programming Languages</span>
                </li>
              </ul>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all cursor-pointer border-0 bg-white rounded-2xl group" onClick={() => handleNavigate("/learning-paths")}>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center mb-6 shadow-lg shadow-fuchsia-500/30 group-hover:scale-110 transition-transform">
                <Database className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Data Scientist</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-fuchsia-600 flex-shrink-0" />
                  <span>Machine Learning</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-fuchsia-600 flex-shrink-0" />
                  <span>Statistics & Probability</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-fuchsia-600 flex-shrink-0" />
                  <span>Python & R</span>
                </li>
              </ul>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all cursor-pointer border-0 bg-white rounded-2xl group" onClick={() => handleNavigate("/learning-paths")}>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Product Manager</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  <span>Product Strategy</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  <span>User Research</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  <span>Roadmap Planning</span>
                </li>
              </ul>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button 
              size="lg" 
              onClick={() => handleNavigate("/learning-paths")}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/30 px-8 py-6 text-lg rounded-xl"
            >
              View All Learning Paths
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white p-16 text-center border-0 rounded-3xl shadow-2xl shadow-violet-500/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent_50%)]"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Start Practicing?</h2>
              <p className="text-xl mb-10 opacity-95 max-w-2xl mx-auto">
                Join thousands preparing for their dream jobs with AI-powered interview practice
              </p>
              <Button 
                size="lg" 
                className="bg-white text-violet-700 hover:bg-gray-100 px-10 py-6 text-lg rounded-xl shadow-xl font-semibold" 
                onClick={() => handleNavigate("/auth")}
              >
                Get Started Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 bg-gray-50">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p className="text-sm">© 2024 Quantum Query. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;