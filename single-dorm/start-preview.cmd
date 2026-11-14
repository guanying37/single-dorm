@echo off
setlocal
cd /d "%~dp0"
title single-dorm preview

where py >nul 2>nul
if %errorlevel%==0 (
  py -3 serve.py
  goto :end
)

where python >nul 2>nul
if %errorlevel%==0 (
  python serve.py
  goto :end
)

echo.
echo Python 3 was not found.
echo Install Python 3 and run this file again, or serve this folder with:
echo    python -m http.server 8123 --bind 127.0.0.1
echo.
pause

:end
endlocal
