import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Play, RotateCcw, Terminal, Cpu, Sparkles, Settings, Bot, Send, Code, User, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { executeCode } from "@/utils/codeExecutor"; 
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

type Language = 'javascript' | 'python' | 'bash';

const TEMPLATES = {
  javascript: `// Write your JavaScript code here
console.log("Hello, Voke!");

function example() {
  return "Happy coding!";
}

console.log(example());
`,
  python: `# Write your Python code here
print("Hello, Voke!")

def example():
    return "Happy coding!"

print(example())
`,
  bash: `# Write your Bash script here
echo "Hello, Voke!"
`
};

const FILE_NAMES = {
  javascript: 'script.js',
  python: 'main.py',
  bash: 'script.sh'
};

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const Playground = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<Language>('python');
  const [code, setCode] = useState("print('Hello from Python!')");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  
  // Editor Settings
  const [editorOptions, setEditorOptions] = useState({
    fontSize: 14,
    minimap: false,
    wordWrap: 'on' as 'off' | 'on',
    lineNumbers: 'on' as 'on' | 'off'
  });

  // Chat State
  const [messages, setMessages] = useState<Message[]>([
      { role: 'assistant', content: 'Hi! I\'m your AI coding assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleLanguageChange = (value: Language) => {
    setLanguage(value);
    setCode(TEMPLATES[value]);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput("Running...\n");
    
    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
        const result = await executeCode(code, language);
        
        // Format output
        let outputText = "";
        if (result.logs.length > 0) {
            outputText += result.logs.map(l => `> ${l}`).join('\n');
        } 
        
        if (result.error) {
            if (outputText) outputText += "\n\n";
            outputText += `Error:\n${result.error}`;
        } 
        
        if (!result.logs.length && !result.error) {
            outputText += "Code executed successfully (no output)";
        }
        
        setOutput(outputText);
    } catch (err: any) {
        setOutput(`Execution Failed: ${err.message}`);
    } finally {
        setIsRunning(false);
    }
  };

  const handleSend = async () => {
      if (!input.trim() || isTyping) return;
      
      const userMessage = input.trim();
      setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
      setInput("");
      setIsTyping(true);

      try {
        const { data, error } = await supabase.functions.invoke("interview-coach-chat", {
            body: {
                messages: [
                    {
                        role: "system",
                        content: `You are a helpful AI coding assistant in a code playground. The user is writing ${language} code. 
                        Current code:
                        \`\`\`${language}
                        ${code}
                        \`\`\`
                        Answer their questions about the code, help debug, or explain concepts. Be concise and friendly.`
                    },
                    ...messages.map(m => ({ role: m.role, content: m.content })),
                    { role: "user", content: userMessage }
                ]
            }
        });

        if (error) throw error;
        
        if (data?.response) {
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        }
      } catch (error) {
          console.error("Chat error:", error);
          toast.error("Failed to get response from AI");
          setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
      } finally {
          setIsTyping(false);
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
      }
  };

  return (
    <div className="h-screen bg-[#0f1117] text-gray-200 flex flex-col overflow-hidden font-sans selection:bg-indigo-500/30">
      
      {/* Header */}
      <header className="h-14 bg-[#161b22] border-b border-[#2d333b] flex items-center px-6 justify-between shrink-0 shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>

        <div className="flex items-center gap-6 relative z-10">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 text-gray-400 hover:text-white hover:bg-[#2d333b] rounded-full transition-all duration-300" 
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent flex items-center gap-2">
                <Code className="h-5 w-5 text-indigo-400" />
                Playground
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
           <div className="flex items-center bg-[#21262d] rounded-lg p-1 border border-[#30363d]">
             <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#30363d] rounded-md transition-colors" onClick={() => setCode(TEMPLATES[language])}>
                <RotateCcw className="h-4 w-4" />
             </Button>
             
             <Popover>
                 <PopoverTrigger asChild>
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#30363d] rounded-md transition-colors">
                        <Settings className="h-4 w-4" />
                     </Button>
                 </PopoverTrigger>
                 <PopoverContent className="w-80 bg-[#161b22] border-[#30363d] text-gray-200 p-4 shadow-xl mr-4">
                     <div className="space-y-4">
                         <h4 className="font-medium text-sm text-gray-100 border-b border-[#30363d] pb-2">Editor Settings</h4>
                         
                         <div className="space-y-2">
                             <div className="flex justify-between items-center text-xs text-gray-400">
                                 <Label>Font Size</Label>
                                 <span className="font-mono">{editorOptions.fontSize}px</span>
                             </div>
                             <Slider 
                                 value={[editorOptions.fontSize]} 
                                 min={12} 
                                 max={24} 
                                 step={1}
                                 onValueChange={([val]) => setEditorOptions(prev => ({ ...prev, fontSize: val }))}
                                 className="cursor-pointer"
                             />
                         </div>

                         <div className="flex items-center justify-between">
                             <Label className="text-xs text-gray-400">Minimap</Label>
                             <Switch 
                                 checked={editorOptions.minimap}
                                 onCheckedChange={(checked) => setEditorOptions(prev => ({ ...prev, minimap: checked }))}
                             />
                         </div>
                         
                         <div className="flex items-center justify-between">
                             <Label className="text-xs text-gray-400">Word Wrap</Label>
                             <Switch 
                                 checked={editorOptions.wordWrap === 'on'}
                                 onCheckedChange={(checked) => setEditorOptions(prev => ({ ...prev, wordWrap: checked ? 'on' : 'off' }))}
                             />
                         </div>
                         
                         <div className="flex items-center justify-between">
                             <Label className="text-xs text-gray-400">Line Numbers</Label>
                             <Switch 
                                 checked={editorOptions.lineNumbers === 'on'}
                                 onCheckedChange={(checked) => setEditorOptions(prev => ({ ...prev, lineNumbers: checked ? 'on' : 'off' }))}
                             />
                         </div>
                     </div>
                 </PopoverContent>
             </Popover>
           </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 p-3 min-h-0 bg-[#0d1117]">
        <div className="h-full grid grid-cols-12 gap-3">
          
          {/* LEFT PANEL: AI Chat (30%) */}
          <div className="col-span-12 lg:col-span-3 flex flex-col bg-[#161b22] rounded-xl border border-[#30363d] overflow-hidden shadow-xl">
             <div className="h-10 bg-[#0d1117]/50 flex items-center px-4 border-b border-[#30363d] backdrop-blur-sm justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-400" /> AI Assistant
                </span>
             </div>

             <div className="flex-1 overflow-hidden relative">
                <ScrollArea className="h-full p-4" ref={scrollRef}>
                    <div className="space-y-4">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'assistant' ? 'bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/30' : 'bg-gray-700 text-gray-300'}`}>
                                    {m.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                </div>
                                <div className={`px-3 py-2 rounded-lg text-sm max-w-[85%] ${
                                    m.role === 'user' 
                                        ? 'bg-indigo-600 text-white' 
                                        : 'bg-[#21262d] text-gray-300 border border-[#30363d]'
                                }`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/30 flex items-center justify-center shrink-0">
                                     <Bot className="w-5 h-5" />
                                </div>
                                <div className="bg-[#21262d] border border-[#30363d] px-3 py-2 rounded-lg flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-75"></span>
                                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-150"></span>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
             </div>

             <div className="p-3 bg-[#0d1117] border-t border-[#30363d]">
                <div className="relative">
                    <Input 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about your code..."
                        className="bg-[#21262d] border-[#30363d] text-sm pr-10 focus-visible:ring-indigo-500"
                    />
                    <Button 
                        size="icon" 
                        className="absolute right-1 top-1 h-7 w-7 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20"
                        variant="ghost"
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
             </div>
          </div>

          {/* MIDDLE PANEL: Code Editor (6/12) */}
          <div className="col-span-12 lg:col-span-6 flex flex-col bg-[#161b22] rounded-xl border border-[#30363d] overflow-hidden relative shadow-xl ring-1 ring-white/5">
             {/* Editor Header */}
             <div className="h-10 bg-[#0d1117]/80 flex items-center justify-between px-4 border-b border-[#30363d] backdrop-blur-md">
                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-2">
                        <Select value={language} onValueChange={(v: Language) => handleLanguageChange(v)}>
                          <SelectTrigger className="h-7 w-[130px] bg-[#21262d] border-[#30363d] text-xs font-medium text-gray-200 focus:ring-0 focus:ring-offset-0">
                            <SelectValue placeholder="Language" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#161b22] border-[#30363d] text-gray-200">
                            <SelectItem value="javascript">JavaScript</SelectItem>
                            <SelectItem value="python">Python</SelectItem>
                            <SelectItem value="bash">Bash</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{FILE_NAMES[language]}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                </div>
             </div>
             
             {/* Editor Canvas */}
             <div className="flex-1 relative group bg-[#1e1e1e]">
                <Editor
                  height="100%"
                  defaultLanguage="python"
                  language={language}
                  path={FILE_NAMES[language]}
                  theme="vs-dark"
                  value={code}
                  onChange={(value) => setCode(value || "")}
                  options={{
                    minimap: { enabled: editorOptions.minimap },
                    fontSize: editorOptions.fontSize,
                    lineNumbers: editorOptions.lineNumbers,
                    wordWrap: editorOptions.wordWrap,
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    readOnly: false,
                    automaticLayout: true,
                    renderValidationDecorations: 'off',
                    fontFamily: 'monospace',
                    padding: { top: 16 },
                  }}
                />
             </div>
             
             {/* Floating Run Button */}
             <div className="absolute bottom-6 right-6 z-20">
                 <Button 
                    size="sm"
                    onClick={handleRun}
                    disabled={isRunning}
                    className="h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-[0_4px_20px_rgba(37,99,235,0.4)] font-bold text-xs px-6 rounded-full transition-all hover:scale-105 active:scale-95"
                 >
                    {isRunning ? (
                      <Cpu className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2 fill-current" />
                    )}
                    Run Code
                 </Button>
             </div>
          </div>

          {/* RIGHT PANEL: Output (3/12) */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-3 h-full">
             <div className="flex-1 flex flex-col bg-[#161b22] rounded-xl border border-[#30363d] overflow-hidden shadow-xl">
                 <div className="h-10 bg-[#0d1117]/80 flex items-center px-4 border-b border-[#30363d] justify-between backdrop-blur-sm">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Terminal className="h-4 w-4 text-gray-500" /> Console
                    </span>
                    <div className="flex gap-1.5">
                         <div className="w-2.5 h-2.5 rounded-full bg-[#fa7970] opacity-50 hover:opacity-100 transition-opacity"></div>
                         <div className="w-2.5 h-2.5 rounded-full bg-[#faa356] opacity-50 hover:opacity-100 transition-opacity"></div>
                         <div className="w-2.5 h-2.5 rounded-full bg-[#7ce38b] opacity-50 hover:opacity-100 transition-opacity"></div>
                    </div>
                 </div>

                 <ScrollArea className="flex-1 p-4 font-mono text-xs bg-[#0d1117]">
                    {output ? (
                        <div className="whitespace-pre-wrap text-gray-300">
                            {output}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-3">
                            <div className="h-12 w-12 rounded-xl bg-[#21262d] flex items-center justify-center shadow-lg border border-[#30363d] group-hover:border-blue-500/50 transition-colors">
                                <Play className="h-6 w-6 fill-current text-gray-500" />
                            </div>
                            <p className="text-center text-xs font-medium">Run code to see output</p>
                        </div>
                    )}
                 </ScrollArea>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Playground;
