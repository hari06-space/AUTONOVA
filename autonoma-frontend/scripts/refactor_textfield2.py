import os
import re

target_dir = r"d:\Workspace\BOSs\20260601\Autonoma_ERP\autonoma-frontend\src"

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except:
        return False

    if "import TextField from 'ui-component/CustomTextField'" in content:
        return False

    modified = False
    
    # 1. match: import TextField from '@mui/material/TextField';
    if re.search(r"import\s+TextField\s+from\s+['\"]@mui/material/TextField['\"];?", content):
        content = re.sub(r"import\s+TextField\s+from\s+['\"]@mui/material/TextField['\"];?", "", content)
        modified = True

    # 2. match: import { TextField } from '@mui/material';
    if re.search(r"import\s*\{\s*TextField\s*\}\s*from\s+['\"]@mui/material['\"];?", content):
        content = re.sub(r"import\s*\{\s*TextField\s*\}\s*from\s+['\"]@mui/material['\"];?", "", content)
        modified = True

    if modified:
        content = "import TextField from 'ui-component/CustomTextField';\n" + content
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
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
