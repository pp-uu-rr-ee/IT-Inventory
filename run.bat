@echo off
start cmd /k "cd /d %~dp0backend && npm install && npm run dev"
start cmd /k "cd /d %~dp0frontend && start http://localhost:3000 && npm install && npm run dev"