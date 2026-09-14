@echo off
echo Creating and switching to branch 'MEETING'...
git checkout -b MEETING 2>nul || git checkout MEETING

echo Adding changes to git...
git add .

set "COMMIT_MSG=%~1"
if "%~1"=="" set "COMMIT_MSG=feat(meeting): support 12h/24h time format, fix validations, handle AMENDED status, resolve SSE 429 loops, filter Assigned To/By options, and add drill-down summary popup"

rem Only commit if there are changes
git diff-index --quiet HEAD --
if %errorlevel% neq 0 (
    echo Committing changes with message: %COMMIT_MSG%
    git commit -m "%COMMIT_MSG%"
) else (
    echo No changes to commit.
)

echo Pulling latest remote changes from 'MEETING' (rebase) to avoid conflicts...
git pull --rebase origin MEETING 2>nul || echo No remote branch 'MEETING' yet.

echo Pushing changes to remote branch 'MEETING'...
git push origin HEAD:MEETING

echo Done!
pause
