@echo off
start cmd /K "cd /d %~dp0 && npm install && npm run dev"
start cmd /K "cd /d %~dp0\backend && python -m venv .venv && call .venv\Scripts\activate && pip install -r requirements.txt && python app.py"
