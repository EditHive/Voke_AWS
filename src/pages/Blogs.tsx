import { motion } from "framer-motion";
import { ArrowRight, Calendar, User, Clock, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";

const Blogs = () => {
  const blogs = [
    {
      id: 1,
      title: "The Future of AI in Tech Interviews",
      excerpt: "How artificial intelligence is revolutionizing the way companies hire top talent and what it means for candidates.",
      author: "Sarah Chen",
      date: "Mar 15, 2024",
      readTime: "5 min read",
      category: "AI & Tech",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2000&auto=format&fit=crop"
    },
    {
      id: 2,
      title: "Mastering the System Design Interview",
      excerpt: "Key concepts and strategies to ace your next system design round, from load balancing to database sharding.",
      author: "David Miller",
      date: "Mar 12, 2024",
      readTime: "8 min read",
      category: "Career Advice",
      image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2000&auto=format&fit=crop"
    },
    {
      id: 3,
      title: "Top 10 Soft Skills for Developers",
      excerpt: "Technical skills get you the interview, but soft skills get you the job. Here are the essential skills you need.",
      author: "Emily Zhang",
      date: "Mar 10, 2024",
      readTime: "4 min read",
      category: "Soft Skills",
      image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2000&auto=format&fit=crop"
    },
    {
      id: 4,
      title: "Remote Work: Best Practices for 2024",
      excerpt: "Navigating the challenges and opportunities of remote work in the modern tech landscape.",
      author: "James Wilson",
      date: "Mar 08, 2024",
      readTime: "6 min read",
      category: "Work Culture",
      image: "https://images.unsplash.com/photo-1593642532973-d31b6557fa68?q=80&w=2000&auto=format&fit=crop"
    },
    {
      id: 5,
      title: "Understanding Big O Notation",
      excerpt: "A comprehensive guide to time and space complexity analysis for coding interviews.",
      author: "Michael Brown",
      date: "Mar 05, 2024",
      readTime: "10 min read",
      category: "Algorithms",
      image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=2000&auto=format&fit=crop"
    },
    {
      id: 6,
      title: "The Rise of Full Stack Development",
      excerpt: "Why full stack developers are in high demand and how to become one in 2024.",
      author: "Lisa Anderson",
      date: "Mar 01, 2024",
      readTime: "7 min read",
      category: "Development",
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2000&auto=format&fit=crop"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-violet-500/30">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.15),transparent_70%)]" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="mb-6 border-violet-500/30 text-violet-300 bg-violet-500/10 px-4 py-1.5 text-sm rounded-full">
              Our Blog
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 tracking-tight">
              Latest Updates & <br />
              <span className="text-violet-400">Industry Insights</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Discover the latest trends in tech, interview strategies, and career advice from industry experts.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="px-6 pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog, index) => (
              <motion.div
                key={blog.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group h-full"
              >
                <Card className="bg-white/5 border-white/10 overflow-hidden hover:border-violet-500/30 transition-all duration-500 h-full flex flex-col group-hover:shadow-2xl group-hover:shadow-violet-500/10">
                  <div className="relative h-56 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                    <img 
                      src={blog.image} 
                      alt={blog.title} 
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                    />
                    <Badge className="absolute top-4 left-4 z-20 bg-black/50 backdrop-blur-md border-white/10 hover:bg-black/70">
                      {blog.category}
                    </Badge>
                  </div>
                  
                  <CardHeader className="space-y-4 flex-1">
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {blog.date}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {blog.readTime}
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold group-hover:text-violet-400 transition-colors line-clamp-2">
                      {blog.title}
                    </h3>
                    <p className="text-gray-400 line-clamp-3 text-sm leading-relaxed">
                      {blog.excerpt}
                    </p>
                  </CardHeader>

                  <CardFooter className="pt-0 mt-auto border-t border-white/5 p-6">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold">
                          {blog.author[0]}
                        </div>
                        <span className="text-sm font-medium text-gray-300">{blog.author}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 p-0 h-auto font-medium group/btn">
                        Read Article
                        <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Blogs;
