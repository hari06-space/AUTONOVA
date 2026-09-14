const fs = require('fs');
const file = 'd:/Workspace/20260523/Autonoma_ERP/autonoma-frontend/src/views/dashboard/UserTaskQueue/index.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /import \{ styled, alpha, keyframes \} from '@mui\/material\/styles';/,
  "import { styled, alpha, keyframes, useColorScheme } from '@mui/material/styles';"
);

content = content.replace(
  /const PageRoot = styled\(Box\)\(\(\{ theme \}\) => \(\{/,
  "const PageRoot = styled(Box, { shouldForwardProp: (p) => p !== 'isDark' })(({ theme, isDark }) => ({"
).replace(
  /background: theme\.palette\.mode === 'dark'([^]*?)padding:/,
  "background: isDark$1padding:"
);

content = content.replace(
  /const HeroBanner = styled\(Box\)\(\(\{ theme \}\) => \(\{/,
  "const HeroBanner = styled(Box, { shouldForwardProp: (p) => p !== 'isDark' })(({ theme, isDark }) => ({"
);
content = content.replace(/theme\.palette\.mode === 'dark'/g, (match, offset, str) => {
  if (offset < content.indexOf('export default function')) {
    return 'isDark';
  }
  return match;
});

content = content.replace(
  /const StatBubble = styled\(Box\)\(\(\{ theme \}\) => \(\{/,
  "const StatBubble = styled(Box, { shouldForwardProp: (p) => p !== 'isDark' })(({ theme, isDark }) => ({"
);

content = content.replace(
  /export default function UserTaskQueue\(\) \{\s*const theme = useTheme\(\);/,
  "export default function UserTaskQueue() {\n  const theme = useTheme();\n  const { mode } = useColorScheme();\n  const isDark = mode === 'dark';"
);

content = content.replace(/<PageRoot>/g, '<PageRoot isDark={isDark}>');
content = content.replace(/<HeroBanner>/g, '<HeroBanner isDark={isDark}>');
content = content.replace(/<StatBubble/g, '<StatBubble isDark={isDark}');

content = content.replace(
  /const isDark = theme\.palette\.mode === 'dark';/g,
  "// isDark passed from props or parent"
);

content = content.replace(/theme\.palette\.mode === 'dark'/g, 'isDark');

fs.writeFileSync(file, content);
console.log('Done!');
