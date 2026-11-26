@echo off
title IBRIDGE Server Launcher
color 0B

echo ==================================================
echo    STARTING IBRIDGE COMPUTER SALE & SERVICE
echo ==================================================
echo.

:: 1. MongoDB Local Service စစ်ဆေးပြီး ပိတ်နေပါက အလိုအလျောက် ဖွင့်ပေးခြင်း
echo [1/4] Checking Local MongoDB Service...
net start MongoDB >nul 2>&1

:: 2. Backend Server (Port 4000) ကို Terminal အသစ်ဖြင့် ဖွင့်ခြင်း
echo [2/4] Starting IBRIDGE Backend Server (Port 4000)...
start "IBRIDGE-Backend" cmd /k "cd /d D:\DOC\Food-Delivery-main\Food-Delivery-main\backend && node server.js"

:: 3. Frontend Server (Port 5173) ကို Terminal အသစ်ဖြင့် ဖွင့်ခြင်း
echo [3/4] Starting IBRIDGE Frontend Server (Port 5173)...
start "IBRIDGE-Frontend" cmd /k "cd /d D:\DOC\Food-Delivery-main\Food-Delivery-main\frontend && npm run dev"

:: 4. Microsoft Dev Tunnel (Public HTTPS Link) ကို Terminal အသစ်ဖြင့် ဖွင့်ခြင်း
echo [4/4] Starting Public Dev Tunnel (ibridge)...
start "IBRIDGE-Tunnel" cmd /k "set PATH=%PATH%;%LOCALAPPDATA%\Microsoft\WinGet\Links;%LOCALAPPDATA%\Microsoft\WinGet\Packages\Microsoft.devtunnel_Microsoft.Winget.Source_8wekyb3d8bbwe && devtunnel host ibridge"

:: ၄ စက္ကန့်စောင့်ပြီး Local နဲ့ Public Link ကို အလိုအလျောက် ဖွင့်ပေးခြင်း
timeout /t 4 /nobreak >nul
start http://localhost:5173
start https://devtunnels.ms

echo.
echo [SUCCESS] IBRIDGE System & Public Tunnel are now running!
echo Public Link: https://devtunnels.ms
pause
