@echo off
setlocal
set PORT=5173
echo.
echo Starting dev server on http://localhost:%PORT%
echo (This serves files so the site can load design/design-system.json)
echo.

where py >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:%PORT%
  py -m http.server %PORT%
  goto :eof
)

where python >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:%PORT%
  python -m http.server %PORT%
  goto :eof
)

where npx >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:%PORT%
  npx --yes serve -l %PORT% --single .
  goto :eof
)

echo Neither Python nor Node (npx) found.
echo Please install Python from https://www.python.org/ or Node.js from https://nodejs.org/ and try again.
pause


