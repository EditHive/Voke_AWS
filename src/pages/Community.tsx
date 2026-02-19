import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageSquare, Heart, Share2, TrendingUp, Users, 
  MoreHorizontal, Image as ImageIcon, Send, Search
} from "lucide-react";
import { Navbar } from "@/components/Navbar";

const Community = () => {
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: { name: "Sarah Chen", avatar: "https://github.com/shadcn.png", role: "Senior Dev" },
      content: "Just cracked my Google interview! 🚀 The system design round was intense but Voke's mock interviews really helped me prepare for the pressure. Huge thanks to the community for the tips!",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60",
      likes: 234,
      comments: 45,
      time: "2h ago",
      tags: ["Success Story", "Interview Tips"]
    },
    {
      id: 2,
      author: { name: "Alex Rivera", avatar: "https://github.com/shadcn.png", role: "Full Stack" },
      content: "Anyone else finding the dynamic programming problems on LeetCode tricky? I've been stuck on the 'Climbing Stairs' variation for hours. Any resources you'd recommend?",
      likes: 56,
      comments: 12,
      time: "4h ago",
      tags: ["Help Needed", "DSA"]
    },
    {
      id: 3,
      author: { name: "Emily Zhang", avatar: "https://github.com/shadcn.png", role: "Product Manager" },
      content: "Hosting a mock interview session tonight at 8 PM EST for PM roles. We'll focus on product sense and execution. Join if you're interested! 📅",
      likes: 89,
      comments: 23,
      time: "6h ago",
      tags: ["Event", "Mock Interview"]
    }
  ]);

  const [newPost, setNewPost] = useState("");

  const handlePost = () => {
    if (!newPost.trim()) return;
    
    const post = {
      id: posts.length + 1,
      author: { name: "You", avatar: "https://github.com/shadcn.png", role: "User" },
      content: newPost,
      likes: 0,
      comments: 0,
      time: "Just now",
      tags: ["General"]
    };

    setPosts([post, ...posts]);
    setNewPost("");
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-violet-500/30">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Sidebar - Navigation */}
          <div className="hidden lg:block space-y-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm sticky top-24">
              <CardContent className="p-4 space-y-2">
                <Button variant="ghost" className="w-full justify-start text-lg font-medium bg-white/5 text-white">
                  <MessageSquare className="mr-3 h-5 w-5 text-violet-400" />
                  Feed
                </Button>
                <Button variant="ghost" className="w-full justify-start text-lg font-medium text-gray-400 hover:text-white hover:bg-white/5">
                  <TrendingUp className="mr-3 h-5 w-5 text-emerald-400" />
                  Trending
                </Button>
                <Button variant="ghost" className="w-full justify-start text-lg font-medium text-gray-400 hover:text-white hover:bg-white/5">
                  <Users className="mr-3 h-5 w-5 text-blue-400" />
                  Events
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm sticky top-64">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider">Top Contributors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-white/10">
                      <AvatarImage src={`https://github.com/shadcn.png`} />
                      <AvatarFallback>U{i}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">User {i}</p>
                      <p className="text-xs text-gray-500 truncate">1.2k points</p>
                    </div>
                    <Badge variant="outline" className="text-xs border-violet-500/30 text-violet-400">Top 1%</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Avatar className="h-10 w-10 border border-white/10">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>ME</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-4">
                    <Textarea 
                      placeholder="Share your thoughts, questions, or success stories..." 
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      className="bg-black/20 border-white/10 min-h-[100px] resize-none focus:border-violet-500/50"
                    />
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-violet-400 hover:bg-violet-500/10">
                          <ImageIcon className="h-5 w-5" />
                        </Button>
                      </div>
                      <Button onClick={handlePost} className="bg-violet-600 hover:bg-violet-700 text-white">
                        <Send className="mr-2 h-4 w-4" /> Post
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Posts Feed */}
            <div className="space-y-6">
              {posts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-white/5 border-white/10 backdrop-blur-sm overflow-hidden hover:border-white/20 transition-colors">
                    <CardHeader className="flex flex-row items-start gap-4 p-4">
                      <Avatar className="h-10 w-10 border border-white/10">
                        <AvatarImage src={post.author.avatar} />
                        <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-white">{post.author.name}</h3>
                            <p className="text-xs text-gray-400">{post.author.role} • {post.time}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-white">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-4">
                      <p className="text-gray-200 leading-relaxed">{post.content}</p>
                      {post.image && (
                        <div className="rounded-xl overflow-hidden border border-white/10">
                          <img src={post.image} alt="Post content" className="w-full h-auto object-cover" />
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="bg-white/5 hover:bg-white/10 text-gray-300 border-0">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 border-t border-white/5 flex justify-between">
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-pink-400 hover:bg-pink-500/10 gap-2">
                        <Heart className="h-4 w-4" /> {post.likes}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 gap-2">
                        <MessageSquare className="h-4 w-4" /> {post.comments}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-green-400 hover:bg-green-500/10 gap-2">
                        <Share2 className="h-4 w-4" /> Share
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Sidebar - Trending */}
          <div className="hidden lg:block space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Search community..." 
                className="pl-10 bg-white/5 border-white/10 text-sm rounded-full focus:bg-white/10 transition-all"
              />
            </div>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Trending Topics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { tag: "SystemDesign", posts: "2.4k" },
                  { tag: "InterviewPrep", posts: "1.8k" },
                  { tag: "CareerAdvice", posts: "1.2k" },
                  { tag: "ResumeReview", posts: "856" },
                  { tag: "SalaryNegotiation", posts: "643" }
                ].map((topic) => (
                  <div key={topic.tag} className="flex justify-between items-center group cursor-pointer">
                    <div>
                      <p className="font-medium text-gray-300 group-hover:text-violet-400 transition-colors">#{topic.tag}</p>
                      <p className="text-xs text-gray-500">{topic.posts} posts</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <TrendingUp className="h-4 w-4 text-gray-400" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Community;
