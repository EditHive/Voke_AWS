import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  ArrowLeft, Search, Filter, ExternalLink, Code2, 
  Briefcase, CheckCircle2, Star, Zap 
} from "lucide-react";
import { motion } from "motion/react";
import { Navbar } from "@/components/Navbar";

// Mock Data for Questions
const QUESTIONS = [
  {
    id: 1,
    title: "Two Sum",
    difficulty: "Easy",
    companies: ["Google", "Amazon", "Meta"],
    platform: "LeetCode",
    url: "https://leetcode.com/problems/two-sum/",
    tags: ["Array", "Hash Table"]
  },
  {
    id: 2,
    title: "Reverse Linked List",
    difficulty: "Easy",
    companies: ["Google", "Microsoft", "Amazon"],
    platform: "LeetCode",
    url: "https://leetcode.com/problems/reverse-linked-list/",
    tags: ["Linked List", "Recursion"]
  },
  {
    id: 3,
    title: "LRU Cache",
    difficulty: "Medium",
    companies: ["Google", "Meta", "Amazon", "Microsoft"],
    platform: "LeetCode",
    url: "https://leetcode.com/problems/lru-cache/",
    tags: ["Hash Table", "Linked List", "Design"]
  },
  {
    id: 4,
    title: "Median of Two Sorted Arrays",
    difficulty: "Hard",
    companies: ["Google", "Amazon", "Goldman Sachs"],
    platform: "LeetCode",
    url: "https://leetcode.com/problems/median-of-two-sorted-arrays/",
    tags: ["Array", "Binary Search", "Divide and Conquer"]
  },
  {
    id: 5,
    title: "Chef and Happy String",
    difficulty: "Easy",
    companies: ["CodeChef"],
    platform: "CodeChef",
    url: "https://www.codechef.com/problems/HAPPYSTR",
    tags: ["String", "Greedy"]
  },
  {
    id: 6,
    title: "Trapping Rain Water",
    difficulty: "Hard",
    companies: ["Google", "Goldman Sachs", "Amazon"],
    platform: "LeetCode",
    url: "https://leetcode.com/problems/trapping-rain-water/",
    tags: ["Array", "Two Pointers", "Dynamic Programming"]
  },
  {
    id: 7,
    title: "Merge Intervals",
    difficulty: "Medium",
    companies: ["Google", "Meta", "Uber"],
    platform: "LeetCode",
    url: "https://leetcode.com/problems/merge-intervals/",
    tags: ["Array", "Sorting"]
  },
  {
    id: 8,
    title: "Valid Parentheses",
    difficulty: "Easy",
    companies: ["Amazon", "Meta", "Google"],
    platform: "LeetCode",
    url: "https://leetcode.com/problems/valid-parentheses/",
    tags: ["String", "Stack"]
  }
];

const COMPANIES = ["All", "Google", "Amazon", "Meta", "Microsoft", "Netflix", "Uber"];
const DIFFICULTIES = ["All", "Easy", "Medium", "Hard"];

const QuestionPractice = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");

  const filteredQuestions = QUESTIONS.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          q.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCompany = selectedCompany === "All" || q.companies.includes(selectedCompany);
    const matchesDifficulty = selectedDifficulty === "All" || q.difficulty === selectedDifficulty;

    return matchesSearch && matchesCompany && matchesDifficulty;
  });

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "Easy": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "Medium": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "Hard": return "text-red-500 bg-red-500/10 border-red-500/20";
      default: return "text-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
       <Navbar />

       <main className="flex-1 pt-24 px-4 pb-12 container mx-auto max-w-7xl">
         
         {/* Hero Section */}
         <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
         >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-500 text-sm font-medium mb-4 border border-violet-500/20">
              <Code2 className="w-4 h-4" />
              Practice Arena
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
              Master Your Algorithms
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Curated list of top interview questions from FAANG and other top tech companies. 
              Filter by company, difficulty, or topic and start coding on your favorite platform.
            </p>
         </motion.div>

         {/* Filters & Search */}
         <div className="bg-card/50 backdrop-blur-sm border border-border/50 p-6 rounded-2xl mb-8 space-y-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
               <div className="relative w-full md:max-w-md">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                 <Input 
                   placeholder="Search questions or tags..." 
                   className="pl-10 bg-background/50"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
               </div>
               
               <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
                  {DIFFICULTIES.map(diff => (
                    <Button
                      key={diff}
                      variant={selectedDifficulty === diff ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDifficulty(diff)}
                      className="whitespace-nowrap rounded-full"
                    >
                      {diff}
                    </Button>
                  ))}
               </div>
            </div>

            <div>
               <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                 <Briefcase className="w-4 h-4" /> Filter by Company:
               </p>
               <div className="flex flex-wrap gap-2">
                  {COMPANIES.map(company => (
                    <Badge
                      key={company}
                      variant="outline"
                      className={`cursor-pointer transition-all px-3 py-1 rounded-full ${selectedCompany === company ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'}`}
                      onClick={() => setSelectedCompany(company)}
                    >
                      {company}
                    </Badge>
                  ))}
               </div>
            </div>
         </div>

         {/* Questions Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuestions.map((question, idx) => (
               <motion.div
                 key={question.id}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: idx * 0.05 }}
               >
                 <Card className="h-full hover:shadow-lg transition-all hover:border-violet-500/50 group cursor-pointer border-l-4 border-l-transparent hover:border-l-violet-500">
                    <CardHeader className="pb-3">
                       <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline" className={`rounded-md ${getDifficultyColor(question.difficulty)}`}>
                             {question.difficulty}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                             <img 
                               src={question.platform === "LeetCode" ? "https://upload.wikimedia.org/wikipedia/commons/1/19/LeetCode_logo_black.png" : "/favicon.ico"} 
                               alt={question.platform}
                               className="w-3 h-3 object-contain opacity-70"
                             />
                             {question.platform}
                          </div>
                       </div>
                       <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {question.title}
                       </CardTitle>
                       <div className="flex flex-wrap gap-1 mt-2">
                          {question.tags.map(tag => (
                             <span key={tag} className="text-[10px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">
                               #{tag}
                             </span>
                          ))}
                       </div>
                    </CardHeader>
                    <CardContent>
                       <div className="flex flex-wrap gap-2 mb-4">
                          {question.companies.slice(0, 3).map(company => (
                             <Badge key={company} variant="secondary" className="text-[10px] font-normal">
                                {company}
                             </Badge>
                          ))}
                          {question.companies.length > 3 && (
                             <Badge variant="secondary" className="text-[10px] font-normal">
                                +{question.companies.length - 3}
                             </Badge>
                          )}
                       </div>
                       
                       <Button 
                         className="w-full bg-violet-600/10 text-violet-600 hover:bg-violet-600 hover:text-white dark:bg-violet-500/10 dark:text-violet-400 dark:hover:bg-violet-500 dark:hover:text-white transition-all group/btn"
                         onClick={() => window.open(question.url, '_blank')}
                       >
                         Solve Problem
                         <ExternalLink className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                       </Button>
                    </CardContent>
                 </Card>
               </motion.div>
            ))}
         </div>

         {filteredQuestions.length === 0 && (
            <div className="text-center py-20">
               <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
               </div>
               <h3 className="text-lg font-medium">No questions found</h3>
               <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
               <Button 
                 variant="link" 
                 onClick={() => { setSearchQuery(""); setSelectedCompany("All"); setSelectedDifficulty("All"); }}
                 className="mt-2 text-violet-500"
               >
                 Clear all filters
               </Button>
            </div>
         )}

       </main>
    </div>
  );
};

export default QuestionPractice;
