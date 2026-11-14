@echo off
setlocal
title ADV 3D scene preview
cd /d "%~dp0"

where py >nul 2>nul
if %errorlevel%==0 (
  py -3 serve.py
  goto :done
)

where python >nul 2>nul
if %errorlevel%==0 (
  python serve.py
  goto :done
)

echo Python 3 was not found.
echo Install Python 3, or run: npx serve . -l 8123
pause

:done
endlocal
