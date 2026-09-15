// Organization: AUTONOVA
// Updated By: hari06-space
// Updated At: 2026-09-04
// Description: Premium redesign — Input background style toggle with real input previews.

// material-ui
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import OutlinedInput from '@mui/material/OutlinedInput';

// project imports
import useConfig from 'hooks/useConfig';

// ==============================|| CUSTOMIZATION - INPUT FILLED ||============================== //

export default function InputFilled() {
  const { state: { outlinedFilled }, setField } = useConfig();

  const OPTIONS = [
    {
      value: 'filled',
      label: 'Filled',
      desc: 'With background',
      active: outlinedFilled === true,
      preview: (
        <Box
          sx={{
            width: '100%',
            height: 28,
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'action.hover',
            display: 'flex',
            alignItems: 'center',
            px: 1
          }}
        >
          <Box sx={{ height: 3, width: '60%', borderRadius: 1, bgcolor: 'text.disabled', opacity: 0.4 }} />
        </Box>
      )
    },
    {
      value: 'outlined',
      label: 'Outlined',
      desc: 'Without background',
      active: outlinedFilled === false,
      preview: (
        <Box
          sx={{
            width: '100%',
            height: 28,
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            px: 1
          }}
        >
          <Box sx={{ height: 3, width: '60%', borderRadius: 1, bgcolor: 'text.disabled', opacity: 0.4 }} />
        </Box>
      )
    }
  ];

  return (
    <Stack direction="row" spacing={1.5} sx={{ p: 2 }}>
      {OPTIONS.map(({ value, label, desc, active, preview }) => (
        <Tooltip key={value} title={desc} placement="top">
          <Box
            onClick={() => setField('outlinedFilled', value === 'filled')}
            sx={{
              flex: 1,
              p: 1.5,
              borderRadius: 2.5,
              border: '2px solid',
              borderColor: active ? 'error.main' : 'divider',
              bgcolor: active ? 'error.lighter' : 'background.default',
              color: active ? 'error.dark' : 'text.disabled',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': { borderColor: 'error.main', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }
            }}
          >
            {preview}
            <Typography variant="caption" fontWeight={active ? 700 : 500} display="block" textAlign="center" mt={0.75}>
              {label}
            </Typography>
          </Box>
        </Tooltip>
      ))}
    </Stack>
  );
}
