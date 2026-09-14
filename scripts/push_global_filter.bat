@echo off
echo Switching to branch 'GLOBAL_FILTER'...
"C:\Program Files\Git\cmd\git.exe" checkout GLOBAL_FILTER

echo Staging changes...
"C:\Program Files\Git\cmd\git.exe" add -u
"C:\Program Files\Git\cmd\git.exe" add autonoma-backend/src/main/resources/dbscripts/20260810_V1131.0__Alter_Qms_Checklist_Master_Status_Columns_To_Bigint.sql push_global_filter.bat push_global_filter.sh

set "COMMIT_MSG=%~1"
if "%COMMIT_MSG%"=="" set "COMMIT_MSG=fix(global-filter): update global filters and push changes"

echo Committing changes...
"C:\Program Files\Git\cmd\git.exe" commit -m "%COMMIT_MSG%"

echo Pulling remote changes...
"C:\Program Files\Git\cmd\git.exe" pull --rebase origin GLOBAL_FILTER

echo Pushing to origin GLOBAL_FILTER...
"C:\Program Files\Git\cmd\git.exe" push origin HEAD:GLOBAL_FILTER

echo Done!
