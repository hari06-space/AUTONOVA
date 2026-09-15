// Organization: AUTONOVA
// Updated By: hari06-space
// Updated At: 2026-09-04
// Description: Premium redesign — RTL/LTR toggle with visual pill buttons.

// material-ui
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// project imports
import { ThemeDirection } from 'config';
import useConfig from 'hooks/useConfig';

// assets
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';

// ==============================|| CUSTOMIZATION - LAYOUT / DIRECTION ||============================== //

const OPTIONS = [
  { value: ThemeDirection.LTR, label: 'LTR', desc: 'Left to Right', Icon: IconArrowRight, color: '#3b82f6' },
  { value: ThemeDirection.RTL, label: 'RTL', desc: 'Right to Left', Icon: IconArrowLeft, color: '#a855f7' }
];

export default function Layout() {
  const { state: { themeDirection }, setField } = useConfig();

  return (
    <Stack direction="row" spacing={1.5} sx={{ p: 2 }}>
      {OPTIONS.map(({ value, label, desc, Icon, color }) => {
        const active = themeDirection === value;
        return (
          <Tooltip key={value} title={desc} placement="top">
            <Box
              onClick={() => setField('themeDirection', value)}
              sx={{
                flex: 1,
                py: 1.5,
                px: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
                borderRadius: 2.5,
                border: '2px solid',
                borderColor: active ? color : 'divider',
                bgcolor: active ? `${color}14` : 'transparent',
                color: active ? color : 'text.secondary',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { borderColor: color, bgcolor: `${color}0a`, transform: 'translateY(-1px)', boxShadow: `0 4px 12px ${color}22` }
              }}
            >
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                <Typography variant="body2" fontWeight={active ? 700 : 500} fontSize="0.8rem">
                  {label}
                </Typography>
              </Stack>
              <Typography variant="caption" fontSize="0.65rem" color="inherit" sx={{ opacity: 0.7 }}>
                {desc}
              </Typography>
            </Box>
          </Tooltip>
        );
      })}
    </Stack>
  );
}
