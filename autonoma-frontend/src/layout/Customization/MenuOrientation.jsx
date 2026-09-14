// Organization: Nutech
// Updated By: Nutech
// Updated At: 2026-09-04
// Description: Premium redesign — Menu orientation toggle with visual layout previews.

// material-ui
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// project imports
import { MenuOrientation } from 'config';
import useConfig from 'hooks/useConfig';

// ==============================|| CUSTOMIZATION - MENU ORIENTATION ||============================== //

function VerticalPreview({ active }) {
  return (
    <Stack direction="row" spacing={0.4} sx={{ width: '100%', height: 40 }}>
      {/* Left vertical nav */}
      <Stack spacing={0.4} sx={{ width: 16, justifyContent: 'center' }}>
        {[100, 75, 100, 60].map((h, i) => (
          <Box key={i} sx={{ height: 4, width: `${h}%`, borderRadius: 1, bgcolor: 'currentColor', opacity: 0.35 + i * 0.1 }} />
        ))}
      </Stack>
      {/* Content */}
      <Stack spacing={0.4} sx={{ flex: 1, justifyContent: 'center' }}>
        {[80, 60, 90].map((w, i) => (
          <Box key={i} sx={{ height: 3, width: `${w}%`, borderRadius: 1, bgcolor: 'currentColor', opacity: 0.2 }} />
        ))}
      </Stack>
    </Stack>
  );
}

function HorizontalPreview({ active }) {
  return (
    <Stack spacing={0.4} sx={{ width: '100%', height: 40 }}>
      {/* Top nav bar */}
      <Stack direction="row" spacing={0.4} sx={{ height: 8, alignItems: 'center' }}>
        {[30, 24, 28, 20].map((w, i) => (
          <Box key={i} sx={{ height: 5, width: w, borderRadius: 1, bgcolor: 'currentColor', opacity: 0.35 + i * 0.1 }} />
        ))}
      </Stack>
      {/* Content */}
      <Stack spacing={0.4} sx={{ flex: 1, justifyContent: 'center' }}>
        {[80, 60, 90].map((w, i) => (
          <Box key={i} sx={{ height: 3, width: `${w}%`, borderRadius: 1, bgcolor: 'currentColor', opacity: 0.2 }} />
        ))}
      </Stack>
    </Stack>
  );
}

export default function MenuOrientationPage() {
  const { state: { menuOrientation }, setField } = useConfig();
  const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL;

  const OPTIONS = [
    { value: MenuOrientation.VERTICAL,   label: 'Vertical',   desc: 'Side navigation', Preview: VerticalPreview,   color: '#9c27b0' },
    { value: MenuOrientation.HORIZONTAL, label: 'Horizontal', desc: 'Top navigation',  Preview: HorizontalPreview, color: '#9c27b0' }
  ];

  return (
    <Stack direction="row" spacing={1.5} sx={{ p: 2 }}>
      {OPTIONS.map(({ value, label, desc, Preview, color }) => {
        const active = menuOrientation === value;
        return (
          <Tooltip key={value} title={desc} placement="top">
            <Box
              onClick={() => setField('menuOrientation', value)}
              sx={{
                flex: 1,
                p: 1.5,
                borderRadius: 2.5,
                border: '2px solid',
                borderColor: active ? color : 'divider',
                bgcolor: active ? `${color}12` : 'background.default',
                color: active ? color : 'text.disabled',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { borderColor: color, transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }
              }}
            >
              <Preview active={active} />
              <Typography variant="caption" fontWeight={active ? 700 : 500} display="block" textAlign="center" mt={0.5}>
                {label}
              </Typography>
            </Box>
          </Tooltip>
        );
      })}
    </Stack>
  );
}
