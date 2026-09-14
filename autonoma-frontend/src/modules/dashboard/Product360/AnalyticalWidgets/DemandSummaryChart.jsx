import React from 'react';
import { Card, CardContent, Typography, Box, Grid } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ReactApexChart from 'react-apexcharts';

export default function DemandSummaryChart({ demandSummary = {}, onDemandClick }) {
  const theme = useTheme();
  const uom = demandSummary.uom || 'NOS';

  const custQty = Number(demandSummary.customerOrdersQty || 0);
  const prodQty = Number(demandSummary.productionDemandQty || 0);
  const intQty = Number(demandSummary.internalDemandQty || 0);
  const otherQty = Number(demandSummary.otherDemandQty || 0);

  const totalDemand = custQty + prodQty + intQty + otherQty;

  const series = totalDemand > 0 ? [custQty, prodQty, intQty, otherQty] : [0, 0, 0, 0];

  const chartOptions = {
    chart: {
      type: 'donut',
      fontFamily: 'Inter, sans-serif',
      events: {
        dataPointSelection: (event, chartContext, config) => {
          if (onDemandClick) onDemandClick(config.dataPointIndex);
        }
      }
    },
    labels: ['Customer Orders', 'Production Demand', 'Internal Demand', 'Other Demand'],
    colors: ['#1e88e5', '#43a047', '#fb8c00', '#8e24aa'],
    legend: {
      show: false
    },
    dataLabels: {
      enabled: false
    },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '11px',
              fontWeight: 600,
              color: theme.palette.text.secondary,
              offsetY: -6
            },
            value: {
              show: true,
              fontSize: '16px',
              fontWeight: 800,
              color: theme.palette.text.primary,
              offsetY: 4,
              formatter: (val) => Number(val).toLocaleString('en-IN')
            },
            total: {
              show: true,
              label: 'Total Demand',
              fontSize: '10px',
              fontWeight: 700,
              color: theme.palette.text.secondary,
              formatter: () => `${totalDemand.toLocaleString('en-IN')} ${uom}`
            }
          }
        }
      }
    },
    tooltip: {
      theme: theme.palette.mode,
      y: {
        formatter: (val) => `${Number(val).toLocaleString('en-IN')} ${uom}`
      }
    },
    stroke: {
      colors: [theme.palette.background.paper],
      width: 2
    }
  };

  const legendItems = [
    { label: 'Customer Orders', qty: custQty, pct: ((custQty / totalDemand) * 100).toFixed(1), color: '#1e88e5' },
    { label: 'Production Demand', qty: prodQty, pct: ((prodQty / totalDemand) * 100).toFixed(1), color: '#43a047' },
    { label: 'Internal Demand', qty: intQty, pct: ((intQty / totalDemand) * 100).toFixed(1), color: '#fb8c00' },
    { label: 'Other Demand', qty: otherQty, pct: ((otherQty / totalDemand) * 100).toFixed(1), color: '#8e24aa' }
  ];

  return (
    <Card className="p360-card" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 1.5, pb: 0.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
          Demand Summary
        </Typography>
      </Box>
      <CardContent sx={{ p: 1.5, pt: 0, flexGrow: 1, display: 'flex', alignItems: 'center' }}>
        <Grid container alignItems="center" spacing={1}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ height: 160, display: 'flex', justifyContent: 'center' }}>
              <ReactApexChart options={chartOptions} series={series} type="donut" height={160} />
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
              {legendItems.map((item, idx) => (
                <Box
                  key={idx}
                  onClick={() => onDemandClick && onDemandClick(idx)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    p: 0.3,
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.72rem' }}>
                      {item.label}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.75rem' }}>
                    {item.qty.toLocaleString('en-IN')} <span style={{ opacity: 0.6, fontSize: '0.65rem' }}>({item.pct}%)</span>
                  </Typography>
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
