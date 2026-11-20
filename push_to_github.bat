@echo off
echo ========================================================
echo    Ohana Charging Play (OCP) - GitHub Uploader
echo ========================================================
echo.
echo Target Repository: https://github.com/appJIN/ohana-charging-play.git
echo.
echo 1. Ensure you have created the repository 'ohana-charging-play' on github.com/new
echo 2. Pushing main branch...
echo.

git push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo    SUCCESS! Pushed to https://github.com/appJIN/ohana-charging-play
    echo ========================================================
    echo.
    echo Next Steps:
    echo 1. Go to https://github.com/appJIN/ohana-charging-play/settings/pages
    echo 2. Under 'Branch', select 'main' and '/ (root)', then click Save.
    echo 3. Your iPhone link will be: https://appjin.github.io/ohana-charging-play/
    echo.
) else (
    echo.
    echo [ERROR] Push failed. Make sure:
    echo - You created 'ohana-charging-play' repo on github.com/new
    echo - You have write access to account appJIN
)
pause
