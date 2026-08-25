@echo off
title Overlay Asmaro - EXE Builder
echo ========================================================
echo       Overlay Asmaro - Windows Desktop EXE Compiler
echo ========================================================
cd /d "%~dp0..\electron"
echo Installing Desktop Electron dependencies...
call npm install
echo Compiling Standalone Windows Executable (.exe)...
call npm run build:exe
echo Executable compiled successfully into dist-exe folder!
pause
