import os
import re

target_dir = r"d:\Workspace\BOSs\20260601\Autonoma_ERP\autonoma-frontend\src"

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return False

    # Skip if already imported
    if "import TextField from 'ui-component/CustomTextField'" in content:
        return False

    # Check if TextField is imported from @mui/material
    # Match something like: import { Grid, TextField, Button } from '@mui/material';
    pattern = r"import\s+\{([^}]*)\}\s+from\s+['\"]@mui/material['\"]"
    
    modified = False
    
    def replacer(match):
        nonlocal modified
        imports = match.group(1).split(',')
        new_imports = []
        for imp in imports:
            if imp.strip() == 'TextField':
                modified = True
            else:
                if imp.strip():
                    new_imports.append(imp.strip())
        
        if not modified:
            return match.group(0) # no change
            
        if len(new_imports) == 0:
            return "" # removed all
        else:
            return f"import {{ {', '.join(new_imports)} }} from '@mui/material'"
            
    new_content = re.sub(pattern, replacer, content)
    
    if modified:
        # Add the new import at the top
        new_content = "import TextField from 'ui-component/CustomTextField';\n" + new_content
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated: {filepath}")
        return True
    return False

updated_count = 0
for root, dirs, files in os.walk(target_dir):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            filepath = os.path.join(root, file)
            if process_file(filepath):
                updated_count += 1

print(f"Total files updated: {updated_count}")
