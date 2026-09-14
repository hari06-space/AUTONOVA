import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ReactApexChart from 'react-apexcharts';

export default function RolSafetyGauge({ rolSafety = {} }) {
  const theme = useTheme();

  const availableStock = Number(rolSafety.availableStock || 0);
  const maxStock = Number(rolSafety.maxStock || 0);
  const rol = Number(rolSafety.rol || 0);
  const safetyStock = Number(rolSafety.safetyStock || 0);

  // Calculate percentage (clamped 0 to 100)
  const pct = maxStock > 0 ? Math.min(100, Math.max(0, Math.round((availableStock / maxStock) * 100))) : 0;

  const chartOptions = {
    chart: {
      type: 'radialBar',
      offsetY: -10,
      sparkline: { enabled: true }
    },
    plotOptions: {
      radialBar: {
        startAngle: -100,
        endAngle: 100,
        track: {
          background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          strokeWidth: '97%',
          margin: 5
        },
        dataLabels: {
          name: {
            show: true,
            fontSize: '11px',
            fontWeight: 600,
            color: theme.palette.text.secondary,
            offsetY: 20
          },
          value: {
            offsetY: -15,
            fontSize: '20px',
            fontWeight: 800,
            color: theme.palette.text.primary,
            formatter: () => `${availableStock.toLocaleString('en-IN')}`
          }
        }
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'horizontal',
        shadeIntensity: 0.5,
        gradientToColors: ['#4caf50', '#ff9800', '#f44336'],
        stops: [0, 50, 100]
      }
    },
    colors: ['#f44336'],
    labels: ['Available Stock (NOS)']
  };

  return (
    <Card className="p360-card" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 1.5, pb: 0 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
          ROL & Safety Status
        </Typography>
      </Box>
      <CardContent sx={{ p: 1, pt: 0, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ width: '100%', height: 125, mt: 1 }}>
          <ReactApexChart options={chartOptions} series={[pct]} type="radialBar" height={160} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', display: 'block', mb: 0.2 }}>
              ROL Status
            </Typography>
            <Chip
              label={rolSafety.rolStatus || 'BELOW ROL'}
              size="small"
              sx={{
                fontSize: '0.68rem',
                fontWeight: 700,
                bgcolor: 'rgba(211, 47, 47, 0.15)',
                color: '#f44336',
                border: '1px solid rgba(244, 67, 54, 0.3)'
              }}
            />
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', display: 'block', mb: 0.2 }}>
              Safety Status
            </Typography>
            <Chip
              label={rolSafety.safetyStatus || 'LOW BUFFER'}
              size="small"
              sx={{
                fontSize: '0.68rem',
                fontWeight: 700,
                bgcolor: 'rgba(237, 108, 2, 0.15)',
                color: '#ff9800',
                border: '1px solid rgba(255, 152, 0, 0.3)'
              }}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
