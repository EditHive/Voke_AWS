import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, CheckCircle, Circle, BookOpen, Settings, Code, Database, Layout, Server, Brain, Rocket, ChevronRight, Star, Lock, Play } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

// Types
interface Resource {
  id: string;
  title: string;
  type: 'video' | 'doc' | 'code';
  link: string;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'locked';
  resources?: Resource[];
}

interface Path {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  milestones: Milestone[];
}

// Mock Data for Fallback
const MOCK_PATHS: Path[] = [
  {
    id: "frontend-mastery",
    title: "Frontend Development Mastery",
    description: "Master the art of building beautiful, responsive user interfaces.",
    icon: Layout,
    color: "from-blue-500 to-cyan-500",
    milestones: [
      { 
          id: "m1", 
          title: "HTML5 & CSS3 Fundamentals", 
          description: "Semantic HTML, Flexbox, Grid, and responsive design principles.", 
          status: "completed",
          resources: [
              { id: "m1-r1", title: "HTML Crash Course", type: "video", link: "https://www.youtube.com/watch?v=kUMe1FH4CHE" },
              { id: "m1-r2", title: "MDN Web Docs - HTML", type: "doc", link: "https://developer.mozilla.org/en-US/docs/Web/HTML" },
              { id: "m1-r3", title: "Build a Portfolio Site", type: "code", link: "/playground" }
          ]
      },
      { 
          id: "m2", 
          title: "JavaScript ES6+", 
          description: "Modern JavaScript features, async programming, and DOM manipulation.", 
          status: "completed",
          resources: [
              { id: "m2-r1", title: "JavaScript Survival Guide", type: "video", link: "https://www.youtube.com/watch?v=9emXNzqCKyg" },
              { id: "m2-r2", title: "JavaScript.info", type: "doc", link: "https://javascript.info/" },
              { id: "m2-r3", title: "Practice Array Methods", type: "code", link: "/playground" }
          ]
      },
      { 
          id: "m3", 
          title: "React.js Ecosystem", 
          description: "Components, hooks, context API, and state management.", 
          status: "in-progress",
          resources: [
              { id: "m3-r1", title: "React in 100 Seconds", type: "video", link: "https://www.youtube.com/watch?v=Tn6-PIqc4UM" },
              { id: "m3-r2", title: "React Docs (Beta)", type: "doc", link: "https://react.dev/" },
              { id: "m3-r3", title: "Build a Todo App", type: "code", link: "/playground" }
          ]
      },
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
      { 
          id: "b1", 
          title: "Node.js & Express", 
          description: "Building RESTful APIs and middleware architecture.", 
          status: "completed",
          resources: [
              { id: "b1-r1", title: "Node.js Crash Course", type: "video", link: "https://www.youtube.com/watch?v=fBNz5xF-Kx4" },
              { id: "b1-r2", title: "Express Docs", type: "doc", link: "https://expressjs.com/" }
          ]
      },
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
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);
  const [completedResources, setCompletedResources] = useState<string[]>([]);

  useEffect(() => {
    checkAuth();
    // Load progress from local storage
    const savedProgress = localStorage.getItem('voke_learning_progress');
    if (savedProgress) {
        setCompletedResources(JSON.parse(savedProgress));
    }
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

  const toggleResource = (resourceId: string) => {
      setCompletedResources(prev => {
          const newProgress = prev.includes(resourceId) 
              ? prev.filter(id => id !== resourceId)
              : [...prev, resourceId];
          localStorage.setItem('voke_learning_progress', JSON.stringify(newProgress));
          return newProgress;
      });
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
            <img 
              src="/images/voke_logo.png" 
              alt="Voke Logo" 
              className="w-10 h-10 object-contain"
            />
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
            
            <div className="mt-6 flex items-center gap-4 max-w-md">
                <Progress value={(selectedPath.milestones.filter(m => m.status === 'completed').length / selectedPath.milestones.length) * 100} className="h-2" />
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                    {Math.round((selectedPath.milestones.filter(m => m.status === 'completed').length / selectedPath.milestones.length) * 100)}% Complete
                </span>
            </div>
          </div>

          <div className="relative pl-8 md:pl-12 py-4 space-y-8">
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
                    onClick={() => setExpandedMilestone(expandedMilestone === milestone.id ? null : milestone.id)}
                    className={`w-10 h-10 rounded-full border-4 border-background flex items-center justify-center shadow-lg z-10 relative cursor-pointer hover:scale-110 transition-transform
                      ${milestone.status === 'completed' ? 'bg-green-500 text-white' : 
                        milestone.status === 'in-progress' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
                  >
                    {milestone.status === 'completed' ? <CheckCircle className="h-5 w-5" /> :
                     milestone.status === 'in-progress' ? <Code className="h-5 w-5" /> :
                     <Lock className="h-4 w-4" />}
                  </motion.div>
                </div>

                <Card 
                    className={`transition-all duration-300 hover:shadow-lg overflow-hidden
                    ${milestone.status === 'locked' ? 'opacity-70 bg-muted/30' : 'bg-card/50 backdrop-blur-sm border-primary/20'}
                    ${expandedMilestone === milestone.id ? 'ring-1 ring-primary' : ''}`}
                >
                  <CardContent className="p-0">
                    <div 
                        className="p-6 cursor-pointer"
                        onClick={() => setExpandedMilestone(expandedMilestone === milestone.id ? null : milestone.id)}
                    >
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
                                <Button 
                                    variant={expandedMilestone === milestone.id ? "secondary" : "ghost"} 
                                    size="sm"
                                    className="gap-2"
                                >
                                    {expandedMilestone === milestone.id ? "Close" : "Resources"}
                                    <ChevronRight className={`w-4 h-4 transition-transform ${expandedMilestone === milestone.id ? 'rotate-90' : ''}`} />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <AnimatePresence>
                        {expandedMilestone === milestone.id && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-border/50 bg-muted/20"
                            >
                                <div className="p-6 space-y-4">
                                    <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <BookOpen className="w-4 h-4" /> Learning Resources
                                    </h4>
                                    <div className="grid gap-3">
                                        {milestone.resources?.map((resource: any) => (
                                            <div 
                                                key={resource.id}
                                                className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border/50 hover:border-primary/50 transition-colors group"
                                            >
                                                <div 
                                                    className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors
                                                    ${completedResources.includes(resource.id) ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30 hover:border-primary'}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleResource(resource.id);
                                                    }}
                                                >
                                                    {completedResources.includes(resource.id) && <CheckCircle className="w-3.5 h-3.5" />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        {resource.type === 'video' ? <div className="p-1 rounded bg-red-500/10 text-red-500"><Play className="w-3 h-3" /></div> :
                                                         resource.type === 'doc' ? <div className="p-1 rounded bg-blue-500/10 text-blue-500"><BookOpen className="w-3 h-3" /></div> :
                                                         <div className="p-1 rounded bg-green-500/10 text-green-500"><Code className="w-3 h-3" /></div>}
                                                        <span className={`text-sm font-medium ${completedResources.includes(resource.id) ? 'line-through text-muted-foreground' : ''}`}>
                                                            {resource.title}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity h-8" asChild>
                                                    <a href={resource.link} target={resource.link.startsWith('/') ? '_self' : '_blank'} rel="noreferrer">
                                                        Open <ChevronRight className="w-3 h-3 ml-1" />
                                                    </a>
                                                </Button>
                                            </div>
                                        ))}
                                        {!milestone.resources && (
                                            <p className="text-sm text-muted-foreground italic">No specific resources added yet.</p>
                                        )}
                                    </div>

                                    {milestone.status !== 'locked' && (
                                        <div className="pt-4 flex justify-end">
                                            <Button onClick={() => navigate("/playground")} className="gap-2 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90">
                                                <Code className="w-4 h-4" />
                                                Practice in Playground
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
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
