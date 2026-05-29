import logging
import httpx
from app.config import settings
from app.services.sandbox import sandbox_service

logger = logging.getLogger("github")

class GitHubService:
    def __init__(self):
        self.token = settings.GITHUB_TOKEN
        self.enabled = bool(self.token)

    def create_repository(self, project_name: str) -> str:
        """Creates a new repository on the user's github account or mock if disabled."""
        if not self.enabled:
            mock_url = f"https://github.com/mock-user/{project_name.lower().replace(' ', '-')}"
            logger.info(f"GitHub token not configured. Simulating repo creation: {mock_url}")
            return mock_url

        headers = {
            "Authorization": f"token {self.token}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        # We first check if the token is valid by getting the user info
        try:
            with httpx.Client() as client:
                res = client.get("https://api.github.com/user", headers=headers)
                if res.status_code != 200:
                    logger.error(f"GitHub authentication error: {res.text}")
                    return ""
                
                user_info = res.json()
                username = user_info.get("login")
                
                # Create the repository
                repo_data = {
                    "name": project_name.lower().replace(" ", "-"),
                    "description": "Autonomously generated software project built by Auto IDE.",
                    "private": False,
                    "auto_init": False
                }
                
                repo_res = client.post("https://api.github.com/user/repos", headers=headers, json=repo_data)
                if repo_res.status_code == 201:
                    repo_info = repo_res.json()
                    logger.info(f"Successfully created GitHub repository: {repo_info.get('html_url')}")
                    return repo_info.get("clone_url")  # HTTPS clone URL
                elif repo_res.status_code == 422: # Repository already exists
                    logger.info(f"GitHub repository already exists: {username}/{repo_data['name']}")
                    return f"https://github.com/{(username or 'user')}/{repo_data['name']}.git"
                else:
                    logger.error(f"GitHub repository creation failed: {repo_res.text}")
                    return ""
        except Exception as e:
            logger.error(f"Error connecting to GitHub API: {e}")
            return ""

    def push_project_files(self, project_id: str, repository_url: str) -> bool:
        """Executes git init, commit, and remote push inside the sandbox container."""
        if not repository_url:
            logger.warning("No repository URL provided, skipping push.")
            return False

        if not self.enabled:
            logger.info("GitHub integration disabled. Simulating git commit & push operations in sandbox.")
            # Run git init mock commands just to build a git log inside the sandbox workspace
            sandbox_service.execute_command(project_id, "git init && git config user.name 'AI Builder' && git config user.email 'ai@auto-ide.com' && git add . && git commit -m 'Initial AI commit'")
            return True

        # Write credentials if authenticated clone URL
        # We can format the HTTPS URL to include the token for authentication
        # e.g., https://<token>@github.com/username/repo.git
        authenticated_url = repository_url
        if "github.com" in repository_url and self.token:
            authenticated_url = repository_url.replace("https://", f"https://{self.token}@")

        git_commands = [
            "git init",
            "git config user.name 'AI Agent Orchestrator'",
            "git config user.email 'agent@auto-ide.com'",
            "git branch -M main",
            "git add .",
            "git commit -m 'feat: initial autonomous application generation'",
            f"git remote add origin {authenticated_url} || git remote set-url origin {authenticated_url}",
            "git push -u origin main --force"
        ]

        logger.info(f"Starting git push workflow to: {repository_url}")
        
        # Execute commands sequentially
        for cmd in git_commands:
            exit_code, log_out = sandbox_service.execute_command(project_id, cmd)
            # We don't abort on remote add error since setting URL handles it
            if exit_code != 0 and "remote add origin" not in cmd:
                logger.error(f"Failed Git Command: '{cmd}'. Exit code: {exit_code}. Log: {log_out}")
                return False

        logger.info("Successfully pushed all code files to GitHub.")
        return True

github_service = GitHubService()
