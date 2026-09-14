import React from 'react';
import { Card, CardContent, Typography, Box, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { IconActivity, IconAlertOctagon } from '@tabler/icons-react';

export default function StockHealthCard({ stockHealth = {}, onViewDetails }) {
  const theme = useTheme();
  const isCritical = stockHealth.overallStatus === 'CRITICAL' || stockHealth.overallStatus === 'BELOW ROL';
  const isWarning = stockHealth.overallStatus === 'LOW BUFFER' || stockHealth.overallStatus === 'WARNING';
  const bgColor = isCritical ? '#b71c1c' : (isWarning ? '#e65100' : '#2e7d32');

  return (
    <Card
      className="p360-card"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: bgColor,
        color: '#ffffff',
        border: 'none !important',
        boxShadow: `0 8px 24px ${bgColor}66`
      }}
    >
      <Box sx={{ p: 1.5, pb: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#ffffff' }}>
          Stock Health
        </Typography>
        <IconAlertOctagon size={18} />
      </Box>
      <CardContent sx={{ p: 1.5, pt: 1, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: '1px', fontSize: '1.3rem', color: '#ffffff' }}>
          {stockHealth.statusTitle || stockHealth.overallStatus || 'NORMAL'}
        </Typography>

        {/* ECG Heartbeat Waveform Line */}
        <Box sx={{ my: 1, width: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="120" height="24" viewBox="0 0 120 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 12H30L36 4L44 20L52 8L58 16L64 12H120"
              stroke="rgba(255,255,255,0.8)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Box>

        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '0.75rem', mb: 1 }}>
          {stockHealth.statusMessage || 'Available stock is below ROL'}
        </Typography>

        <Button
          size="small"
          variant="contained"
          onClick={onViewDetails}
          sx={{
            bgcolor: 'rgba(255,255,255,0.2)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.72rem',
            textTransform: 'none',
            borderRadius: '6px',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
          }}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}
