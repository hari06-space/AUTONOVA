#!/bin/bash

# Database Migration Version Guard
# Verifies that newly added or modified migration files do not introduce duplicate version numbers.
# Legacy duplicate version numbers are listed as warnings, but won't fail the build.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DBSCRIPTS_DIR="$PROJECT_ROOT/autonoma-backend/src/main/resources/dbscripts"

echo "=================================================="
echo "🛡️  Database Migration Version Guard"
echo "=================================================="

if [ ! -d "$DBSCRIPTS_DIR" ]; then
    echo "❌ Error: dbscripts directory not found at $DBSCRIPTS_DIR"
    exit 1
fi

# Detect added/modified/untracked SQL files in git
echo "🔍 Detecting newly added/modified/untracked migration scripts..."
changed_files=$(git status --porcelain "$DBSCRIPTS_DIR" | grep -E '^(A | M|\?\?|AM)' | awk '{print $2}' | grep '\.sql$')

if [ -z "$changed_files" ]; then
    # Fallback to diffing against main/origin if no local uncommitted changes
    echo "ℹ️  No uncommitted changes in dbscripts/. Checking diff against 'main'..."
    changed_files=$(git diff --name-only main...HEAD "$DBSCRIPTS_DIR" | grep '\.sql$')
fi

# Function to check duplicates in a specific folder
check_folder_duplicates() {
    local folder_path="$1"
    local folder_desc="$2"
    
    if [ ! -d "$folder_path" ]; then
        return 0
    fi
    
    echo "🔍 Scanning $folder_desc folder for duplicate versions..."
    local all_versions
    all_versions=$(find "$folder_path" -maxdepth 1 -name "*.sql" -exec basename {} \; | grep -oE 'V[0-9]+([._][0-9]+)*' | sort)
    local all_duplicates
    all_duplicates=$(echo "$all_versions" | uniq -d)
    
    if [ -n "$all_duplicates" ]; then
        echo "⚠️  WARNING: Legacy duplicate version numbers exist in $folder_desc:"
        for dup in $all_duplicates; do
            local count
            count=$(find "$folder_path" -maxdepth 1 -name "*${dup}__*" | wc -l)
            echo "   - [$dup] is used by $count files"
        done
        echo "ℹ️  Note: These legacy duplicates are preserved to avoid breaking already-executed history."
    fi
}

# 1. Check all legacy duplicates as warnings
check_folder_duplicates "$DBSCRIPTS_DIR" "legacy (root)"
check_folder_duplicates "$DBSCRIPTS_DIR/v_next" "v_next"

# 2. Check if newly added/modified files introduce any duplicates
if [ -n "$changed_files" ]; then
    echo "🔍 Checking newly added/modified scripts..."
    echo "$changed_files" | while read -r filepath; do
        # Locate the file (git paths might be relative to project root)
        local_abs_path="$PROJECT_ROOT/$filepath"
        if [ ! -f "$local_abs_path" ]; then
            if [ -f "$filepath" ]; then
                local_abs_path="$filepath"
            else
                continue
            fi
        fi
        
        filename=$(basename "$local_abs_path")
        file_dir=$(dirname "$local_abs_path")
        
        # Determine folder description
        local folder_desc="legacy (root)"
        if [[ "$file_dir" == *"/v_next"* ]]; then
            folder_desc="v_next"
        fi
        
        # Extract version
        version=$(echo "$filename" | grep -oE 'V[0-9]+([._][0-9]+)*')
        
        if [ -n "$version" ]; then
            # Count occurrences in the same directory where the file resides
            match_count=$(find "$file_dir" -maxdepth 1 -name "*${version}__*" | wc -l)
            
            # Since the file itself is in the directory, a count of > 1 means it conflicts with another file!
            if [ "$match_count" -gt 1 ]; then
                conflict_files=$(find "$file_dir" -maxdepth 1 -name "*${version}__*" -exec basename {} \;)
                echo "❌ ERROR: New/modified script '$filename' in $folder_desc uses version [$version] which conflicts with:"
                echo "$conflict_files" | grep -v "$filename" | sed 's/^/  - /'
                if [ "$folder_desc" = "v_next" ]; then
                    echo "💡 Fix: Please use the next free version sequence in v_next and rename your script!"
                else
                    echo "💡 Fix: Please claim the next free version from NEXT_VERSION.md and rename your new script!"
                fi
                exit 1
            else
                echo "✅ Script '$filename' has a unique version [$version] in $folder_desc"
            fi
        else
            echo "⚠️  Warning: Could not extract version number from '$filename'"
        fi
    done
    
    # Capture exit code of the while subshell
    if [ ${PIPESTATUS[1]} -ne 0 ]; then
        exit 1
    fi
else
    echo "✅ No new or modified migration scripts found in your local changes or branch."
fi

echo "=================================================="
exit 0
