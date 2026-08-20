@echo off
chcp 65001 > nul
echo =========================================================
echo PHONE STORE MANAGEMENT PRO - AUTOMATIC GITHUB PUSH & SYNC
echo =========================================================
echo.
set /p TOKEN="أدخل رمز GitHub Personal Access Token (PAT): "
if "%TOKEN%"=="" (
    echo [خطأ] لم يتم إدخال رمز التوكن.
    pause
    exit /b
)
node sync-to-github.js %TOKEN%
echo.
pause
