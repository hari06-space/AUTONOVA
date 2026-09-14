#!/bin/bash
echo "Creating and switching to branch 'Maintenance'..."
git checkout -b Maintenance 2>/dev/null || git checkout Maintenance

echo "Adding changes to git..."
git add .

COMMIT_MSG="$1"
if [ -z "$COMMIT_MSG" ]; then
  COMMIT_MSG="feat(maintenance): integrate division select, standardize image/manual uploads with BOSFileUpload, restructure layout to prevent clipping, and align global search filters"
fi

# Only commit if there are changes
if git diff-index --quiet HEAD --; then
  echo "No changes to commit."
else
  echo "Committing changes with message: $COMMIT_MSG"
  git commit -m "$COMMIT_MSG"
fi

echo "Pulling latest remote changes from 'Maintenance' (rebase) to avoid conflicts..."
git pull --rebase origin Maintenance 2>/dev/null || echo "No remote branch 'Maintenance' yet."

echo "Pushing changes to remote branch 'Maintenance'..."
git push origin HEAD:Maintenance

echo "Done!"
