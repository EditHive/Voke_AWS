import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, Target, TrendingUp, Zap, CheckCircle, ArrowRight, Code, Briefcase, Database, Sparkles, Users, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { FloatingParticles } from "@/components/FloatingParticles";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Index = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const profilesRef = useRef<HTMLDivElement>(null);

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  useEffect(() => {
    // Hero Animations
    const ctx = gsap.context(() => {
      gsap.from(".hero-content > *", {
        y: 30,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out",
      });

      // Features Animations
      gsap.from(".feature-card", {
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top 80%",
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "back.out(1.7)",
      });

      // Profiles Animations
      gsap.from(".profile-card", {
        scrollTrigger: {
          trigger: profilesRef.current,
          start: "top 80%",
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out",
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      <Navbar />

      {/* Hero Section */}
      <section ref={heroRef} className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-gray-900 dark:via-purple-950/20 dark:to-fuchsia-950/20 pt-16 transition-colors duration-300 min-h-[90vh] flex items-center">
        <FloatingParticles />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(139,92,246,0.1),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(217,70,239,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_50%,rgba(139,92,246,0.2),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(217,70,239,0.2),transparent_50%)]"></div>
        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center hero-content">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 text-sm font-medium mb-6 transition-all duration-300 hover:scale-105 cursor-default">
              <Sparkles className="w-4 h-4" />
              AI-Powered Interview Preparation
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 dark:from-violet-400 dark:via-purple-400 dark:to-fuchsia-400 bg-clip-text text-transparent leading-tight drop-shadow-sm">
              Elevate Your Interview Skills with AI
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-gray-600 dark:text-gray-400 leading-relaxed transition-colors duration-300 max-w-2xl mx-auto">
              The complete AI toolkit to ace interviews and land your dream role. Practice with AI-powered interviews, get instant feedback, and track your progress.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button
                size="lg"
                onClick={() => handleNavigate("/auth")}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/30 px-8 py-6 text-lg rounded-xl hover:scale-105 transition-all duration-300"
              >
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-violet-200 text-violet-700 hover:bg-violet-50 px-8 py-6 text-lg rounded-xl hover:scale-105 transition-all duration-300 dark:border-violet-800 dark:text-violet-300 dark:hover:bg-violet-900/20"
                onClick={() => handleNavigate("/learning-paths")}
              >
                Explore Learning Paths
              </Button>
            </div>
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                <span>10,000+ Users</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                <span>Trusted by Top Companies</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-24 bg-white dark:bg-gray-950 transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-gray-100 transition-colors duration-300">
              Supercharge Your Interview Preparation
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 transition-colors duration-300">Everything you need to succeed in your next interview</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[
              {
                icon: "/images/icon_ai_feedback.png",
                title: "AI-Powered Feedback",
                desc: "Get detailed, constructive feedback on every answer with model responses to learn from",
                color: "violet",
                path: "/auth"
              },
              {
                icon: "/images/icon_video_practice.png",
                title: "Video Practice",
                desc: "Record your responses and get AI feedback on delivery, body language, and confidence",
                color: "fuchsia",
                path: "/video-interview"
              },
              {
                icon: "/images/icon_role_practice.png",
                title: "Role-Specific Practice",
                desc: "Practice interviews tailored to your target role and industry",
                color: "purple",
                path: "/auth"
              },
              {
                icon: "/images/icon_resume_analysis.png",
                title: "Resume Analysis",
                desc: "Upload your resume for personalized interview questions based on your experience",
                color: "indigo",
                path: "/auth"
              },
              {
                icon: "/images/icon_job_market.png",
                title: "Job Market Insights",
                desc: "AI-researched trends and personalized career guidance for interview preparation",
                color: "emerald",
                path: "/job-market"
              }
            ].map((feature, index) => (
              <Card
                key={index}
                className="p-8 hover:shadow-2xl hover:shadow-violet-500/20 transition-all duration-300 border border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl cursor-pointer group hover:-translate-y-1 relative overflow-hidden"
                onClick={() => handleNavigate(feature.path)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br from-${feature.color}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-${feature.color}-500/10 to-${feature.color}-600/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 relative z-10`}>
                  <img src={feature.icon} alt={feature.title} className="w-12 h-12 object-contain drop-shadow-lg" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100 transition-colors duration-300 relative z-10 group-hover:text-violet-600 dark:group-hover:text-violet-400">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed transition-colors duration-300 relative z-10">
                  {feature.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Job Profiles Section */}
      <section ref={profilesRef} className="py-24 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-gray-900 dark:via-purple-950/20 dark:to-fuchsia-950/20 transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-gray-100 transition-colors duration-300">
              Get Ready for Jobs at Leading Firms
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 transition-colors duration-300">
              Explore what you need to learn for your dream role and practice with realistic simulations
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: "/images/icon_software_dev.png",
                title: "Software Developer",
                skills: ["Data Structures & Algorithms", "System Design", "Programming Languages"],
                color: "violet"
              },
              {
                icon: "/images/icon_data_scientist.png",
                title: "Data Scientist",
                skills: ["Machine Learning", "Statistics & Probability", "Python & R"],
                color: "fuchsia"
              },
              {
                icon: "/images/icon_product_manager.png",
                title: "Product Manager",
                skills: ["Product Strategy", "User Research", "Roadmap Planning"],
                color: "purple"
              }
            ].map((profile, index) => (
              <Card
                key={index}
                className="profile-card p-8 hover:shadow-2xl hover:shadow-violet-500/20 transition-all duration-300 border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-2xl cursor-pointer group hover:-translate-y-2 relative overflow-hidden"
                onClick={() => handleNavigate("/learning-paths")}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-${profile.color}-500/10 rounded-bl-full -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-150`} />

                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-${profile.color}-500/10 to-${profile.color}-600/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 relative z-10`}>
                  <img src={profile.icon} alt={profile.title} className="w-14 h-14 object-contain drop-shadow-lg" />
                </div>

                <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100 transition-colors duration-300 relative z-10">
                  {profile.title}
                </h3>

                <ul className="space-y-4 relative z-10">
                  {profile.skills.map((skill, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-all duration-300 group-hover:translate-x-1">
                      <div className={`w-6 h-6 rounded-full bg-${profile.color}-100 dark:bg-${profile.color}-900/30 flex items-center justify-center flex-shrink-0`}>
                        <CheckCircle className={`w-4 h-4 text-${profile.color}-600 dark:text-${profile.color}-400`} />
                      </div>
                      <span className="font-medium">{skill}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              onClick={() => handleNavigate("/learning-paths")}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/30 px-8 py-6 text-lg rounded-xl hover:scale-105 transition-all duration-300"
            >
              View All Learning Paths
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white dark:bg-gray-950 transition-colors duration-300">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 dark:from-violet-700 dark:via-purple-700 dark:to-fuchsia-700 text-white p-16 text-center border-0 rounded-3xl shadow-2xl shadow-violet-500/30 dark:shadow-violet-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent_50%)]"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Start Practicing?</h2>
              <p className="text-xl mb-10 opacity-95 max-w-2xl mx-auto">
                Join thousands preparing for their dream jobs with AI-powered interview practice
              </p>
              <Button
                size="lg"
                className="bg-white dark:bg-gray-100 text-violet-700 dark:text-violet-800 hover:bg-gray-100 dark:hover:bg-gray-200 px-10 py-6 text-lg rounded-xl shadow-xl font-semibold transition-all duration-300 hover:scale-105"
                onClick={() => handleNavigate("/auth")}
              >
                Get Started Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;