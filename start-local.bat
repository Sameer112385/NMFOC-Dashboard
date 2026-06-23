@echo off
setlocal EnableExtensions

cd /d "%~dp0"

echo Starting Cost-to-Cost Revenue Dashboard...
echo.
echo This launcher runs one local development server.
echo Code changes will load without rebuilding the production release.

set "NODE_EXE="
set "NPM_CMD="

for /f "delims=" %%I in ('dir /s /b "node.exe" 2^>nul') do (
  if not defined NODE_EXE set "NODE_EXE=%%I"
)

for /f "delims=" %%I in ('dir /s /b "npm.cmd" 2^>nul') do (
  if not defined NPM_CMD set "NPM_CMD=%%I"
)

if not defined NODE_EXE (
  echo.
  echo Could not find node.exe anywhere in this project folder.
  pause
  exit /b 1
)

if not defined NPM_CMD (
  echo.
  echo Could not find npm.cmd anywhere in this project folder.
  pause
  exit /b 1
)

for %%I in ("%NODE_EXE%") do set "NODE_DIR=%%~dpI"
for %%I in ("%NPM_CMD%") do set "NPM_DIR=%%~dpI"

echo Found node:
echo %NODE_EXE%
echo Found npm:
echo %NPM_CMD%

if not exist .env.local (
  echo.
  echo .env.local was not found.
  echo Copying .env.example to .env.local as a starter file...
  copy /y .env.example .env.local >nul
)

if not exist node_modules (
  echo.
  echo Installing dependencies with portable npm...
  call "%NPM_CMD%" install
  if errorlevel 1 (
    echo.
    echo Dependency installation failed.
    pause
    exit /b 1
  )
)

echo.
echo Cleaning up ports 3000 and 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r /c:":3000 *LISTENING"') do (
  echo Killing process %%a using port 3000...
  taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r /c:":3001 *LISTENING"') do (
  echo Killing process %%a using port 3001...
  taskkill /f /pid %%a >nul 2>&1
)

echo.
echo Starting the Next.js local development server in this window.
echo Keep this window open to see any errors.
echo.

start "" /b "%ComSpec%" /c "timeout /t 8 /nobreak >nul && start http://localhost:3000"

set "PATH=%NODE_DIR%;%NPM_DIR%;%PATH%"
call "%NPM_CMD%" run dev

echo.
echo The local development server stopped.
pause
