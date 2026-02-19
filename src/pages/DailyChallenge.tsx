import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Play, CheckCircle2, Timer, RotateCcw, Code2, Terminal, Cpu, Share2, Sparkles, Trophy } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import Confetti from "react-confetti";

const DailyChallenge = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState(`function reverseList(head) {
  // Your code here
  
}`);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(24 * 60 * 60); // 24 hours in seconds (mock)
  const [activeTab, setActiveTab] = useState("description");
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const handleRun = () => {
    setIsRunning(true);
    setOutput("Running tests...\n");
    
    setTimeout(() => {
      setIsRunning(false);
      setOutput((prev) => prev + "> Test Case 1: [1,2,3,4,5] -> Passed\n> Test Case 2: [1,2] -> Passed\n> Test Case 3: [] -> Passed\n\nAll test cases passed! Ready to submit.");
    }, 1500);
  };

  const handleSubmit = () => {
    if (!output.includes("All test cases passed")) {
      toast.error("Please run your code and pass all tests first!");
      return;
    }
    
    setIsSubmitted(true);
    toast.success("Challenge Completed! +50 XP");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {isSubmitted && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={500} />}
      
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                Daily Challenge
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200">
                  Hard
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Timer className="h-3 w-3" />
                Time Remaining: {formatTime(timeLeft)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setCode(`function reverseList(head) {\n  // Reset code\n  \n}`)}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleSubmit}
              disabled={isSubmitted}
            >
              {isSubmitted ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Completed
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Submit
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 lg:p-6 overflow-hidden h-[calc(100vh-64px)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          
          {/* Left Panel: Problem Description */}
          <Card className="h-full flex flex-col border-border/50 shadow-lg overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <div className="px-4 pt-4 border-b border-border/50 bg-muted/30">
                <TabsList className="bg-transparent p-0 gap-4">
                  <TabsTrigger value="description" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2">
                    Description
                  </TabsTrigger>
                  <TabsTrigger value="hints" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2">
                    Hints
                  </TabsTrigger>
                  <TabsTrigger value="submissions" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2">
                    Submissions
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1">
                <TabsContent value="description" className="p-6 m-0 space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Reverse Linked List</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Given the <code>head</code> of a singly linked list, reverse the list, and return <em>the reversed list</em>.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Examples</h3>
                    
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <p className="font-medium">Example 1:</p>
                      <div className="flex gap-4 items-center my-2">
                        <div className="flex items-center gap-2 text-sm bg-background p-2 rounded border">
                          1 <ArrowLeft className="h-3 w-3 rotate-180" /> 2 <ArrowLeft className="h-3 w-3 rotate-180" /> 3 <ArrowLeft className="h-3 w-3 rotate-180" /> 4 <ArrowLeft className="h-3 w-3 rotate-180" /> 5
                        </div>
                        <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
                        <div className="flex items-center gap-2 text-sm bg-background p-2 rounded border">
                          5 <ArrowLeft className="h-3 w-3 rotate-180" /> 4 <ArrowLeft className="h-3 w-3 rotate-180" /> 3 <ArrowLeft className="h-3 w-3 rotate-180" /> 2 <ArrowLeft className="h-3 w-3 rotate-180" /> 1
                        </div>
                      </div>
                      <code className="text-sm block">Input: head = [1,2,3,4,5]</code>
                      <code className="text-sm block">Output: [5,4,3,2,1]</code>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <p className="font-medium">Example 2:</p>
                      <code className="text-sm block">Input: head = [1,2]</code>
                      <code className="text-sm block">Output: [2,1]</code>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Constraints</h3>
                    <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                      <li>The number of nodes in the list is the range <code>[0, 5000]</code>.</li>
                      <li><code>-5000 &lt;= Node.val &lt;= 5000</code></li>
                    </ul>
                  </div>
                </TabsContent>
                
                <TabsContent value="hints" className="p-6 m-0">
                  <div className="space-y-4">
                    <div className="p-4 border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 rounded-lg">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" /> Hint 1
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-400">
                        A linked list can be reversed either iteratively or recursively. Could you implement both?
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="submissions" className="p-6 m-0">
                  <div className="text-center py-12">
                    <Trophy className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-medium">No submissions yet</h3>
                    <p className="text-muted-foreground">Submit your code to see your history.</p>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </Card>

          {/* Right Panel: Code Editor */}
          <div className="flex flex-col gap-4 h-full">
            <Card className="flex-1 flex flex-col border-border/50 shadow-lg overflow-hidden bg-[#1e1e1e] text-white">
              <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3e3e42]">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Code2 className="h-4 w-4" />
                  <span>JavaScript</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 relative">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="absolute inset-0 w-full h-full bg-[#1e1e1e] text-gray-300 font-mono text-sm p-4 resize-none focus:outline-none leading-relaxed"
                  spellCheck={false}
                />
              </div>
            </Card>

            {/* Console/Output */}
            <Card className="h-1/3 flex flex-col border-border/50 shadow-lg overflow-hidden bg-card">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-muted/30">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Terminal className="h-4 w-4 text-muted-foreground" />
                  Console
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    onClick={handleRun}
                    disabled={isRunning}
                    className="h-7 text-xs"
                  >
                    {isRunning ? (
                      <Cpu className="h-3 w-3 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-3 w-3 mr-2" />
                    )}
                    Run Code
                  </Button>
                </div>
              </div>
              <ScrollArea className="flex-1 p-4 font-mono text-sm">
                {output ? (
                  <pre className="whitespace-pre-wrap text-foreground">{output}</pre>
                ) : (
                  <div className="text-muted-foreground italic">Run your code to see output...</div>
                )}
              </ScrollArea>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

function Settings({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export default DailyChallenge;
