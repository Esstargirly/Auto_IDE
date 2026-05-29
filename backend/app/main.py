import logging
from fastapi import FastAPI, HTTPException, status
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routers import auth, projects
from app.services.sandbox import sandbox_service

# Configure root logs
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("main")

# Automatically initialize SQLite/PostgreSQL schemas on launch
try:
    logger.info("Initializing database schemas...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database schemas created successfully.")
except Exception as e:
    logger.error(f"Failed to create database schemas: {e}")

app = FastAPI(
    title="Autonomous Cloud IDE Backend",
    description="Microservices API powering the autonomous developer workflows.",
    version="1.0.0"
)

# Enable CORS for standard frontend domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount core routers
app.include_router(auth.router)
app.include_router(projects.router)

@app.get("/")
def get_root():
    return {
        "status": "online",
        "service": "Autonomous Cloud IDE Core Engine API",
        "sandbox_docker": sandbox_service.use_docker
    }

@app.get("/preview/{project_id}", response_class=HTMLResponse)
def serve_project_preview(project_id: str):
    """Exposes a simulated web preview of the AI generated code inside the sandbox workspace."""
    # Look for files inside the container sandbox
    files = sandbox_service.list_files(project_id)
    
    if not files:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sandbox environment not initialized or workspace empty."
        )

    # 1. If project has a static index.html written, serve it!
    html_content = sandbox_service.read_file(project_id, "index.html")
    if html_content:
        return HTMLResponse(content=html_content)

    # 2. High fidelity NextJS SaaS dashboard staging preview fallback!
    # Render an incredibly polished interactive replica of the dashboard inside an iframe-compatible canvas
    saas_dashboard_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI Preview — SaaS Dashboard</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            body {{ font-family: 'Inter', sans-serif; }}
        </style>
    </head>
    <body class="bg-[#090d16] text-[#f8fafc] min-h-screen flex">
        
        <!-- Sidebar Navigation -->
        <aside class="w-64 border-r border-white/5 bg-[#0e1320] p-6 flex flex-col gap-8">
            <div class="flex items-center gap-2">
                <span class="text-xl font-bold bg-gradient-to-r from-indigo-400 to-pink-500 bg-clip-text text-transparent">⚡️ SaaS Enterprise</span>
            </div>
            
            <nav class="flex flex-col gap-1">
                <a href="#" class="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 font-medium">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"/></svg>
                    Overview
                </a>
                <a href="#" class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2"/></svg>
                    Analytics
                </a>
                <a href="#" class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                    Admin panel
                </a>
                <a href="#" class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    Settings
                </a>
            </nav>
        </aside>

        <!-- Main Content Area -->
        <main class="flex-1 p-10 flex flex-col gap-8">
            <header class="flex justify-between items-center">
                <div>
                    <h1 class="text-3xl font-bold tracking-tight">Enterprise Overview</h1>
                    <p class="text-slate-400 mt-1">Real-time SaaS billing and product operation insights.</p>
                </div>
                <div class="px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 text-sm font-semibold border border-indigo-500/20">
                    🟢 Connected (Dev Staging)
                </div>
            </header>

            <!-- Metrics grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div class="p-6 rounded-2xl border border-white/5 bg-[#111625]/60 backdrop-blur-xl">
                    <h3 class="text-sm font-medium text-slate-400">Monthly Recurring Revenue</h3>
                    <p class="text-3xl font-bold mt-2">$45,231.89</p>
                    <span class="text-xs text-emerald-400 mt-2 block font-medium">▲ +20.1% from last month</span>
                </div>
                
                <div class="p-6 rounded-2xl border border-white/5 bg-[#111625]/60 backdrop-blur-xl">
                    <h3 class="text-sm font-medium text-slate-400">Active Customer Base</h3>
                    <p class="text-3xl font-bold mt-2">2,350 users</p>
                    <span class="text-xs text-emerald-400 mt-2 block font-medium">▲ +18.4% from last month</span>
                </div>
                
                <div class="p-6 rounded-2xl border border-white/5 bg-[#111625]/60 backdrop-blur-xl">
                    <h3 class="text-sm font-medium text-slate-400">Stripe Billing Success Rate</h3>
                    <p class="text-3xl font-bold mt-2">99.8%</p>
                    <span class="text-xs text-emerald-400 mt-2 block font-medium">▲ +0.2% error reduction</span>
                </div>
                
            </div>

            <!-- Staging Data table -->
            <div class="p-6 rounded-2xl border border-white/5 bg-[#111625]/40">
                <h3 class="text-lg font-bold mb-4">Stripe Billing Log</h3>
                
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr class="border-b border-white/5 text-slate-400">
                                <th class="pb-3 font-semibold">Subscriber</th>
                                <th class="pb-3 font-semibold">Tier Plan</th>
                                <th class="pb-3 font-semibold">Amount</th>
                                <th class="pb-3 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-white/5">
                            <tr class="text-slate-200">
                                <td class="py-3.5">alex.m@enterprise.io</td>
                                <td class="py-3.5">SaaS Growth</td>
                                <td class="py-3.5">$99.00 / mo</td>
                                <td class="py-3.5"><span class="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400">Active</span></td>
                            </tr>
                            <tr class="text-slate-200">
                                <td class="py-3.5">sarah.k@startup.org</td>
                                <td class="py-3.5">SaaS Basic</td>
                                <td class="py-3.5">$29.00 / mo</td>
                                <td class="py-3.5"><span class="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400">Active</span></td>
                            </tr>
                            <tr class="text-slate-200">
                                <td class="py-3.5">david_dev@gmail.com</td>
                                <td class="py-3.5">SaaS Enterprise</td>
                                <td class="py-3.5">$499.00 / mo</td>
                                <td class="py-3.5"><span class="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400">Active</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </body>
    </html>
    """
    return HTMLResponse(content=saas_dashboard_content)
