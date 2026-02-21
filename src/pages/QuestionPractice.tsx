import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft, Search, Filter, ExternalLink, Code2,
    Briefcase, CheckCircle2, Star, Zap, Flame, Trophy,
    ChevronDown, Check, ChevronsUpDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Navbar } from "@/components/Navbar";
import { Progress } from "@/components/ui/progress";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { QUESTIONS, COMPANIES, DIFFICULTIES } from "@/data/questions";

const QuestionPractice = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCompany, setSelectedCompany] = useState("All");
    const [selectedDifficulty, setSelectedDifficulty] = useState("All");
    const [openCompany, setOpenCompany] = useState(false);

    // Loading state
    const [isLoading, setIsLoading] = useState(true);
    const [loadingPhase, setLoadingPhase] = useState(0);

    useEffect(() => {
        // Cycle through companies
        const interval = setInterval(() => {
            setLoadingPhase(p => p + 1);
        }, 500);

        // End loading
        const timer = setTimeout(() => {
            setIsLoading(false);
            clearInterval(interval);
        }, 2500);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, []);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    const filteredQuestions = QUESTIONS.filter(q => {
        const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCompany = selectedCompany === "All" || q.companies.includes(selectedCompany);
        const matchesDifficulty = selectedDifficulty === "All" || q.difficulty === selectedDifficulty;

        return matchesSearch && matchesCompany && matchesDifficulty;
    });

    // Calculate pagination
    const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
    const paginatedQuestions = filteredQuestions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page when filters change
    if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(1);
    }

    const getDifficultyColor = (diff: string) => {
        switch (diff) {
            case "Easy": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
            case "Medium": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
            case "Hard": return "text-red-500 bg-red-500/10 border-red-500/20";
            default: return "text-gray-500";
        }
    };

    const getDifficultyBorder = (diff: string) => {
        switch (diff) {
            case "Easy": return "border-l-emerald-500";
            case "Medium": return "border-l-amber-500";
            case "Hard": return "border-l-red-500";
            default: return "border-l-gray-500";
        }
    };

    if (isLoading) {
        const companies = [
            { name: "GOOGLE", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" },
            { name: "AMAZON", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", logo: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg", imgClass: "brightness-0 invert" },
            { name: "META", color: "text-blue-400", bg: "bg-blue-600/10", border: "border-blue-600/20", logo: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Meta-Logo.png" },
            { name: "APPLE", color: "text-zinc-300", bg: "bg-zinc-500/10", border: "border-zinc-500/20", logo: "https://upload.wikimedia.org/wikipedia/commons/3/31/Apple_logo_white.svg" },
            { name: "NETFLIX", color: "text-red-500", bg: "bg-red-600/10", border: "border-red-600/20", logo: "https://upload.wikimedia.org/wikipedia/commons/7/75/Netflix_icon.svg" },
            { name: "MICROSOFT", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" },
        ];

        const currentCompany = companies[loadingPhase % companies.length];

        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden font-sans">
                {/* Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center">
                    <div className="relative mb-12">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={loadingPhase}
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 1.1, y: -10 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className={cn(
                                    "w-64 h-64 rounded-3xl border flex flex-col items-center justify-center backdrop-blur-xl shadow-2xl gap-6",
                                    currentCompany.border,
                                    currentCompany.bg
                                )}
                            >
                                <div className="w-24 h-24 relative flex items-center justify-center">
                                    <img
                                        src={currentCompany.logo}
                                        alt={currentCompany.name}
                                        className={cn("w-full h-full object-contain filter drop-shadow-lg", (currentCompany as any).imgClass)}
                                    />
                                </div>
                                <h2 className={cn("text-2xl font-bold tracking-widest", currentCompany.color)}>
                                    {currentCompany.name}
                                </h2>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-zinc-500 font-medium tracking-widest">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
                        </span>
                        CONNECTING_TO_DATABASE...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-violet-500/30">
            <Navbar />

            <main className="flex-1 pt-24 px-4 pb-12 container mx-auto max-w-7xl">

                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid lg:grid-cols-3 gap-8 mb-12"
                >
                    {/* Main Welcome */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-500 text-sm font-medium border border-violet-500/20">
                            <Code2 className="w-4 h-4" />
                            Interview Arena
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent">
                            Master the Code. <br /> Crack the Interview.
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                            Over <span className="text-foreground font-semibold">1800+</span> curated questions from top tech companies.
                            Practice daily to build your streak and confidence.
                        </p>

                        <div className="flex items-center gap-4 pt-2">
                            <Button size="lg" className="rounded-full px-8 bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-500/20">
                                Start Practicing
                            </Button>
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground overflow-hidden">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 20}`} alt="User" />
                                    </div>
                                ))}
                                <div className="w-10 h-10 rounded-full border-2 border-background bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-xs font-medium text-violet-600">
                                    +2k
                                </div>
                            </div>
                            <span className="text-sm text-muted-foreground font-medium">Joined by others</span>
                        </div>
                    </div>

                    {/* Stats Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="h-full border-primary/10 bg-gradient-to-br from-violet-50/50 to-fuchsia-50/50 dark:from-violet-950/10 dark:to-fuchsia-950/10 backdrop-blur-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-amber-500" />
                                    Your Progress
                                </CardTitle>
                                <CardDescription>Keep pushing your limits!</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Weekly Goal</span>
                                        <span className="font-semibold">12 / 20</span>
                                    </div>
                                    <Progress value={60} className="h-2 bg-muted/50" />
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <div className="p-3 rounded-lg bg-background/50 border border-border/50 text-center">
                                        <div className="text-2xl font-bold text-emerald-500">5</div>
                                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Easy</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-background/50 border border-border/50 text-center">
                                        <div className="text-2xl font-bold text-amber-500">3</div>
                                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Med</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-background/50 border border-border/50 text-center">
                                        <div className="text-2xl font-bold text-red-500">1</div>
                                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Hard</div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 text-orange-600 border border-orange-500/20">
                                    <div className="flex items-center gap-2">
                                        <Flame className="w-4 h-4 fill-orange-600" />
                                        <span className="text-sm font-semibold">Day Streak</span>
                                    </div>
                                    <span className="text-lg font-bold">3</span>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>

                {/* Filtering Bar */}
                <div className="sticky top-20 z-30 mb-8">
                    <div className="bg-card/80 backdrop-blur-md border border-border/50 p-4 rounded-xl shadow-lg shadow-black/5 flex flex-col md:flex-row gap-4 items-center justify-between">

                        {/* Search */}
                        <div className="relative w-full md:max-w-md group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-violet-500 transition-colors" />
                            <Input
                                placeholder="Search by title, tag or topic..."
                                className="pl-10 bg-background/50 border-transparent focus:border-violet-500/50 focus:bg-background transition-all"
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">

                            {/* Difficulty Toggle */}
                            <div className="bg-muted/50 p-1 rounded-lg flex items-center">
                                {DIFFICULTIES.map(diff => (
                                    <button
                                        key={diff}
                                        onClick={() => { setSelectedDifficulty(diff); setCurrentPage(1); }}
                                        className={cn(
                                            "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                                            selectedDifficulty === diff
                                                ? "bg-background text-foreground shadow-sm"
                                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                        )}
                                    >
                                        {diff}
                                    </button>
                                ))}
                            </div>

                            {/* Company Select Popover */}
                            <Popover open={openCompany} onOpenChange={setOpenCompany}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openCompany}
                                        className="justify-between min-w-[180px] bg-background/50"
                                    >
                                        {selectedCompany === "All" ? (
                                            <span className="flex items-center gap-2 text-muted-foreground">
                                                <Briefcase className="w-4 h-4" /> Filter Company
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2 text-primary font-medium">
                                                <Briefcase className="w-4 h-4" /> {selectedCompany}
                                            </span>
                                        )}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[200px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search company..." />
                                        <CommandList>
                                            <CommandEmpty>No company found.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem
                                                    value="All"
                                                    onSelect={() => {
                                                        setSelectedCompany("All");
                                                        setOpenCompany(false);
                                                        setCurrentPage(1);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedCompany === "All" ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    All Companies
                                                </CommandItem>
                                                {COMPANIES.filter(c => c !== "All").map((company) => (
                                                    <CommandItem
                                                        key={company}
                                                        value={company}
                                                        onSelect={(currentValue) => {
                                                            // CommandItem passes lowercase value, need to match original case from COMPANIES array if needed, 
                                                            // but state usually handles string directly. 
                                                            // Let's ensure we set the proper case from the list.
                                                            setSelectedCompany(company);
                                                            setOpenCompany(false);
                                                            setCurrentPage(1);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedCompany === company ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {company}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>

                            {(selectedCompany !== "All" || selectedDifficulty !== "All" || searchQuery) && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        setSelectedCompany("All");
                                        setSelectedDifficulty("All");
                                        setSearchQuery("");
                                        setCurrentPage(1);
                                    }}
                                    className="text-muted-foreground hover:text-destructive transition-colors"
                                >
                                    <Filter className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Questions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {paginatedQuestions.map((question, idx) => (
                            <motion.div
                                key={question.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card className={`h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer border-l-4 ${getDifficultyBorder(question.difficulty)} border-y border-r border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden`}>
                                    <CardHeader className="pb-3 relative">
                                        {/* Accent Glow */}
                                        <div className={cn(
                                            "absolute top-0 right-0 w-24 h-24  rounded-bl-full opacity-10 transition-opacity group-hover:opacity-20 pointer-events-none",
                                            question.difficulty === 'Easy' ? 'bg-emerald-500' : question.difficulty === 'Medium' ? 'bg-amber-500' : 'bg-red-500'
                                        )} />

                                        <div className="flex justify-between items-start mb-2 relative z-10">
                                            <Badge variant="outline" className={`rounded-md border-0 px-2.5 py-0.5 font-semibold ${getDifficultyColor(question.difficulty)}`}>
                                                {question.difficulty}
                                            </Badge>

                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded-full border border-border/50">
                                                    <img
                                                        src={question.platform === "LeetCode" ? "https://upload.wikimedia.org/wikipedia/commons/1/19/LeetCode_logo_black.png" : "/favicon.ico"}
                                                        alt={question.platform}
                                                        className="w-3 h-3 object-contain opacity-70"
                                                    />
                                                    {question.platform}
                                                </div>
                                            </div>
                                        </div>

                                        <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                                            {question.title}
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        {/* Companies */}
                                        {question.companies.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 h-[26px] overflow-hidden">
                                                {question.companies.slice(0, 3).map(company => (
                                                    <span key={company} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                                                        {company}
                                                    </span>
                                                ))}
                                                {question.companies.length > 3 && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                                                        +{question.companies.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Tags */}
                                        <div className="flex flex-wrap gap-1.5 min-h-[48px] content-start">
                                            {question.tags.slice(0, 4).map(tag => (
                                                <span key={tag} className="text-[10px] text-violet-600/80 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 rounded-full border border-violet-100 dark:border-violet-800">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </CardContent>

                                    <CardFooter className="pt-0">
                                        <Button
                                            className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all group/btn shadow-none hover:shadow-lg hover:shadow-primary/20"
                                            onClick={() => navigate(`/playground?title=${encodeURIComponent(question.title)}&difficulty=${question.difficulty}`)}
                                        >
                                            <span className="font-semibold">Solve Challenge</span>
                                            <Code2 className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Pagination Controls */}
                {filteredQuestions.length > 0 && (
                    <div className="flex justify-center items-center gap-4 mt-12">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => {
                                setCurrentPage(p => Math.max(1, p - 1));
                                window.scrollTo({ top: 300, behavior: 'smooth' });
                            }}
                            className="w-24 border-dashed"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" /> Prev
                        </Button>
                        <span className="text-sm font-medium text-muted-foreground bg-muted/30 px-4 py-1 rounded-full border border-border/50">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={() => {
                                setCurrentPage(p => Math.min(totalPages, p + 1));
                                window.scrollTo({ top: 300, behavior: 'smooth' });
                            }}
                            className="w-24 border-dashed"
                        >
                            Next <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                        </Button>
                    </div>
                )}

                {/* Simple Empty State */}
                {filteredQuestions.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20 bg-muted/10 rounded-3xl border border-dashed border-border"
                    >
                        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No matching questions</h3>
                        <p className="text-muted-foreground mb-6">Seems like we couldn't find what you're looking for.</p>
                        <Button
                            variant="secondary"
                            onClick={() => { setSearchQuery(""); setSelectedCompany("All"); setSelectedDifficulty("All"); setCurrentPage(1); }}
                            className="px-8"
                        >
                            Clear Filters
                        </Button>
                    </motion.div>
                )}

            </main>
        </div>
    );
};

export default QuestionPractice;
