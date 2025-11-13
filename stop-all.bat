@echo off
echo ========================================
echo   DeepDive Engine - 停止所有服务
echo ========================================
echo.

echo [1/2] 停止应用服务...
echo 正在关闭 Node.js 和 Python 进程...

REM 停止前端服务
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo 停止前端服务 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
    echo 停止前端服务 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3002" ^| findstr "LISTENING"') do (
    echo 停止前端服务 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3003" ^| findstr "LISTENING"') do (
    echo 停止前端服务 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

REM 停止后端服务
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":4000" ^| findstr "LISTENING"') do (
    echo 停止后端服务 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

REM 停止AI服务
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000" ^| findstr "LISTENING"') do (
    echo 停止AI服务 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo [2/2] 停止数据库服务...
cd /d "%~dp0"
docker-compose down

echo.
echo ========================================
echo   所有服务已停止
echo ========================================
echo.
pause
