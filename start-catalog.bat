@echo off
title 같이n가치 카탈로그
setlocal enabledelayedexpansion

set "DIR=%~dp0"
cd /d "%DIR%"

echo ================================================
echo   같이n가치 카탈로그 시스템 통합 시작
echo ================================================
echo.

:: 포트 4000 (백엔드) 체크 및 정리
echo [1/4] 백엔드 포트 확인 중...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000') do (
    if not "%%a"=="" (
        echo 포트 4000에서 기존 프로세스 PID %%a 종료 중...
        taskkill /F /PID %%a >nul 2>&1
    )
)

:: 포트 3001 (프론트엔드) 체크 및 정리
echo [2/4] 프론트엔드 포트 확인 중...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    if not "%%a"=="" (
        echo 포트 3001에서 기존 프로세스 PID %%a 종료 중...
        taskkill /F /PID %%a >nul 2>&1
    )
)

:: 백엔드 서버 실행
echo [3/4] 백엔드 서버 실행 중...
start "같이n가치_백엔드" cmd /k "title 같이n가치_백엔드 && node server.js"

:: 잠시 대기
timeout /t 3 /nobreak >nul

:: 프론트엔드 서버 실행
echo [4/4] 프론트엔드 서버 실행 중...
start "같이n가치_프론트엔드" cmd /k "title 같이n가치_프론트엔드 && npx vite"

echo.
echo ================================================
echo   시스템이 곧 시작됩니다. 잠시만 기다려주세요.
echo ================================================

:: 최종 대기 후 브라우저 열기
timeout /t 7 /nobreak >nul
start "" http://localhost:3001

exit

