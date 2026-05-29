import os
import shutil
import logging
import docker
from pathlib import Path
from app.config import settings

logger = logging.getLogger("sandbox")

class SandboxService:
    def __init__(self):
        self.use_docker = True
        try:
            self.client = docker.from_env()
            # Test docker connection
            self.client.ping()
            logger.info("Successfully connected to Docker Daemon.")
        except Exception as e:
            logger.warning(f"Could not connect to Docker Daemon: {e}. Falling back to Local Filesystem Sandboxing.")
            self.use_docker = False
            self.local_workspace_root = Path(__file__).resolve().parent.parent.parent / "local_sandboxes"
            self.local_workspace_root.mkdir(parents=True, exist_ok=True)

    def _get_container_name(self, project_id: str) -> str:
        return f"auto_ide_sandbox_{project_id.replace('-', '_')}"

    def _get_local_path(self, project_id: str) -> Path:
        return self.local_workspace_root / project_id

    def start_sandbox(self, project_id: str) -> bool:
        if self.use_docker:
            container_name = self._get_container_name(project_id)
            try:
                # Check if already running
                try:
                    existing = self.client.containers.get(container_name)
                    if existing.status == "running":
                        return True
                    existing.start()
                    return True
                except docker.errors.NotFound:
                    pass

                # Build or fetch image first
                sandbox_dockerfile = Path(__file__).resolve().parent.parent / "Dockerfile.sandbox"
                image_tag = "auto-ide-sandbox:latest"
                
                # Check if image exists, if not try to build
                try:
                    self.client.images.get(image_tag)
                except docker.errors.ImageNotFound:
                    logger.info("Sandbox image not found, building...")
                    if sandbox_dockerfile.exists():
                        self.client.images.build(
                            path=str(sandbox_dockerfile.parent),
                            dockerfile="Dockerfile.sandbox",
                            tag=image_tag,
                            rm=True
                        )
                    else:
                        # Fallback if Dockerfile.sandbox doesn't exist
                        logger.warning("Dockerfile.sandbox not found. Pulling alpine as basic fallback.")
                        self.client.images.pull("node:20-alpine")
                        image_tag = "node:20-alpine"

                # Start the container (running sleep infinity)
                self.client.containers.run(
                    image=image_tag,
                    name=container_name,
                    command="sleep infinity",
                    detach=True,
                    restart_policy={"Name": "always"},
                    volumes={
                        # Create persistent mount for build files
                        f"auto_ide_vol_{project_id}": {"bind": "/workspace", "mode": "rw"}
                    }
                )
                logger.info(f"Started Docker sandbox: {container_name}")
                return True
            except Exception as e:
                logger.error(f"Failed to start Docker sandbox: {e}. Falling back to filesystem.")
                self.use_docker = False
                self.local_workspace_root = Path(__file__).resolve().parent.parent.parent / "local_sandboxes"
                self.local_workspace_root.mkdir(parents=True, exist_ok=True)
                # Run local setup
                project_dir = self._get_local_path(project_id)
                project_dir.mkdir(parents=True, exist_ok=True)
                return True
        else:
            project_dir = self._get_local_path(project_id)
            project_dir.mkdir(parents=True, exist_ok=True)
            logger.info(f"Started Local Filesystem sandbox at {project_dir}")
            return True

    def stop_sandbox(self, project_id: str) -> bool:
        if self.use_docker:
            container_name = self._get_container_name(project_id)
            try:
                container = self.client.containers.get(container_name)
                container.stop()
                container.remove()
                logger.info(f"Stopped and removed Docker sandbox: {container_name}")
                return True
            except docker.errors.NotFound:
                return True
            except Exception as e:
                logger.error(f"Error stopping Docker sandbox: {e}")
                return False
        else:
            # We don't remove files immediately for history inspection
            logger.info(f"Local sandbox {project_id} simulation stopped.")
            return True

    def write_file(self, project_id: str, relative_path: str, content: str) -> bool:
        self.start_sandbox(project_id)
        if self.use_docker:
            container_name = self._get_container_name(project_id)
            try:
                container = self.client.containers.get(container_name)
                
                # Write command inside container using a shell script or simple cat
                # Escape quotes
                escaped_content = content.replace('\\', '\\\\').replace('$', '\\$').replace('"', '\\"').replace('`', '\\`')
                
                # Ensure directory exists
                dir_path = os.path.dirname(relative_path)
                if dir_path:
                    container.exec_run(f"mkdir -p /workspace/{dir_path}", user="developer")
                
                cmd = f'cat << "EOF" > /workspace/{relative_path}\n{content}\nEOF'
                res = container.exec_run(["sh", "-c", cmd], user="developer")
                
                return res.exit_code == 0
            except Exception as e:
                logger.error(f"Docker write_file error: {e}")
                return False
        else:
            try:
                file_path = self._get_local_path(project_id) / relative_path
                file_path.parent.mkdir(parents=True, exist_ok=True)
                file_path.write_text(content, encoding="utf-8")
                return True
            except Exception as e:
                logger.error(f"Local write_file error: {e}")
                return False

    def read_file(self, project_id: str, relative_path: str) -> str:
        self.start_sandbox(project_id)
        if self.use_docker:
            container_name = self._get_container_name(project_id)
            try:
                container = self.client.containers.get(container_name)
                res = container.exec_run(f"cat /workspace/{relative_path}", user="developer")
                if res.exit_code == 0:
                    return res.output.decode("utf-8")
                return ""
            except Exception as e:
                logger.error(f"Docker read_file error: {e}")
                return ""
        else:
            try:
                file_path = self._get_local_path(project_id) / relative_path
                if file_path.exists():
                    return file_path.read_text(encoding="utf-8")
                return ""
            except Exception as e:
                logger.error(f"Local read_file error: {e}")
                return ""

    def list_files(self, project_id: str, relative_path: str = "") -> list:
        self.start_sandbox(project_id)
        if self.use_docker:
            container_name = self._get_container_name(project_id)
            try:
                container = self.client.containers.get(container_name)
                # Find all files recursively in workspace
                res = container.exec_run("find . -maxdepth 4 -not -path '*/node_modules/*' -not -path '*/.git/*'", workdir="/workspace", user="developer")
                if res.exit_code == 0:
                    output = res.output.decode("utf-8")
                    files = []
                    for line in output.split("\n"):
                        line = line.strip()
                        if line and line != ".":
                            # Strip leading ./
                            path = line[2:] if line.startswith("./") else line
                            files.append(path)
                    return sorted(files)
                return []
            except Exception as e:
                logger.error(f"Docker list_files error: {e}")
                return []
        else:
            try:
                root_path = self._get_local_path(project_id)
                files = []
                for p in root_path.glob("**/*"):
                    if "node_modules" in p.parts or ".git" in p.parts:
                        continue
                    # relative path from root
                    rel = p.relative_to(root_path)
                    files.append(str(rel))
                return sorted(files)
            except Exception as e:
                logger.error(f"Local list_files error: {e}")
                return []

    def execute_command(self, project_id: str, command: str) -> tuple:
        """Executes a command in the sandbox, returns exit_code and stdout/stderr log output."""
        self.start_sandbox(project_id)
        if self.use_docker:
            container_name = self._get_container_name(project_id)
            try:
                container = self.client.containers.get(container_name)
                logger.info(f"Executing in container {container_name}: {command}")
                
                # Execute command from /workspace
                res = container.exec_run(
                    ["sh", "-c", command],
                    workdir="/workspace",
                    user="developer"
                )
                return res.exit_code, res.output.decode("utf-8", errors="replace")
            except Exception as e:
                logger.error(f"Docker execute_command error: {e}")
                return -1, str(e)
        else:
            import subprocess
            try:
                project_dir = self._get_local_path(project_id)
                logger.info(f"Executing locally in {project_dir}: {command}")
                
                # Execute in local project directory shell
                res = subprocess.run(
                    command,
                    shell=True,
                    cwd=str(project_dir),
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    timeout=300  # 5 minutes timeout
                )
                return res.returncode, res.stdout
            except subprocess.TimeoutExpired as e:
                logger.error(f"Local command execution timed out: {e}")
                return -1, "Command execution timed out after 5 minutes."
            except Exception as e:
                logger.error(f"Local execute_command error: {e}")
                return -1, str(e)

# Singleton instance
sandbox_service = SandboxService()
