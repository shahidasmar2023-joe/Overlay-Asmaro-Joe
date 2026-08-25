@echo off
title Asmaro Overlay
echo ========================================================
echo       Starting Asmaro Overlay Desktop Application...
echo ========================================================
if not exist "%USERPROFILE%\Desktop\Overlay Asmaro.lnk" (
  cscript //nologo create_desktop_shortcut.vbs
)
start "" "index.html"
