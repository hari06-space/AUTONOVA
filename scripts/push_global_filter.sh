#!/bin/bash
set -e

echo "Creating and switching to branch 'GLOBAL_FILTER'..."
git checkout -b GLOBAL_FILTER 2>/dev/null || git checkout GLOBAL_FILTER

echo "Staging changes..."
git add -u
git add push_global_filter.bat push_global_filter.sh 2>/dev/null || true

COMMIT_MSG="$1"
if [ -z "$COMMIT_MSG" ]; then
  COMMIT_MSG="fix(global-filter): update global filters and push changes"
fi

if git diff-index --quiet HEAD --; then
  echo "No changes to commit."
else
  echo "Committing changes with message: $COMMIT_MSG"
  git commit -m "$COMMIT_MSG"
fi

echo "Pulling latest remote changes from 'GLOBAL_FILTER' (rebase)..."
git pull --rebase origin GLOBAL_FILTER 2>/dev/null || echo "No remote branch 'GLOBAL_FILTER' yet."

echo "Pushing changes to remote branch 'GLOBAL_FILTER'..."
git push origin HEAD:GLOBAL_FILTER

echo "Done!"
