// Organization: Nutech
// Updated By: Nutech
// Updated At: 2026-09-04
// Description: Premium redesign — Border radius slider with live shape preview.

// material-ui
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// project imports
import useConfig from 'hooks/useConfig';

// ==============================|| CUSTOMIZATION - BORDER RADIUS ||============================== //

export default function BorderRadius() {
  const { state: { borderRadius }, setField } = useConfig();

  return (
    <Stack sx={{ px: 2, pb: 2, gap: 2 }}>
      {/* Live shape preview */}
      <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center" sx={{ py: 1 }}>
        {[0.25, 0.5, 0.75, 1].map((scale, i) => (
          <Box
            key={i}
            sx={{
              width: 32 + i * 6,
              height: 24,
              borderRadius: `${Math.round(borderRadius * scale)}px`,
              border: '2px solid',
              borderColor: i === 3 ? 'primary.main' : 'divider',
              bgcolor: i === 3 ? 'primary.lighter' : 'transparent',
              transition: 'all 0.25s ease'
            }}
          />
        ))}
        <Typography
          variant="caption"
          fontWeight={700}
          color="primary.main"
          sx={{ minWidth: 32, textAlign: 'right' }}
        >
          {borderRadius}px
        </Typography>
      </Stack>

      {/* Slider */}
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Typography variant="caption" color="text.disabled" fontWeight={600}>4</Typography>
        <Slider
          size="small"
          value={borderRadius}
          onChange={(_, v) => setField('borderRadius', v)}
          getAriaValueText={(v) => `${v}px`}
          valueLabelDisplay="auto"
          min={4}
          max={24}
          sx={{
            flex: 1,
            '& .MuiSlider-thumb': {
              width: 16, height: 16,
              boxShadow: '0 0 0 4px rgba(var(--mui-palette-primary-mainChannel) / 0.16)'
            },
            '& .MuiSlider-track': { borderRadius: 4 },
            '& .MuiSlider-rail': { opacity: 0.2 }
          }}
        />
        <Typography variant="caption" color="text.disabled" fontWeight={600}>24</Typography>
      </Stack>
    </Stack>
  );
}
