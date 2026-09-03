@echo off
title Shark Recovery Launcher
echo ======================================================================
echo   SHARK RECOVERY - AUTONOMOUS REVENUE RECOVERY AGENT
echo ======================================================================
echo [1/2] Launching FastAPI Backend on http://127.0.0.1:8000 ...
start "Shark Recovery - Backend (FastAPI / Uvicorn)" cmd /k "cd /d %~dp0backend && uv run uvicorn main:app --reload --port 8000"

echo [2/2] Launching Vite React Frontend on http://localhost:5173 ...
start "Shark Recovery - Frontend (Vite / React)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo ----------------------------------------------------------------------
echo Services started in separate terminal windows!
echo - Web Dashboard:  http://localhost:5173
echo - Backend API:    http://127.0.0.1:8000
echo - Swagger Docs:   http://127.0.0.1:8000/docs
echo ======================================================================
timeout /t 3 >nul
start http://localhost:5173
