"""
Autonomous AI Revenue Recovery Agent - Unified Demo Launcher
Runs FastAPI backend on http://127.0.0.1:8000 and Vite React frontend on http://localhost:5173.
"""

import os
import subprocess
import sys
import time
from pathlib import Path


def main():
    root_dir = Path(__file__).resolve().parent
    backend_dir = root_dir / "backend"
    frontend_dir = root_dir / "frontend"

    print("=" * 70)
    print("  AI SHARK REVENUE RECOVERY AGENT (RAZORPAY BUILDATHON)")
    print("=" * 70)
    print(f"[1/2] Launching FastAPI Backend from: {backend_dir}")
    print(f"[2/2] Launching Vite+React Frontend from: {frontend_dir}")
    print("-" * 70)
    print("Dashboard URL: http://localhost:5173")
    print("API Docs:      http://127.0.0.1:8000/docs")
    print("Webhooks:      http://127.0.0.1:8000/webhook/razorpay")
    print("Simulation:    http://127.0.0.1:8000/api/simulate-batch")
    print("=" * 70)

    # Launch Backend
    backend_cmd = ["uv", "run", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"]
    backend_proc = subprocess.Popen(backend_cmd, cwd=str(backend_dir))

    # Wait 2 seconds for backend to start
    time.sleep(2)

    # Launch Frontend
    npm_exec = "npm.cmd" if sys.platform == "win32" else "npm"
    frontend_cmd = [npm_exec, "run", "dev", "--", "--host"]
    frontend_proc = subprocess.Popen(frontend_cmd, cwd=str(frontend_dir))

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\n[!] Shutting down AI Shark Agent services...")
        backend_proc.terminate()
        frontend_proc.terminate()
        sys.exit(0)


if __name__ == "__main__":
    main()
