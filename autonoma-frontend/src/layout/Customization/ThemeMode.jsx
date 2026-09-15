// Organization: AUTONOVA
// Updated By: hari06-space
// Updated At: 2026-09-04
// Description: Ultra-premium Theme Mode selector with miniature window illustrations and glowing active states.

// material-ui
import { useColorScheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// project imports
import { ThemeMode } from 'config';

// assets
import { IconSun, IconMoon, IconDeviceLaptop, IconCheck } from '@tabler/icons-react';

// ==============================|| CUSTOMIZATION - MODE ||============================== //

export default function ThemeModeLayout() {
  const { mode, setMode } = useColorScheme();

  const MODES = [
    {
      value: ThemeMode.LIGHT,
      label: 'Light',
      Icon: IconSun,
      color: '#f59e0b',
      renderPreview: (active) => (
        <Box
          sx={{
            width: '100%',
            height: 38,
            borderRadius: 1.75,
            bgcolor: '#f8fafc',
            border: '1px solid #e2e8f0',
            p: 0.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.4
          }}
        >
          <Box sx={{ height: 6, borderRadius: 0.75, bgcolor: '#e2e8f0', width: '100%' }} />
          <Stack direction="row" spacing={0.4} sx={{ flex: 1 }}>
            <Box sx={{ width: 14, borderRadius: 0.5, bgcolor: '#cbd5e1' }} />
            <Box sx={{ flex: 1, borderRadius: 0.5, bgcolor: '#f1f5f9' }} />
          </Stack>
        </Box>
      )
    },
    {
      value: ThemeMode.DARK,
      label: 'Dark',
      Icon: IconMoon,
      color: '#818cf8',
      renderPreview: (active) => (
        <Box
          sx={{
            width: '100%',
            height: 38,
            borderRadius: 1.75,
            bgcolor: '#0f172a',
            border: '1px solid #334155',
            p: 0.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.4
          }}
        >
          <Box sx={{ height: 6, borderRadius: 0.75, bgcolor: '#1e293b', width: '100%' }} />
          <Stack direction="row" spacing={0.4} sx={{ flex: 1 }}>
            <Box sx={{ width: 14, borderRadius: 0.5, bgcolor: '#334155' }} />
            <Box sx={{ flex: 1, borderRadius: 0.5, bgcolor: '#1e293b' }} />
          </Stack>
        </Box>
      )
    },
    {
      value: ThemeMode.SYSTEM,
      label: 'System',
      Icon: IconDeviceLaptop,
      color: '#14b8a6',
      renderPreview: (active) => (
        <Box
          sx={{
            width: '100%',
            height: 38,
            borderRadius: 1.75,
            border: '1px solid #94a3b8',
            overflow: 'hidden',
            display: 'flex'
          }}
        >
          {/* Light side */}
          <Box sx={{ flex: 1, bgcolor: '#f8fafc', p: 0.5, display: 'flex', flexDirection: 'column', gap: 0.4 }}>
            <Box sx={{ height: 6, borderRadius: 0.75, bgcolor: '#e2e8f0' }} />
            <Box sx={{ flex: 1, borderRadius: 0.5, bgcolor: '#cbd5e1' }} />
          </Box>
          {/* Dark side */}
          <Box sx={{ flex: 1, bgcolor: '#0f172a', p: 0.5, display: 'flex', flexDirection: 'column', gap: 0.4 }}>
            <Box sx={{ height: 6, borderRadius: 0.75, bgcolor: '#1e293b' }} />
            <Box sx={{ flex: 1, borderRadius: 0.5, bgcolor: '#334155' }} />
          </Box>
        </Box>
      )
    }
  ];

  return (
    <Stack direction="row" spacing={1.25} sx={{ p: 2 }}>
      {MODES.map(({ value, label, Icon, color, renderPreview }) => {
        const active = mode === value;
        return (
          <Tooltip key={value} title={`${label} Mode`} placement="top" arrow>
            <Box
              onClick={() => setMode(value)}
              sx={{
                flex: 1,
                position: 'relative',
                p: 1.25,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                borderRadius: 2.5,
                cursor: 'pointer',
                border: '2px solid',
                borderColor: active ? color : 'divider',
                bgcolor: active ? `${color}14` : 'background.paper',
                boxShadow: active ? `0 0 16px ${color}33` : 'none',
                transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  borderColor: color,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 16px ${color}25`
                }
              }}
            >
              {/* Active Badge */}
              {active && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    bgcolor: color,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 2px 6px ${color}66`
                  }}
                >
                  <IconCheck size={10} strokeWidth={3.5} />
                </Box>
              )}

              {/* Window Preview */}
              {renderPreview(active)}

              {/* Label Row */}
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Icon size={14} color={active ? color : 'inherit'} strokeWidth={active ? 2.5 : 1.8} />
                <Typography
                  variant="caption"
                  fontWeight={active ? 800 : 600}
                  sx={{
                    fontSize: '0.72rem',
                    letterSpacing: '0.02em',
                    color: active ? color : 'text.primary'
                  }}
                >
                  {label}
                </Typography>
              </Stack>
            </Box>
          </Tooltip>
        );
      })}
    </Stack>
  );
}
