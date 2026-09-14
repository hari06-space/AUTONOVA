const fs = require('fs');
const file = 'd:/Workspace/20260523/Autonoma_ERP/autonoma-frontend/src/views/dashboard/UserTaskQueue/index.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const isDark = isDark;/g, "const isDark = theme.palette.mode === 'dark';");

// Since the whole useColorScheme thing failed due to styled components not propagating it right,
// let's wrap the PageRoot inside a ThemeProvider to force dark mode globally in this component.
// First, add the import
if (!content.includes("ThemeProvider, createTheme")) {
  content = content.replace(
    /import { styled, alpha, keyframes, useColorScheme } from '@mui\/material\/styles';/,
    "import { styled, alpha, keyframes, useColorScheme, ThemeProvider, createTheme } from '@mui/material/styles';"
  );
}

// Next, add the theme wrapping logic in UserTaskQueue
content = content.replace(
  /export default function UserTaskQueue\(\) \{\s*const theme = useTheme\(\);\s*const \{ mode \} = useColorScheme\(\);\s*const isDark = mode === 'dark';/,
  "export default function UserTaskQueue() {\n  const baseTheme = useTheme();\n  const { mode } = useColorScheme();\n  const isDark = mode === 'dark';\n  const theme = React.useMemo(() => createTheme({\n    ...baseTheme,\n    palette: { ...baseTheme.palette, mode: mode || 'light' }\n  }), [baseTheme, mode]);"
);

// Then wrap the root element with ThemeProvider
content = content.replace(
  /<PageRoot isDark=\{isDark\}>/,
  "<ThemeProvider theme={theme}>\n      <PageRoot isDark={isDark}>"
);
content = content.replace(
  /<\/PageRoot>/,
  "    </PageRoot>\n    </ThemeProvider>"
);

fs.writeFileSync(file, content);
console.log('Fixed UserTaskQueue!');
