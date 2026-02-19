import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LayoutDashboard, Users, Settings, LogOut, Activity, 
  Shield, AlertTriangle, Search, Bell, Database, TrendingUp,
  MoreVertical, CheckCircle2, XCircle, Clock
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ADMIN_EMAIL } from "@/config/admin";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    
    if (session.user.email !== ADMIN_EMAIL) {
      setIsAuthorized(false);
    } else {
      setIsAuthorized(true);
    }
    setChecking(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const stats = [
    { title: "Total Users", value: "12,345", change: "+12%", icon: Users, color: "text-blue-400", bg: "bg-blue-500/10", data: [40, 30, 45, 50, 65, 60, 70] },
    { title: "Active Sessions", value: "423", change: "+5%", icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10", data: [20, 40, 35, 50, 45, 60, 55] },
    { title: "System Health", value: "99.9%", change: "Stable", icon: Database, color: "text-violet-400", bg: "bg-violet-500/10", data: [80, 85, 82, 90, 88, 95, 99] },
    { title: "Pending Reports", value: "15", change: "-2", icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-500/10", data: [10, 15, 12, 20, 18, 15, 10] },
  ];

  const chartData = [
    { name: 'Mon', users: 4000, sessions: 2400 },
    { name: 'Tue', users: 3000, sessions: 1398 },
    { name: 'Wed', users: 2000, sessions: 9800 },
    { name: 'Thu', users: 2780, sessions: 3908 },
    { name: 'Fri', users: 1890, sessions: 4800 },
    { name: 'Sat', users: 2390, sessions: 3800 },
    { name: 'Sun', users: 3490, sessions: 4300 },
  ];

  const mockUsers = [
    { id: 1, name: "Alice Johnson", email: "alice@example.com", status: "Active", role: "User", joined: "2024-01-15" },
    { id: 2, name: "Bob Smith", email: "bob@example.com", status: "Inactive", role: "User", joined: "2024-02-20" },
    { id: 3, name: "Charlie Brown", email: "charlie@example.com", status: "Active", role: "Moderator", joined: "2023-11-05" },
    { id: 4, name: "Diana Prince", email: "diana@example.com", status: "Banned", role: "User", joined: "2024-03-10" },
    { id: 5, name: "Evan Wright", email: "evan@example.com", status: "Active", role: "User", joined: "2024-01-25" },
  ];

  if (checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.1),transparent_70%)]" />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 flex flex-col items-center text-center max-w-md p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl"
        >
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
            <Shield className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-8">
            You do not have permission to access the Admin Portal. 
            This area is restricted to administrators only.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <Button variant="outline" className="flex-1 border-white/10 hover:bg-white/5" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
            <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden font-sans selection:bg-violet-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px]" />
      </div>

      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-72 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col relative z-20"
      >
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold block leading-none">Voke</span>
            <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Admin Portal</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {[
            { id: "overview", label: "Overview", icon: LayoutDashboard },
            { id: "users", label: "User Management", icon: Users },
            { id: "settings", label: "System Settings", icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                activeTab === item.id 
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? "animate-pulse" : ""}`} />
              <span className="font-medium">{item.label}</span>
              {activeTab === item.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white/10 mix-blend-overlay"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/10">
          <div className="flex items-center gap-3 mb-6 px-2">
            <Avatar className="h-10 w-10 border-2 border-violet-500/30">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Admin User</p>
              <p className="text-xs text-gray-500 truncate">{ADMIN_EMAIL}</p>
            </div>
          </div>
          <Button 
            variant="destructive" 
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20" 
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 sticky top-0 z-30 bg-black/50 backdrop-blur-md border-b border-white/5">
          <div>
            <h2 className="text-2xl font-bold capitalize tracking-tight">{activeTab}</h2>
            <p className="text-sm text-gray-500">Welcome back, here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Search anything..." 
                className="pl-10 bg-white/5 border-white/10 text-sm w-64 rounded-full focus:bg-white/10 transition-all"
              />
            </div>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 relative">
              <Bell className="h-5 w-5 text-gray-400" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </Button>
          </div>
        </header>

        <div className="p-8 space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="group relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 p-6 hover:bg-white/10 transition-all duration-300"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl ${stat.bg}`}>
                          <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${stat.change.startsWith('+') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                          {stat.change}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-3xl font-bold">{stat.value}</h3>
                        <p className="text-sm text-gray-400">{stat.title}</p>
                      </div>
                      {/* Mini Sparkline */}
                      <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20 group-hover:opacity-30 transition-opacity">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={stat.data.map((val, i) => ({ value: val }))}>
                            <Area 
                              type="monotone" 
                              dataKey="value" 
                              stroke="currentColor" 
                              fill="currentColor" 
                              className={stat.color} 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2 bg-white/5 border-white/10 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>User Growth & Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                            <XAxis dataKey="name" stroke="#6b7280" axisLine={false} tickLine={false} />
                            <YAxis stroke="#6b7280" axisLine={false} tickLine={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                              itemStyle={{ color: '#e5e7eb' }}
                            />
                            <Area type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
                            <Area type="monotone" dataKey="sessions" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorSessions)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>System Logs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[
                          { time: "10:42", msg: "Server started", type: "success" },
                          { time: "10:45", msg: "High memory usage", type: "warning" },
                          { time: "10:48", msg: "User #12345 reset password", type: "info" },
                          { time: "10:55", msg: "DB Connection timeout", type: "error" },
                          { time: "10:55", msg: "DB Connection restored", type: "success" },
                        ].map((log, i) => (
                          <div key={i} className="flex gap-3 items-start text-sm group">
                            <span className="text-gray-500 font-mono text-xs mt-0.5">{log.time}</span>
                            <div className="flex-1">
                              <p className={`font-medium ${
                                log.type === 'success' ? 'text-green-400' :
                                log.type === 'warning' ? 'text-yellow-400' :
                                log.type === 'error' ? 'text-red-400' : 'text-blue-400'
                              }`}>
                                {log.type.toUpperCase()}
                              </p>
                              <p className="text-gray-400 text-xs group-hover:text-gray-300 transition-colors">{log.msg}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Users Table */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Recent Registrations</CardTitle>
                    <Button variant="ghost" size="sm" className="text-violet-400 hover:text-violet-300">View All</Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10 hover:bg-white/5">
                          <TableHead className="text-gray-400">User</TableHead>
                          <TableHead className="text-gray-400">Status</TableHead>
                          <TableHead className="text-gray-400">Role</TableHead>
                          <TableHead className="text-gray-400">Joined</TableHead>
                          <TableHead className="text-right text-gray-400">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockUsers.map((user) => (
                          <TableRow key={user.id} className="border-white/10 hover:bg-white/5 transition-colors">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 border border-white/10">
                                  <AvatarFallback className="bg-violet-500/20 text-violet-300">{user.name[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-gray-200">{user.name}</p>
                                  <p className="text-xs text-gray-500">{user.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={`border-0 ${
                                  user.status === 'Active' ? 'bg-green-500/10 text-green-400' : 
                                  user.status === 'Inactive' ? 'bg-yellow-500/10 text-yellow-400' : 
                                  'bg-red-500/10 text-red-400'
                                }`}
                              >
                                {user.status === 'Active' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                {user.status === 'Inactive' && <Clock className="w-3 h-3 mr-1" />}
                                {user.status === 'Banned' && <XCircle className="w-3 h-3 mr-1" />}
                                {user.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-400">{user.role}</TableCell>
                            <TableCell className="text-gray-400">{user.joined}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "users" && (
              <motion.div
                key="users"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>User Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">Full user management table goes here...</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
