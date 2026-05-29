"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { 
  Play, Folder, File, Terminal, CheckCircle2, AlertTriangle, 
  Loader2, ArrowLeft, Github, Globe, RefreshCw, Send, ChevronRight, Eye 
} from "lucide-react";

interface Step {
  step_number: number;
  title: string;
  description: string;
  status: string;
}

interface LogLine {
  log_type: string;
  message: string;
  timestamp: string;
}

export default function WorkspacePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  
  const isMock = id.startsWith("mock-");
  const queryName = searchParams.get("name") || "SaaS Stripe Integration";
  const queryPrompt = searchParams.get("prompt") || "Build SaaS subscriptions dashboard using NextJS and Tailwind.";

  // Project state
  const [name, setName] = useState(queryName);
  const [prompt, setPrompt] = useState(queryPrompt);
  const [status, setStatus] = useState("PENDING");
  const [repoUrl, setRepoUrl] = useState("");
  const [deployUrl, setDeployUrl] = useState("");
  const [steps, setSteps] = useState<Step[]>([]);
  
  // Terminal logs state
  const [logs, setLogs] = useState<LogLine[]>([]);
  
  // Files explorer state
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const [loadingFile, setLoadingFile] = useState(false);

  // Chat panel state
  const [chatMessage, setChatMessage] = useState("");
  const [chatLog, setChatLog] = useState<{ sender: "user" | "ai"; msg: string }[]>([
    { sender: "ai", msg: "Hello! I am preparing the remote Docker workspace workspace. Enter instructions here to modify code." }
  ]);

  // UI Tabs: 'steps' or 'chat'
  const [activeTab, setActiveTab] = useState<"steps" | "chat">("steps");

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Scroll terminal logs automatically
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Connect WebSockets or launch Client simulation
  useEffect(() => {
    if (isMock) {
      runClientSimulation();
    } else {
      connectWebSocket();
      fetchProjectDetails();
    }
  }, [id]);

  // 1. Production API fetch
  const fetchProjectDetails = async () => {
    try {
      const res = await fetch(`http://localhost:8000/projects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setName(data.name);
        setPrompt(data.prompt);
        setStatus(data.status);
        setRepoUrl(data.repository_url || "");
        setDeployUrl(data.deployment_url || "");
        setSteps(data.steps || []);
      }
    } catch (e) {
      console.error("Could not fetch project workspace metadata");
    }
  };

  const fetchFilesList = async () => {
    try {
      const res = await fetch(`http://localhost:8000/projects/${id}/files`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (e) {
      console.error("Could not fetch workspace files");
    }
  };

  const fetchSingleFileContent = async (path: string) => {
    setLoadingFile(true);
    try {
      const res = await fetch(`http://localhost:8000/projects/${id}/file?path=${encodeURIComponent(path)}`);
      if (res.ok) {
        const data = await res.json();
        setFileContent(data.content || "");
        setSelectedFile(path);
      }
    } catch (e) {
      console.error("Could not read file contents");
    } finally {
      setLoadingFile(false);
    }
  };

  // 2. High performance WebSockets logs connector
  const connectWebSocket = () => {
    const ws = new WebSocket(`ws://localhost:8000/projects/${id}/logs`);
    
    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      
      if (payload.event === "log") {
        setLogs(prev => [...prev, payload.data]);
      } else if (payload.event === "status") {
        setStatus(payload.data.project_status);
        setRepoUrl(payload.data.repository_url || "");
        setDeployUrl(payload.data.deployment_url || "");
        setSteps(payload.data.steps || []);
        // Trigger file refresh when step completes or builds
        fetchFilesList();
      } else if (payload.event === "finished") {
        setStatus(payload.data.status);
        fetchFilesList();
      }
    };

    ws.onclose = () => {
      console.log("Staging server WebSocket logs closed.");
    };

    return () => ws.close();
  };

  // 3. Futuristic client-side simulation workspace
  const runClientSimulation = () => {
    setStatus("PLANNING");
    
    const mockSteps = [
      { step_number: 1, title: "Configure Project Environment", description: "Initialize package.json and NextJS settings.", status: "PENDING" },
      { step_number: 2, title: "Design CSS Stylesheets", description: "Inject global scrollbars and glass themes.", status: "PENDING" },
      { step_number: 3, title: "Create Responsive Web Landing Page", description: "Build Home layouts.", status: "PENDING" },
      { step_number: 4, title: "Assemble Staging Dashboard Panels", description: "Construct metric analytics grid tables.", status: "PENDING" },
      { step_number: 5, title: "Package Bundles Compilation", description: "Verify TypeScript checks.", status: "PENDING" }
    ];
    setSteps(mockSteps);

    const logsTimeline = [
      { type: "INFO", msg: "Creating isolated Staging Container sandbox space...", delay: 500 },
      { type: "AI_THOUGHT", msg: "Analyzing project prompt: 'Create SaaS platform dashboard'", delay: 1500 },
      
      // Step 1
      { type: "INFO", msg: "Executing step 1: Configure environment packages...", delay: 2500, stepIdx: 0, stepStatus: "ACTIVE" },
      { type: "STDOUT", msg: "Writing package.json configuration details.", delay: 3500, file: "package.json", content: '{\n  "name": "ai-saas-dashboard",\n  "version": "0.1.0",\n  "private": true,\n  "scripts": {\n    "dev": "next dev",\n    "build": "next build"\n  },\n  "dependencies": {\n    "react": "^18.3.1",\n    "react-dom": "^18.3.1",\n    "next": "14.2.3",\n    "lucide-react": "^0.379.0"\n  }\n}' },
      { type: "STDOUT", msg: "Writing NextJS compiler target configurations tsconfig.json.", delay: 4500, file: "tsconfig.json", content: '{\n  "compilerOptions": {\n    "target": "es5",\n    "lib": ["dom", "dom.iterable", "esnext"],\n    "strict": true,\n    "paths": {\n      "@/*": ["./*"]\n    }\n  }\n}' },
      { type: "INFO", msg: "Step 1 completed successfully.", delay: 5500, stepIdx: 0, stepStatus: "COMPLETED" },
      
      // Step 2
      { type: "INFO", msg: "Executing step 2: Global design system CSS themes...", delay: 6500, stepIdx: 1, stepStatus: "ACTIVE" },
      { type: "AI_THOUGHT", msg: "Designing custom newly available browser scrollbars and glass backdrop overlays.", delay: 7500 },
      { type: "STDOUT", msg: "Writing global rules stylesheet app/globals.css.", delay: 8500, file: "app/globals.css", content: ':root {\n  --background: #090d16;\n  --foreground: #f8fafc;\n  --accent: #6366f1;\n}\n\nbody {\n  background-color: var(--background);\n  color: var(--foreground);\n}\n\n/* Custom scrollbar rules */\n* {\n  scrollbar-width: thin;\n  scrollbar-color: rgba(255,255,255,0.08) transparent;\n}' },
      { type: "INFO", msg: "Step 2 completed successfully.", delay: 9500, stepIdx: 1, stepStatus: "COMPLETED" },
      
      // Step 3
      { type: "INFO", msg: "Executing step 3: Build Authenticated Landing Webpage...", delay: 10500, stepIdx: 2, stepStatus: "ACTIVE" },
      { type: "AI_THOUGHT", msg: "Coding homepage with neon glowing layouts and redirect action cards.", delay: 11500 },
      { type: "STDOUT", msg: "Writing core landing screen layouts inside app/page.tsx.", delay: 12500, file: "app/page.tsx", content: 'import React from "react";\n\nexport default function Home() {\n  return (\n    <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center p-8">\n      <h1 className="text-5xl font-extrabold text-white">SaaS Cloud Dashboard</h1>\n      <p className="text-slate-400 mt-4">Staged live by AI Agent.</p>\n    </div>\n  );\n}' },
      { type: "INFO", msg: "Step 3 completed successfully.", delay: 13500, stepIdx: 2, stepStatus: "COMPLETED" },
      
      // Step 4
      { type: "INFO", msg: "Executing step 4: User & Admin Dashboard metrics widgets...", delay: 14500, stepIdx: 3, stepStatus: "ACTIVE" },
      { type: "STDOUT", msg: "Writing dashboard navigation panel dashboard/page.tsx.", delay: 16000, file: "app/dashboard/page.tsx", content: 'import React from "react";\n\nexport default function Dashboard() {\n  return (\n    <div className="p-10 bg-[#090d16] text-white min-h-screen">\n      <h2 className="text-3xl font-bold">Admin metrics overview</h2>\n    </div>\n  );\n}' },
      { type: "INFO", msg: "Step 4 completed successfully.", delay: 17500, stepIdx: 3, stepStatus: "COMPLETED" },
      
      // Step 5
      { type: "INFO", msg: "Executing step 5: Packager bundle compilation validation...", delay: 18500, stepIdx: 4, stepStatus: "ACTIVE" },
      { type: "STDOUT", msg: "npm run build\n\n> next build\n  ▲ Next.js 14.2.3\n  - Optimizing production bundles ...\n  ✓ Staging compilation checked. Verified successfully!", delay: 20500 },
      { type: "INFO", msg: "Step 5 completed successfully.", delay: 21500, stepIdx: 4, stepStatus: "COMPLETED" },
      
      // Deployment Success
      { type: "INFO", msg: "Provisioning staging web deploy proxy pathways...", delay: 22500 },
      { type: "INFO", msg: "🎉 Build successfully complete! Server preview portals launched.", delay: 23500, done: true }
    ];

    logsTimeline.forEach((item) => {
      setTimeout(() => {
        // Append log line
        setLogs(prev => [...prev, {
          log_type: item.type,
          message: item.msg,
          timestamp: new Date().toISOString()
        }]);

        // Manage step indices
        if (item.stepIdx !== undefined && item.stepStatus) {
          setSteps(prev => {
            const next = [...prev];
            next[item.stepIdx].status = item.stepStatus;
            return next;
          });
        }

        // Add file node
        if (item.file && item.content) {
          setFiles(prev => {
            const next = [...prev];
            if (!next.includes(item.file)) {
              next.push(item.file);
            }
            return next;
          });
          // Auto select first file
          setSelectedFile(item.file);
          setFileContent(item.content);
        }

        // Finalize
        if (item.done) {
          setStatus("SUCCESS");
          setDeployUrl("http://localhost:8000/preview/" + id);
          setRepoUrl("https://github.com/developer/" + name.toLowerCase().replace(" ", "-"));
        }
      }, item.delay);
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    setChatLog(prev => [...prev, { sender: "user", msg: chatMessage }]);
    const currentInput = chatMessage;
    setChatMessage("");

    setTimeout(() => {
      setChatLog(prev => [...prev, { 
        sender: "ai", 
        msg: `Understood! I will analyze the command '${currentInput}' and apply patches inside the container workspace.` 
      }]);
    }, 1000);
  };

  return (
    <div className="h-screen bg-background text-foreground flex flex-col justify-between overflow-hidden">
      
      {/* Header element bar */}
      <header className="border-b border-white/5 bg-[#0e1320] px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex flex-col select-none">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm tracking-tight">{name}</span>
              <span className="text-[10px] tracking-wide uppercase px-1.5 py-0.5 rounded bg-white/5 text-slate-400 font-semibold leading-none">{id}</span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-sm mt-0.5">{prompt}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Main Status buttons */}
          {status === "SUCCESS" && (
            <div className="flex items-center gap-3">
              <a 
                href={repoUrl || "https://github.com"} 
                target="_blank" 
                rel="noreferrer" 
                className="px-3.5 py-1.5 text-xs font-bold bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <Github className="w-4 h-4" /> GitHub
              </a>
              
              <a 
                href={deployUrl || `/preview/${id}`} 
                target="_blank" 
                rel="noreferrer" 
                className="px-3.5 py-1.5 text-xs font-bold bg-gradient-to-r from-indigo-500 to-pink-500 rounded-lg text-white hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                <Eye className="w-4 h-4" /> Launch Preview
              </a>
            </div>
          )}

          {status === "FAILED" && (
            <span className="px-3 py-1 text-xs font-bold rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Build Failed
            </span>
          )}

          {["PENDING", "BUILDING", "PLANNING", "DEPLOYING"].includes(status) && (
            <span className="px-3 py-1 text-xs font-bold rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase flex items-center gap-2 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> {status}
            </span>
          )}
        </div>
      </header>

      {/* Main Workspace Workspace Panels Layout */}
      <div className="flex-grow flex w-full overflow-hidden">
        
        {/* Panel 1: File Explorer */}
        <aside className="w-64 border-r border-white/5 bg-[#0e1320]/60 shrink-0 flex flex-col">
          <div className="px-4 py-3 border-b border-white/5 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 select-none">
            <Folder className="w-4 h-4 text-indigo-400" /> Workspace Files
          </div>
          
          <div className="flex-grow overflow-y-auto p-2 flex flex-col gap-0.5">
            {files.length === 0 ? (
              <div className="text-slate-600 text-xs p-4 text-center select-none font-mono">
                [empty sandbox]
              </div>
            ) : (
              files.map(path => (
                <button
                  key={path}
                  onClick={() => {
                    if (isMock) {
                      // Already mock handled
                    } else {
                      fetchSingleFileContent(path);
                    }
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
                    selectedFile === path 
                      ? "bg-indigo-500/10 text-indigo-400 font-semibold" 
                      : "text-slate-400 hover:text-white hover:bg-white/[0.02]"
                  }`}
                >
                  <File className={`w-3.5 h-3.5 shrink-0 ${selectedFile === path ? "text-indigo-400" : "text-slate-500"}`} />
                  <span className="truncate">{path}</span>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Panel 2: Monaco Editor Viewer */}
        <section className="flex-grow border-r border-white/5 flex flex-col bg-[#090d16]">
          <div className="px-4 py-3 border-b border-white/5 text-xs font-mono text-slate-400 flex items-center justify-between select-none bg-[#0e1320]/30">
            <span>{selectedFile || "Select a file to inspect code"}</span>
            {selectedFile && <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded">Ready</span>}
          </div>
          
          <div className="flex-grow relative overflow-auto p-6 font-mono text-sm leading-relaxed text-indigo-200">
            {loadingFile ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              </div>
            ) : selectedFile ? (
              <pre className="m-0 leading-relaxed font-mono select-text selection:bg-indigo-500/30">
                {fileContent.split("\n").map((line, i) => (
                  <div key={i} className="flex hover:bg-white/[0.02] transition-colors py-0.5">
                    <span className="w-10 select-none text-slate-600 text-right pr-4 border-r border-white/5 shrink-0 text-xs">{i + 1}</span>
                    <span className="pl-4 text-xs font-mono text-slate-300 leading-normal">{line}</span>
                  </div>
                ))}
              </pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs font-mono select-none">
                <Code className="w-8 h-8 mb-2 text-slate-700" />
                [Waiting for agent to commit workspace changes]
              </div>
            )}
          </div>
        </section>

        {/* Panel 3: Steps tabs & chat */}
        <aside className="w-80 border-l border-white/5 bg-[#0e1320]/60 shrink-0 flex flex-col">
          {/* Tabs bar */}
          <div className="grid grid-cols-2 border-b border-white/5 text-xs font-bold tracking-wide select-none">
            <button
              onClick={() => setActiveTab("steps")}
              className={`py-3 text-center transition-all ${
                activeTab === "steps" 
                  ? "border-b-2 border-indigo-500 bg-indigo-500/[0.02] text-white" 
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Task Checklist
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`py-3 text-center transition-all ${
                activeTab === "chat" 
                  ? "border-b-2 border-indigo-500 bg-indigo-500/[0.02] text-white" 
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              AI Talk
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-4">
            
            {activeTab === "steps" && (
              <div className="flex flex-col gap-4">
                {steps.map((s, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border bg-white/[0.01] border-white/5 flex gap-3">
                    <div className="shrink-0 mt-0.5">
                      {s.status === "COMPLETED" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      {s.status === "FAILED" && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                      {s.status === "ACTIVE" && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
                      {s.status === "PENDING" && <div className="w-3.5 h-3.5 rounded-full border border-white/20"></div>}
                    </div>
                    <div className="flex flex-col select-none">
                      <div className={`text-xs font-bold ${s.status === 'COMPLETED' ? 'text-slate-400 line-through' : 'text-white'}`}>
                        Step {s.step_number}: {s.title}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">{s.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "chat" && (
              <div className="h-full flex flex-col justify-between">
                <div className="flex-grow overflow-y-auto flex flex-col gap-3 pb-4">
                  {chatLog.map((chat, i) => (
                    <div 
                      key={i} 
                      className={`p-3 rounded-xl max-w-[85%] text-xs leading-normal select-none ${
                        chat.sender === "user" 
                          ? "bg-indigo-600 text-white self-end rounded-tr-none" 
                          : "bg-white/5 border border-white/5 text-slate-300 self-start rounded-tl-none"
                      }`}
                    >
                      {chat.msg}
                    </div>
                  ))}
                </div>
                
                <form onSubmit={handleSendMessage} className="flex gap-1.5 shrink-0 pt-2 border-t border-white/5">
                  <input
                    type="text"
                    placeholder="Ask agent to add feature..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    className="glass-input flex-grow px-3 py-2 text-xs"
                  />
                  <button type="submit" className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 shrink-0">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}

          </div>
        </aside>

      </div>

      {/* Terminal logs viewer */}
      <footer className="h-48 border-t border-white/5 bg-[#0a0f1d] p-4 flex flex-col shrink-0">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wide select-none shrink-0">
          <Terminal className="w-4 h-4 text-indigo-400" /> Build Terminal logs
        </div>
        
        <div className="flex-grow overflow-y-auto font-mono text-[11px] leading-loose flex flex-col gap-0.5 select-text selection:bg-indigo-500/30">
          {logs.length === 0 ? (
            <div className="text-slate-600 italic">[Waiting for log output stream]</div>
          ) : (
            logs.map((log, i) => {
              let color = "text-slate-300";
              if (log.log_type === "STDERR") color = "text-rose-400 font-semibold";
              if (log.log_type === "STDOUT") color = "text-slate-400";
              if (log.log_type === "AI_THOUGHT") color = "text-indigo-400 italic";
              if (log.log_type === "INFO") color = "text-slate-400 font-semibold";
              
              return (
                <div key={i} className={`flex gap-3 leading-normal ${color}`}>
                  <span className="text-[10px] text-slate-600 select-none shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className="font-mono">{log.message}</span>
                </div>
              );
            })
          )}
          <div ref={terminalEndRef}></div>
        </div>
      </footer>

    </div>
  );
}
