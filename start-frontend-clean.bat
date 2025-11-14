@echo off
cd frontend
taskkill /IM node.exe /F 2>nul
timeout /t 2 /nobreak >nul
npm run dev
