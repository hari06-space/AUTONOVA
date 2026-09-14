// Organization: Nutech
// Updated By: Nutech
// Updated At: 2026-09-04
// Description: Premium redesign — Container / Fluid toggle with visual preview cards.

// material-ui
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// project imports
import useConfig from 'hooks/useConfig';

// ==============================|| CUSTOMIZATION - CONTAINER ||============================== //

const ContainerType = { CONTAINER: 'container', FLUID: 'fluid' };

const OPTIONS = [
  {
    value: ContainerType.FLUID,
    label: 'Fluid',
    desc: 'Full width',
    preview: (
      // Full-width bars
      <Stack spacing={0.5} sx={{ width: '100%', px: 0 }}>
        {[80, 80, 80].map((w, i) => (
          <Box key={i} sx={{ height: 4, width: `${w}%`, borderRadius: 1, bgcolor: 'currentColor', opacity: 0.5 + i * 0.15 }} />
        ))}
      </Stack>
    )
  },
  {
    value: ContainerType.CONTAINER,
    label: 'Boxed',
    desc: 'Max width',
    preview: (
      // Centered narrow bars
      <Stack spacing={0.5} sx={{ width: '60%', px: 0 }}>
        {[100, 100, 100].map((w, i) => (
          <Box key={i} sx={{ height: 4, width: `${w}%`, borderRadius: 1, bgcolor: 'currentColor', opacity: 0.5 + i * 0.15 }} />
        ))}
      </Stack>
    )
  }
];

export default function BoxContainer() {
  const { state: { container }, setField } = useConfig();
  const current = container ? ContainerType.CONTAINER : ContainerType.FLUID;

  return (
    <Stack direction="row" spacing={1.5} sx={{ p: 2 }}>
      {OPTIONS.map(({ value, label, desc, preview }) => {
        const active = current === value;
        return (
          <Tooltip key={value} title={desc} placement="top">
            <Box
              onClick={() => setField('container', value === ContainerType.CONTAINER)}
              sx={{
                flex: 1,
                p: 1.5,
                borderRadius: 2.5,
                border: '2px solid',
                borderColor: active ? 'primary.main' : 'divider',
                bgcolor: active ? 'primary.lighter' : 'background.default',
                color: active ? 'primary.main' : 'text.disabled',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { borderColor: 'primary.main', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }
              }}
            >
              {/* Preview */}
              <Box
                sx={{
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: value === ContainerType.CONTAINER ? 'center' : 'flex-start',
                  mb: 1,
                  px: 0.5
                }}
              >
                {preview}
              </Box>
              <Typography variant="caption" fontWeight={active ? 700 : 500} display="block" textAlign="center">
                {label}
              </Typography>
            </Box>
          </Tooltip>
        );
      })}
    </Stack>
  );
}
