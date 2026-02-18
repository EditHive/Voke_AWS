import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, Heart, Share2, TrendingUp, Users, 
  Search, Bell, MoreHorizontal, Image as ImageIcon, 
  Smile, Send, Hash, Bookmark, LogOut, ArrowLeft,
  CheckCircle2, Plus
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Mock Data
const TRENDING_TOPICS = [
  { tag: "#ReactJS", posts: "12.5k" },
  { tag: "#SystemDesign", posts: "8.2k" },
  { tag: "#InterviewTips", posts: "5.1k" },
  { tag: "#CareerGrowth", posts: "3.4k" },
  { tag: "#RemoteWork", posts: "2.8k" },
];

const SUGGESTED_USERS = [
  { name: "Sarah Chen", role: "Senior Frontend Dev", avatar: "/avatars/sarah.jpg" },
  { name: "Alex Rivera", role: "Tech Lead @ Google", avatar: "/avatars/alex.jpg" },
  { name: "Emily Zhang", role: "Product Designer", avatar: "/avatars/emily.jpg" },
];

const INITIAL_POSTS = [
  {
    id: 1,
    author: { name: "David Kim", role: "Software Engineer", avatar: "/avatars/david.jpg" },
    content: "Just landed my dream job at a FAANG company! 🚀 The system design rounds were tough, but practicing with Voke's AI interviewer really helped me articulate my thoughts clearly. Huge thanks to this community for the resources!",
    tags: ["#SuccessStory", "#FAANG", "#InterviewPrep"],
    likes: 342,
    comments: 56,
    shares: 12,
    timeAgo: "2h ago",
    isLiked: false
  },
  {
    id: 2,
    author: { name: "Maria Garcia", role: "Backend Developer", avatar: "/avatars/maria.jpg" },
    content: "What are your go-to resources for learning distributed systems? I've been reading DDIA but looking for more practical examples.",
    tags: ["#SystemDesign", "#Learning", "#Backend"],
    likes: 89,
    comments: 24,
    shares: 5,
    timeAgo: "5h ago",
    isLiked: true
  },
  {
    id: 3,
    author: { name: "James Wilson", role: "DevOps Engineer", avatar: "/avatars/james.jpg" },
    content: "Here's a quick cheat sheet I made for Kubernetes commands. Hope it helps someone preparing for DevOps interviews! 🐳",
    image: "https://images.unsplash.com/photo-1667372393119-c85c020799a3?q=80&w=1000&auto=format&fit=crop",
    tags: ["#DevOps", "#Kubernetes", "#CheatSheet"],
    likes: 567,
    comments: 45,
    shares: 89,
    timeAgo: "1d ago",
    isLiked: false
  }
];

const Community = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [newPostContent, setNewPostContent] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [activeTab, setActiveTab] = useState("feed");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      setIsJoined(true); // Assume joined if logged in for demo
    }
  };

  const handleJoin = () => {
    setIsJoined(!isJoined);
    if (!isJoined) {
      toast.success("Welcome to the Voke Community! 🎉");
    } else {
      toast.info("You've left the community.");
    }
  };

  const handleLike = (postId: number) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
          isLiked: !post.isLiked
        };
      }
      return post;
    }));
  };

  const handlePost = () => {
    if (!newPostContent.trim()) return;

    const newPost = {
      id: Date.now(),
      author: { 
        name: "You", 
        role: "Aspiring Developer", 
        avatar: "/placeholder-user.jpg" 
      },
      content: newPostContent,
      tags: ["#General"],
      likes: 0,
      comments: 0,
      shares: 0,
      timeAgo: "Just now",
      isLiked: false
    };

    setPosts([newPost, ...posts]);
    setNewPostContent("");
    toast.success("Post published successfully!");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2" onClick={() => navigate("/dashboard")}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent hidden md:block">
                Community
              </h1>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-8 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search discussions, people, or topics..." 
                className="pl-10 bg-muted/50 border-border/50 focus:bg-background transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant={isJoined ? "outline" : "default"}
              className={!isJoined ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-0" : ""}
              onClick={handleJoin}
            >
              {isJoined ? "Joined" : "Join Community"}
            </Button>
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar - Navigation */}
        <aside className="hidden lg:block lg:col-span-3 space-y-6 sticky top-24 h-fit">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <Avatar className="w-12 h-12 border-2 border-violet-500/20">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback>ME</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">Your Profile</h3>
                  <p className="text-xs text-muted-foreground">Software Engineer</p>
                </div>
              </div>
              
              <nav className="space-y-1">
                {[
                  { icon: MessageSquare, label: "Feed", id: "feed" },
                  { icon: Hash, label: "Topics", id: "topics" },
                  { icon: Bookmark, label: "Saved", id: "saved" },
                  { icon: Users, label: "Mentorship", id: "mentorship" },
                ].map((item) => (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab(item.id)}
                  >
                    <item.icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </Button>
                ))}
              </nav>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Daily Challenge</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Solve today's system design problem and earn badges!
              </p>
              <Button className="w-full" variant="outline" size="sm">
                View Challenge
              </Button>
            </CardContent>
          </Card>
        </aside>

        {/* Center - Feed */}
        <div className="lg:col-span-6 space-y-6">
          {/* Create Post */}
          {isJoined && (
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Avatar>
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback>ME</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-4">
                    <Textarea 
                      placeholder="Share your interview experience or ask a question..." 
                      className="min-h-[100px] resize-none border-0 bg-muted/30 focus:bg-background transition-all"
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-violet-500">
                          <ImageIcon className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-violet-500">
                          <Hash className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-violet-500">
                          <Smile className="w-5 h-5" />
                        </Button>
                      </div>
                      <Button 
                        onClick={handlePost}
                        disabled={!newPostContent.trim()}
                        className="bg-violet-600 hover:bg-violet-700 text-white"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Post
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Posts Feed */}
          <div className="space-y-4">
            <AnimatePresence>
              {posts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-border/50 hover:border-border transition-colors">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                      <div className="flex gap-3">
                        <Avatar>
                          <AvatarImage src={post.author.avatar} />
                          <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-sm">{post.author.name}</h4>
                          <p className="text-xs text-muted-foreground">{post.author.role} • {post.timeAgo}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {post.content}
                      </p>
                      {post.image && (
                        <div className="rounded-xl overflow-hidden border border-border/50">
                          <img src={post.image} alt="Post content" className="w-full h-auto object-cover max-h-[400px]" />
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs font-normal bg-violet-500/10 text-violet-600 hover:bg-violet-500/20">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-border/40">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`gap-2 ${post.isLiked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground'}`}
                          onClick={() => handleLike(post.id)}
                        >
                          <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                          {post.likes}
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                          <MessageSquare className="w-4 h-4" />
                          {post.comments}
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                          <Share2 className="w-4 h-4" />
                          {post.shares}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Sidebar - Trending */}
        <aside className="hidden lg:block lg:col-span-3 space-y-6 sticky top-24 h-fit">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-violet-500" />
                Trending Topics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {TRENDING_TOPICS.map((topic, i) => (
                <div key={i} className="flex items-center justify-between group cursor-pointer">
                  <div>
                    <p className="font-medium text-sm group-hover:text-violet-500 transition-colors">{topic.tag}</p>
                    <p className="text-xs text-muted-foreground">{topic.posts} posts</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Who to Follow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {SUGGESTED_USERS.map((user, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                      <p className="font-medium text-sm truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[100px]">{user.role}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    Follow
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
};

export default Community;
