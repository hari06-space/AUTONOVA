// Organization: AUTONOVA
// Updated By: hari06-space
// Updated At: 2026-09-04
// Description: Premium redesign — Sidebar drawer toggle with visual preview.

// material-ui
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// project imports
import useConfig from 'hooks/useConfig';

// ==============================|| CUSTOMIZATION - SIDEBAR DRAWER ||============================== //

const DrawerType = { MINI: 'mini', DEFAULT: 'default' };

function SidebarPreview({ mini }) {
  return (
    <Stack direction="row" spacing={0.4} sx={{ width: '100%', height: 38 }}>
      {/* sidebar strip */}
      <Box sx={{ width: mini ? 10 : 20, borderRadius: 0.75, bgcolor: 'currentColor', opacity: 0.6, flexShrink: 0, transition: 'width 0.3s' }} />
      {/* content area */}
      <Stack spacing={0.5} sx={{ flex: 1, justifyContent: 'center', px: 0.5 }}>
        {[100, 80, 90].map((w, i) => (
          <Box key={i} sx={{ height: 3, width: `${w}%`, borderRadius: 1, bgcolor: 'currentColor', opacity: 0.25 + i * 0.1 }} />
        ))}
      </Stack>
    </Stack>
  );
}

export default function SidebarDrawer() {
  const { state: { miniDrawer }, setField } = useConfig();

  const OPTIONS = [
    { value: DrawerType.MINI, label: 'Mini', desc: 'Collapsed sidebar', mini: true },
    { value: DrawerType.DEFAULT, label: 'Default', desc: 'Full sidebar', mini: false }
  ];

  const current = miniDrawer ? DrawerType.MINI : DrawerType.DEFAULT;

  return (
    <Stack direction="row" spacing={1.5} sx={{ p: 2 }}>
      {OPTIONS.map(({ value, label, desc, mini }) => {
        const active = current === value;
        return (
          <Tooltip key={value} title={desc} placement="top">
            <Box
              onClick={() => setField('miniDrawer', value === DrawerType.MINI)}
              sx={{
                flex: 1,
                p: 1.5,
                borderRadius: 2.5,
                border: '2px solid',
                borderColor: active ? 'success.main' : 'divider',
                bgcolor: active ? 'success.lighter' : 'background.default',
                color: active ? 'success.dark' : 'text.disabled',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { borderColor: 'success.main', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }
              }}
            >
              <SidebarPreview mini={mini} />
              <Typography variant="caption" fontWeight={active ? 700 : 500} display="block" textAlign="center" mt={0.75}>
                {label}
              </Typography>
            </Box>
          </Tooltip>
        );
      })}
    </Stack>
  );
}
