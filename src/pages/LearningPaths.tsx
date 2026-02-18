import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, CheckCircle, Circle, BookOpen, Settings, Code, Database, Layout, Server, Brain, Rocket, ChevronRight, Star, Lock } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mock Data for Fallback
const MOCK_PATHS = [
  {
    id: "frontend-mastery",
    title: "Frontend Development Mastery",
    description: "Master the art of building beautiful, responsive user interfaces.",
    icon: Layout,
    color: "from-blue-500 to-cyan-500",
    milestones: [
      { id: "m1", title: "HTML5 & CSS3 Fundamentals", description: "Semantic HTML, Flexbox, Grid, and responsive design principles.", status: "completed" },
      { id: "m2", title: "JavaScript ES6+", description: "Modern JavaScript features, async programming, and DOM manipulation.", status: "completed" },
      { id: "m3", title: "React.js Ecosystem", description: "Components, hooks, context API, and state management.", status: "in-progress" },
      { id: "m4", title: "TypeScript Integration", description: "Static typing, interfaces, and generics for robust code.", status: "locked" },
      { id: "m5", title: "Next.js & SSR", description: "Server-side rendering, static site generation, and routing.", status: "locked" },
      { id: "m6", title: "Performance Optimization", description: "Core Web Vitals, lazy loading, and bundle analysis.", status: "locked" }
    ]
  },
  {
    id: "backend-architect",
    title: "Backend Architect",
    description: "Design and build scalable, secure server-side applications.",
    icon: Server,
    color: "from-emerald-500 to-green-500",
    milestones: [
      { id: "b1", title: "Node.js & Express", description: "Building RESTful APIs and middleware architecture.", status: "completed" },
      { id: "b2", title: "Database Design (SQL/NoSQL)", description: "Schema design, normalization, and indexing strategies.", status: "in-progress" },
      { id: "b3", title: "Authentication & Security", description: "JWT, OAuth, hashing, and preventing common vulnerabilities.", status: "locked" },
      { id: "b4", title: "Microservices Architecture", description: "Docker, Kubernetes, and inter-service communication.", status: "locked" },
      { id: "b5", title: "System Design", description: "Scalability, caching, load balancing, and distributed systems.", status: "locked" }
    ]
  },
  {
    id: "data-science",
    title: "Data Science & AI",
    description: "Unlock insights from data and build intelligent models.",
    icon: Brain,
    color: "from-purple-500 to-pink-500",
    milestones: [
      { id: "d1", title: "Python for Data Science", description: "NumPy, Pandas, and data manipulation techniques.", status: "completed" },
      { id: "d2", title: "Exploratory Data Analysis", description: "Data visualization with Matplotlib and Seaborn.", status: "locked" },
      { id: "d3", title: "Machine Learning Basics", description: "Supervised and unsupervised learning algorithms.", status: "locked" },
      { id: "d4", title: "Deep Learning with PyTorch", description: "Neural networks, CNNs, and RNNs.", status: "locked" },
      { id: "d5", title: "MLOps & Deployment", description: "Model serving, monitoring, and pipelines.", status: "locked" }
    ]
  }
];

const LearningPaths = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [selectedPath, setSelectedPath] = useState(MOCK_PATHS[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    // Simulate loading for effect
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Rocket className="h-12 w-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(user ? "/dashboard" : "/")}>
            <div className="p-2 bg-primary/10 rounded-xl">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
              Learning Paths
            </h1>
          </div>
          <nav className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>Dashboard</Button>
                <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
                  <Settings className="w-5 h-5" />
                </Button>
                <Button variant="destructive" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate("/auth")}>Sign In</Button>
            )}
          </nav>
        </div>
      </motion.header>

      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8 overflow-hidden">
        {/* Sidebar / Path Selection */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full lg:w-80 shrink-0 space-y-6"
        >
          <div>
            <h2 className="text-xl font-bold mb-2">Career Tracks</h2>
            <p className="text-sm text-muted-foreground">Select a path to view your roadmap.</p>
          </div>
          
          <div className="space-y-3">
            {MOCK_PATHS.map((path) => (
              <motion.div
                key={path.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className={`cursor-pointer transition-all duration-300 border-2 ${selectedPath.id === path.id ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-border hover:border-primary/50 hover:bg-muted/50'}`}
                  onClick={() => setSelectedPath(path)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${path.color} text-white shadow-md`}>
                      <path.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{path.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">{path.description}</p>
                    </div>
                    {selectedPath.id === path.id && (
                      <motion.div layoutId="active-indicator" className="ml-auto">
                        <ChevronRight className="h-5 w-5 text-primary" />
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {!user && (
            <Card className="bg-gradient-to-br from-primary to-purple-600 text-white border-none shadow-xl">
              <CardContent className="p-6 text-center space-y-4">
                <Star className="h-10 w-10 mx-auto text-yellow-300 fill-yellow-300 animate-pulse" />
                <div>
                  <h3 className="font-bold text-lg">Track Your Progress</h3>
                  <p className="text-sm opacity-90">Sign in to save your learning journey and earn certificates.</p>
                </div>
                <Button variant="secondary" className="w-full font-semibold" onClick={() => navigate("/auth")}>
                  Get Started
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Main Content / Timeline */}
        <motion.div 
          key={selectedPath.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex-1 min-w-0"
        >
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className="px-3 py-1 text-sm border-primary/30 bg-primary/5 text-primary">
                Career Path
              </Badge>
              <span className="text-sm text-muted-foreground">{selectedPath.milestones.length} Milestones</span>
            </div>
            <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 mb-3">
              {selectedPath.title}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              {selectedPath.description}
            </p>
          </div>

          <div className="relative pl-8 md:pl-12 py-4 space-y-12">
            {/* Timeline Line */}
            <div className="absolute left-4 md:left-6 top-6 bottom-6 w-0.5 bg-border">
              <motion.div 
                initial={{ height: "0%" }}
                animate={{ height: "100%" }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute top-0 left-0 w-full bg-gradient-to-b from-primary via-purple-500 to-transparent"
              />
            </div>

            {selectedPath.milestones.map((milestone, index) => (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 + 0.3 }}
                className="relative"
              >
                {/* Timeline Node */}
                <div className="absolute -left-[2.25rem] md:-left-[2.75rem] top-1">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.15 + 0.3, type: "spring" }}
                    className={`w-10 h-10 rounded-full border-4 border-background flex items-center justify-center shadow-lg z-10 relative
                      ${milestone.status === 'completed' ? 'bg-green-500 text-white' : 
                        milestone.status === 'in-progress' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
                  >
                    {milestone.status === 'completed' ? <CheckCircle className="h-5 w-5" /> :
                     milestone.status === 'in-progress' ? <Code className="h-5 w-5" /> :
                     <Lock className="h-4 w-4" />}
                  </motion.div>
                </div>

                <Card className={`transition-all duration-300 hover:shadow-lg ${milestone.status === 'locked' ? 'opacity-70 bg-muted/30' : 'bg-card/50 backdrop-blur-sm border-primary/20'}`}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-xl font-bold">{milestone.title}</h3>
                          {milestone.status === 'in-progress' && (
                            <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none">In Progress</Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground">{milestone.description}</p>
                      </div>
                      <div className="shrink-0">
                        {milestone.status === 'completed' ? (
                          <Button variant="outline" className="text-green-500 border-green-500/20 hover:bg-green-500/10 w-full md:w-auto">
                            Review
                          </Button>
                        ) : milestone.status === 'in-progress' ? (
                          <Button className="w-full md:w-auto shadow-lg shadow-primary/20">
                            Continue Learning
                          </Button>
                        ) : (
                          <Button variant="ghost" disabled className="w-full md:w-auto">
                            Locked
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default LearningPaths;
