// Organization: Nutech
// Updated By: Nutech
// Updated At: 2026-09-04
// Description: Premium redesign — Font size slider with live text size preview.

// material-ui
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// project imports
import useConfig from 'hooks/useConfig';

// ==============================|| CUSTOMIZATION - FONT SIZE ||============================== //

export default function FontSize() {
  const { state: { fontSize }, setField } = useConfig();
  const currentSize = fontSize || 14;

  return (
    <Stack sx={{ px: 2, pb: 2, gap: 2 }}>
      {/* Live text preview */}
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          border: '1px dashed',
          borderColor: 'divider',
          textAlign: 'center',
          transition: 'font-size 0.2s ease'
        }}
      >
        <Typography
          sx={{
            fontSize: `${currentSize}px`,
            fontWeight: 500,
            color: 'text.primary',
            lineHeight: 1.4,
            transition: 'font-size 0.2s ease'
          }}
        >
          Run Smart - Grow Fast.
        </Typography>
        <Typography variant="caption" color="text.disabled">
          {currentSize}px — Preview
        </Typography>
      </Box>

      {/* Slider */}
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Typography variant="caption" color="text.disabled" fontWeight={600} sx={{ fontSize: '11px' }}>
          A
        </Typography>
        <Slider
          size="small"
          value={currentSize}
          onChange={(_, v) => setField('fontSize', v)}
          getAriaValueText={(v) => `${v}px`}
          valueLabelDisplay="auto"
          min={12}
          max={18}
          step={1}
          marks
          sx={{
            flex: 1,
            '& .MuiSlider-thumb': {
              width: 16,
              height: 16,
              boxShadow: '0 0 0 4px rgba(var(--mui-palette-primary-mainChannel) / 0.16)'
            },
            '& .MuiSlider-track': { borderRadius: 4 },
            '& .MuiSlider-rail': { opacity: 0.2 },
            '& .MuiSlider-mark': { width: 4, height: 4, borderRadius: '50%' }
          }}
        />
        <Typography variant="caption" color="text.disabled" fontWeight={600} sx={{ fontSize: '15px' }}>
          A
        </Typography>
      </Stack>
    </Stack>
  );
}
