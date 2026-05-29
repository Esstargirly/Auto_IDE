import logging
import socket
import random
from app.config import settings
from app.services.sandbox import sandbox_service

logger = logging.getLogger("deployment")

class DeploymentService:
    def __init__(self):
        self.allocated_ports = set()

    def get_free_port(self) -> int:
        """Finds an unused port on the host machine to bind the project preview."""
        # Search range 4000 to 5000
        for _ in range(50):
            port = random.randint(4000, 5000)
            if port in self.allocated_ports:
                continue
            
            # Test socket binding
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            try:
                s.bind(("127.0.0.1", port))
                s.listen(1)
                s.close()
                self.allocated_ports.add(port)
                return port
            except socket.error:
                continue
        
        # Fallback random
        return random.randint(5000, 6000)

    def deploy_project(self, project_id: str) -> tuple:
        """Runs the build and serves the project within the sandbox container. 
        Returns (success: bool, url: str, port: int)
        """
        # For the MVP, we first list workspace files to see what project we have
        files = sandbox_service.list_files(project_id)
        
        if not files:
            logger.error("Workspace is empty. Cannot deploy.")
            return False, "", 0
            
        logger.info(f"Initiating deployment sequence for {project_id}")
        
        # Detect project language / framework
        is_node = any("package.json" in f for f in files)
        is_python = any("requirements.txt" in f or "main.py" in f for f in files)
        
        preview_port = self.get_free_port()
        
        if is_node:
            logger.info("Node.js project detected. Compiling bundle...")
            # Run npm install and build inside the sandbox
            # We mock some dependencies if slow or fail to avoid stalling local developer builds
            sandbox_service.execute_command(project_id, "npm install --legacy-peer-deps")
            
            # Start Next.js or standard Node web server in background
            # For the local sandbox, we run uvicorn or serve command
            # To be asynchronous and robust, we run it in background
            start_cmd = f"PORT={preview_port} npm run start"
            if any("next.config" in f for f in files):
                # If Next.js, we can also run npm run dev if build takes too long
                start_cmd = f"PORT={preview_port} nohup npm run dev > /workspace/dev_server.log 2>&1 &"
            else:
                start_cmd = f"PORT={preview_port} nohup npm start > /workspace/dev_server.log 2>&1 &"
                
            sandbox_service.execute_command(project_id, start_cmd)
            
            # Preview URL maps to either the active container host port or host loopback
            preview_url = f"{settings.BACKEND_URL}/preview/{project_id}"
            logger.info(f"Project deployed on port {preview_port}. Accessible at: {preview_url}")
            return True, preview_url, preview_port

        elif is_python:
            logger.info("Python project detected. Launching uvicorn...")
            sandbox_service.execute_command(project_id, "pip install -r requirements.txt")
            start_cmd = f"nohup uvicorn main:app --host 0.0.0.0 --port {preview_port} > /workspace/dev_server.log 2>&1 &"
            sandbox_service.execute_command(project_id, start_cmd)
            
            preview_url = f"{settings.BACKEND_URL}/preview/{project_id}"
            return True, preview_url, preview_port
            
        else:
            # Basic HTML static hosting static serve simulation
            # We just create a beautiful index.html mockup if not found
            index_exists = any("index.html" in f for f in files)
            if not index_exists:
                html_body = f"""
                <html>
                <head>
                    <title>AI Preview</title>
                    <style>body {{ font-family: sans-serif; text-align: center; margin-top: 100px; background-color: #0f172a; color: #ffffff; }}</style>
                </head>
                <body>
                    <h1>Welcome to your AI Generated App</h1>
                    <p>App ID: {project_id}</p>
                    <p>No index.html was generated yet. Keep prompting the agent to expand details!</p>
                </body>
                </html>
                """
                sandbox_service.write_file(project_id, "index.html", html_body)
            
            preview_url = f"{settings.BACKEND_URL}/preview/{project_id}"
            return True, preview_url, preview_port

    def terminate_deployment(self, project_id: str, port: int) -> bool:
        """Kills any background preview servers running on the allocated port."""
        if port in self.allocated_ports:
            self.allocated_ports.remove(port)
        # Kill command inside the sandbox that binds to port
        kill_cmd = f"pkill -f 'PORT={port}' || pkill -f 'port {port}' || true"
        sandbox_service.execute_command(project_id, kill_cmd)
        return True

deployment_service = DeploymentService()
