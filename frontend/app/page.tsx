"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Terminal, Cpu, HardDrive, ShieldCheck, Mail, ArrowRight, Github } from "lucide-react";

export default function LandingPage() {
  const [terminalText, setTerminalText] = useState("");
  const terminalLines = [
    "antigravity-agent initialize --template nextjs",
    "✔ Creating secure docker staging container sandbox...",
    "✔ Configuring Tailwind CSS design system utilities...",
    "✔ Injecting responsive SaaS dashboard metrics charts...",
    "✔ Running typescript compilation test checks...",
    "✔ Synchronizing git commit nodes & building repository...",
    "🚀 Staging server live at: https://backend.auto-ide.com/preview/proj_72a1d",
    "🎉 Complete! Alerting developer email via Resend node..."
  ];

  useEffect(() => {
    let lineIdx = 0;
    let charIdx = 0;
    let currentOut = "";

    const typeChar = () => {
      if (lineIdx < terminalLines.length) {
        const currentLine = terminalLines[lineIdx];
        if (charIdx < currentLine.length) {
          currentOut += currentLine[charIdx];
          setTerminalText(currentOut + "\n");
          charIdx++;
          setTimeout(typeChar, 30);
        } else {
          currentOut += "\n";
          lineIdx++;
          charIdx = 0;
          setTimeout(typeChar, 500);
        }
      } else {
        // Reset loop after 3 seconds
        setTimeout(() => {
          setTerminalText("");
          lineIdx = 0;
          charIdx = 0;
          currentOut = "";
          typeChar();
        }, 3000);
      }
    };

    typeChar();
  }, []);

  return (
    <div className="min-h-screen relative flex flex-col justify-between overflow-hidden">
      
      {/* Dynamic Background Blurs */}
      <div className="absolute top-[10%] left-[20%] w-[350px] h-[350px] rounded-full bg-indigo-500/10 filter blur-[100px] animate-pulse-slow"></div>
      <div className="absolute bottom-[20%] right-[15%] w-[400px] h-[400px] rounded-full bg-pink-500/8 filter blur-[110px] animate-pulse-slow"></div>

      {/* Futuristic Navbar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            A
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Antigravity IDE
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link href="/dashboard" className="px-4 py-2 text-sm font-bold bg-white text-background rounded-lg hover:bg-white/90 transition-all shadow-md shadow-white/10 flex items-center gap-2">
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Main Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-20 flex-grow grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Right side headline info */}
        <div className="flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold self-start tracking-wide uppercase">
            ⚡️ The Cloud Autonomous Engine
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
            Build Software at the Speed of Thought.
          </h1>
          
          <p className="text-lg text-slate-400 leading-relaxed max-w-xl">
            Describe your SaaS dashboard, API service, or web application in natural language. Our autonomous agent creates files, sets up secure Docker workspaces, writes code, tests, and deploys completely in the cloud while you close your laptop.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link href="/dashboard" className="px-8 py-3.5 bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 hover:scale-[1.02] transform transition-all shadow-lg shadow-indigo-500/20 text-center flex items-center justify-center gap-2">
              Launch Agent Studio <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="https://github.com" className="px-8 py-3.5 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all text-center flex items-center justify-center gap-2">
              <Github className="w-5 h-5" /> Read Documentation
            </Link>
          </div>
        </div>

        {/* Live typing console visual */}
        <div className="w-full relative lg:h-[450px]">
          <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl filter blur-xl"></div>
          <div className="glass-card w-full h-full p-6 flex flex-col font-mono text-sm leading-relaxed border border-white/10">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              </div>
              <span className="text-xs text-slate-500">remote-worker-sandbox-01</span>
            </div>
            
            <div className="flex-grow font-mono text-indigo-300 overflow-y-auto whitespace-pre-wrap select-none leading-loose">
              {terminalText}
              <span className="animate-pulse">_</span>
            </div>
          </div>
        </div>

      </main>

      {/* Feature Grids */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12 border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0"><Terminal className="w-5 h-5" /></div>
            <div>
              <h4 className="font-bold text-white mb-1">Docker Sandboxing</h4>
              <p className="text-xs text-slate-400">Builds execute in fully isolated Alpine containers dynamically.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0"><Cpu className="w-5 h-5" /></div>
            <div>
              <h4 className="font-bold text-white mb-1">Stateful Workers</h4>
              <p className="text-xs text-slate-400">Background builds recover automatically in Postgres queues.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0"><ShieldCheck className="w-5 h-5" /></div>
            <div>
              <h4 className="font-bold text-white mb-1">Self-Healing Retries</h4>
              <p className="text-xs text-slate-400">AI automatically detects log errors and rewrites patch fixes.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0"><Mail className="w-5 h-5" /></div>
            <div>
              <h4 className="font-bold text-white mb-1">Alerting Integration</h4>
              <p className="text-xs text-slate-400">Sends rich HTML emails automatically upon deployment.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full text-center py-6 text-slate-600 text-xs tracking-wide">
        &copy; 2026 Antigravity IDE Platform Inc. Built by Google DeepMind pairings.
      </footer>

    </div>
  );
}
