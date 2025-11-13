@echo off
echo ========================================
echo   DeepDive Engine - 启动所有服务
echo ========================================
echo.

REM 检查Docker是否运行
docker version >nul 2>&1
if errorlevel 1 (
    echo [错误] Docker未运行，请先启动Docker Desktop
    pause
    exit /b 1
)

echo [1/4] 启动数据库服务...
cd /d "%~dp0"
docker-compose up -d
if errorlevel 1 (
    echo [错误] 数据库服务启动失败
    pause
    exit /b 1
)

echo.
echo [2/4] 等待数据库准备就绪...
timeout /t 5 /nobreak >nul

echo.
echo [3/4] 启动后端服务 (端口 4000)...
start "DeepDive Backend" cmd /k "cd /d %~dp0backend && npm run dev"

echo.
echo [4/4] 启动AI服务 (端口 5000)...
start "DeepDive AI Service" cmd /k "cd /d %~dp0ai-service && python -m uvicorn main:app --reload --host 0.0.0.0 --port 5000"

echo.
echo [5/5] 启动前端服务 (端口 3000)...
start "DeepDive Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo   所有服务启动完成！
echo ========================================
echo.
echo 服务访问地址：
echo   前端:     http://localhost:3000
echo   后端API:  http://localhost:4000/api/v1
echo   AI服务:   http://localhost:5000/docs
echo   Neo4j:    http://localhost:7474
echo.
echo 提示：所有服务在独立的命令窗口中运行
echo       关闭对应窗口即可停止服务
echo.
pause
