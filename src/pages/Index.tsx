import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Sparkles, Users, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      {/* Simple Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200/50 bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <span className="text-xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                Voke
              </span>
            </div>
            <Button
              onClick={() => navigate("/auth")}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 pt-16 min-h-[90vh] flex items-center">
        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Interview Preparation
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent leading-tight">
              Elevate Your Interview Skills with AI
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-gray-600 leading-relaxed max-w-2xl mx-auto">
              The complete AI toolkit to ace interviews and land your dream role. Practice with AI-powered interviews, get instant feedback, and track your progress.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg px-8 py-6 text-lg rounded-xl"
              >
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-violet-200 text-violet-700 hover:bg-violet-50 px-8 py-6 text-lg rounded-xl"
                onClick={() => navigate("/learning-paths")}
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "AI-Powered Feedback",
                desc: "Get detailed, constructive feedback on every answer",
                path: "/auth"
              },
              {
                title: "Video Practice",
                desc: "Record your responses and get AI feedback on delivery",
                path: "/video-interview"
              },
              {
                title: "Role-Specific Practice",
                desc: "Practice interviews tailored to your target role",
                path: "/auth"
              }
            ].map((feature, index) => (
              <Card
                key={index}
                className="p-8 hover:shadow-2xl transition-all duration-300 cursor-pointer"
                onClick={() => navigate(feature.path)}
              >
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white p-16 text-center border-0 rounded-3xl shadow-2xl">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Start Practicing?</h2>
            <p className="text-xl mb-10 opacity-95 max-w-2xl mx-auto">
              Join thousands preparing for their dream jobs with AI-powered interview practice
            </p>
            <Button
              size="lg"
              className="bg-white text-violet-700 hover:bg-gray-100 px-10 py-6 text-lg rounded-xl shadow-xl font-semibold"
              onClick={() => navigate("/auth")}
            >
              Get Started Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;