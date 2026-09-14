#!/bin/bash
set -e

echo "Creating and switching to branch 'darshan'..."
git checkout -b darshan 2>/dev/null || git checkout darshan

echo "Adding changes to git..."
# Stage newly created files explicitly
git add autonoma-backend/src/main/resources/dbscripts/20260721_V1043.0__Add_OAuth_Token_Columns_To_AD_OCR_CONFIG.sql
git add autonoma-backend/src/main/resources/dbscripts/20260724_V1044.0__Rename_Ocr_Tables.sql
git add autonoma-backend/email-service/src/main/java/com/nutech/email/integration/PythonMailServiceBridge.java
git add autonoma-backend/email-service/src/main/java/com/nutech/email/model/OcrConfig.java
git add autonoma-backend/email-service/src/main/java/com/nutech/email/repository/OcrConfigRepository.java
git add autonoma-backend/python-email-service/
git add autonoma-frontend/src/views/admin/OAuthCallback.jsx
git add -u # Stage all other modified tracked files

COMMIT_MSG="$1"
if [ -z "$COMMIT_MSG" ]; then
  COMMIT_MSG="feat(ocr): implement EML parsing and dynamic backend configuration over HTTP headers"
fi

# Only commit if there are changes
if git diff-index --quiet HEAD --; then
  echo "No changes to commit."
else
  echo "Committing changes with message: $COMMIT_MSG"
  git commit -m "$COMMIT_MSG"
fi

echo "Pushing changes to remote branch 'darshan'..."
git push origin HEAD:darshan

echo "Done!"
