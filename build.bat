@echo off

start cmd /K "cd /d %~dp0 && npm run build"
