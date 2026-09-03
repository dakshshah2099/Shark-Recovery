@echo off
title Shark Recovery Launcher
echo ======================================================================
echo   SHARK RECOVERY - AUTONOMOUS REVENUE RECOVERY AGENT
echo ======================================================================

:: 1. Start Docker PostgreSQL container if Docker is running
echo [1/3] Ensuring PostgreSQL database container is active...
docker compose up -d postgres >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!] Notice: Docker PostgreSQL container could not be started automatically.
    echo     Please ensure Docker Desktop is running, or verify your PostgreSQL instance.
) else (
    echo [*] PostgreSQL database container ready on port 5432!
)

:: 2. Launch Backend in its own window
echo [2/3] Launching FastAPI Backend on http://127.0.0.1:8000 ...
start "Shark Recovery - Backend (FastAPI / Uvicorn)" cmd /k "cd /d %~dp0backend && uv run uvicorn main:app --reload --port 8000"

:: 3. Launch Frontend in its own window
echo [3/3] Launching Vite React Frontend on http://localhost:5173 ...
start "Shark Recovery - Frontend (Vite / React)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo ----------------------------------------------------------------------
echo Services started in separate terminal windows!
echo - Web Dashboard:  http://localhost:5173
echo - Backend API:    http://127.0.0.1:8000
echo - Swagger Docs:   http://127.0.0.1:8000/docs
echo ======================================================================
timeout /t 3 >nul
start http://localhost:5173
