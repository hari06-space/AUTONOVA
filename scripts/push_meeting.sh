#!/bin/bash
echo "Creating and switching to branch 'MEETING'..."
git checkout -b MEETING 2>/dev/null || git checkout MEETING

echo "Adding changes to git..."
git add .

COMMIT_MSG="$1"
if [ -z "$COMMIT_MSG" ]; then
  COMMIT_MSG="feat(meeting): support 12h/24h time format, fix validations, handle AMENDED status, resolve SSE 429 loops, filter Assigned To/By options, and add drill-down summary popup"
fi

# Only commit if there are changes
if git diff-index --quiet HEAD --; then
  echo "No changes to commit."
else
  echo "Committing changes with message: $COMMIT_MSG"
  git commit -m "$COMMIT_MSG"
fi

echo "Pulling latest remote changes from 'MEETING' (rebase) to avoid conflicts..."
git pull --rebase origin MEETING 2>/dev/null || echo "No remote branch 'MEETING' yet."

echo "Pushing changes to remote branch 'MEETING'..."
git push origin HEAD:MEETING

echo "Done!"
