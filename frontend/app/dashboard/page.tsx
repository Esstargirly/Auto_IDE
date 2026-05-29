"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Terminal, CreditCard, ChevronRight, Plus, Loader2, LogOut, Code, Smartphone, Database, Globe, Sliders } from "lucide-react";
import { API_BASE_URL } from "../api";

interface ProjectItem {
  id: string;
  name: string;
  project_type: string;
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  
  // Auth state
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("developer@auto-ide.com");
  const [credits, setCredits] = useState(100);

  // Form states
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [projectType, setProjectType] = useState("SaaS");
  const [submitting, setSubmitting] = useState(false);

  // Projects list state
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // Fetch token and project listings
  useEffect(() => {
    const storedToken = localStorage.getItem("auto_ide_token");
    if (!storedToken) {
      // Mock mode default for testing local runs directly, or we can prompt login
      console.log("No token found. Starting in sandbox sandbox preview mode.");
    } else {
      setToken(storedToken);
      fetchUserData(storedToken);
      fetchProjects(storedToken);
    }
    
    // Default mock listings if backend is not running yet
    const timer = setTimeout(() => {
      if (projects.length === 0) {
        setProjects([
          { id: "saas-sub", name: "SaaS stripe subscriptions", project_type: "SaaS", status: "SUCCESS", created_at: new Date().toISOString() },
          { id: "ai-bot", name: "Claude integration API", project_type: "API", status: "BUILDING", created_at: new Date().toISOString() }
        ]);
        setLoadingList(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const fetchUserData = async (jwtToken: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { "Authorization": `Bearer ${jwtToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmail(data.email);
        setCredits(data.usage_credits);
      }
    } catch (e) {
      console.error("Could not fetch user metadata");
    }
  };

  const fetchProjects = async (jwtToken: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/projects`, {
        headers: { "Authorization": `Bearer ${jwtToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (e) {
      console.error("Could not fetch project history list");
    } finally {
      setLoadingList(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name,
      prompt,
      project_type: projectType
    };

    // Attempt headers with authorization token if present
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/projects`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Staging setup failed");
      }

      const data = await res.json();
      router.push(`/project/${data.id}`);
    } catch (err) {
      // Mock fallback: create mock ID and redirect to project screen to show simulation
      const mockId = "mock-" + Math.random().toString(36).substring(2, 7);
      console.warn("Backend not running. Proceeding in Simulation Workspace mode: " + mockId);
      router.push(`/project/${mockId}?prompt=${encodeURIComponent(prompt)}&name=${encodeURIComponent(name)}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auto_ide_token");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      
      {/* Dynamic Background Blurs */}
      <div className="absolute top-0 right-1/4 w-[350px] h-[350px] rounded-full bg-indigo-500/5 filter blur-[100px]"></div>

      {/* Header bar */}
      <header className="relative z-10 w-full border-b border-white/5 bg-[#0e1320] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/10 text-sm">
            A
          </Link>
          <span className="font-bold tracking-tight text-white text-base">Antigravity Console</span>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Usage credits tracker */}
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
            <CreditCard className="w-4 h-4 text-indigo-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-semibold leading-none uppercase">Usage Credits</span>
              <span className="text-xs font-bold text-white leading-tight mt-0.5">{credits} Remaining</span>
            </div>
            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden ml-1">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-pink-500" style={{ width: `${credits}%` }}></div>
            </div>
          </div>

          <div className="text-xs font-medium text-slate-400 max-w-[120px] truncate hidden md:block">
            {email}
          </div>

          <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors" title="Log Out">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main dashboard content grids */}
      <main className="relative z-10 max-w-7xl w-full mx-auto px-6 py-12 flex-grow grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left builder form Column */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-2xl font-bold tracking-tight text-white">Create New Project</h2>
            <p className="text-sm text-slate-400">Describe the system details and watch the AI agent build it.</p>
          </div>

          <form onSubmit={handleCreate} className="glass-card p-6 border border-white/8 flex flex-col gap-5">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Project Name</label>
              <input
                type="text"
                required
                placeholder="My SaaS Portal"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input px-4 py-2.5 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Project Type</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: "SaaS", icon: Code },
                  { name: "Web App", icon: Globe },
                  { name: "API", icon: Database },
                  { name: "Mobile", icon: Smartphone },
                  { name: "Landing", icon: Sliders },
                  { name: "AI App", icon: Terminal }
                ].map((type) => {
                  const Icon = type.icon;
                  const active = projectType === type.name;
                  return (
                    <button
                      key={type.name}
                      type="button"
                      onClick={() => setProjectType(type.name)}
                      className={`py-3 rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-all ${
                        active 
                          ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-400 font-bold" 
                          : "bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/5"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px] tracking-wide uppercase leading-none">{type.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">AI Agent prompt instruction</label>
              <textarea
                required
                rows={5}
                placeholder="Build me a SaaS dashboard using Next.js, Stripe subscriptions, dark mode preference, user registration, and analytics..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="glass-input px-4 py-3 text-sm leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-indigo-500 to-pink-500 hover:opacity-90 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 text-sm tracking-wide"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Building Staging Space...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Initiate Autonomous Build
                </>
              )}
            </button>

          </form>
        </section>

        {/* Right workspace history column */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-2xl font-bold tracking-tight text-white">Your Workspace Builds</h2>
            <p className="text-sm text-slate-400">Track and inspect your cloud container processes.</p>
          </div>

          <div className="glass-card flex-grow p-4 border border-white/8 min-h-[300px] flex flex-col gap-3 overflow-y-auto">
            {loadingList ? (
              <div className="flex-grow flex items-center justify-center text-slate-500 text-sm gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Fetching workspace state...
              </div>
            ) : projects.length === 0 ? (
              <div className="flex-grow flex items-center justify-center text-slate-500 text-sm">
                No builds enqueued. Use the prompt builder to start.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {projects.map((proj) => (
                  <Link
                    key={proj.id}
                    href={`/project/${proj.id}`}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all flex items-center justify-between"
                  >
                    <div className="flex flex-col gap-1 select-none">
                      <div className="font-bold text-white text-sm tracking-tight">{proj.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] tracking-wide uppercase px-1.5 py-0.5 rounded bg-white/5 text-slate-400 font-semibold leading-none">{proj.project_type}</span>
                        <span className="text-[10px] text-slate-500">{new Date(proj.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {proj.status === "SUCCESS" && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wide">Success</span>
                      )}
                      {proj.status === "FAILED" && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-wide">Failed</span>
                      )}
                      {["PENDING", "BUILDING", "PLANNING", "DEPLOYING"].includes(proj.status) && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wide animate-pulse">{proj.status}</span>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

      </main>

      <footer className="w-full text-center py-6 text-slate-600 text-xs border-t border-white/5">
        &copy; 2026 Antigravity IDE Platform Inc. Built with isolated sandbox systems.
      </footer>

    </div>
  );
}
