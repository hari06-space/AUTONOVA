import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, Select, MenuItem, FormControl } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ReactApexChart from 'react-apexcharts';

export default function DemandTrendChart({ demandTrends = [] }) {
  const theme = useTheme();
  const [period, setPeriod] = useState('6M');

  const categories = demandTrends.map((d) => d.month || '');
  const data = demandTrends.map((d) => Number(d.actualDemand) || 0);

  const chartOptions = {
    chart: {
      type: 'area',
      height: 160,
      fontFamily: 'Inter, sans-serif',
      toolbar: { show: false },
      sparkline: { enabled: false }
    },
    colors: ['#1e88e5'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 95, 100]
      }
    },
    stroke: {
      curve: 'smooth',
      width: 2.5
    },
    markers: {
      size: 4,
      colors: ['#1e88e5'],
      strokeColors: '#fff',
      strokeWidth: 2,
      hover: { size: 6 }
    },
    grid: {
      borderColor: theme.palette.divider,
      strokeDashArray: 3,
      padding: { top: 0, right: 10, bottom: 0, left: 10 }
    },
    xaxis: {
      categories: categories.length > 0 ? categories : ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
      labels: {
        style: {
          colors: theme.palette.text.secondary,
          fontSize: '10px',
          fontWeight: 600
        }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        style: {
          colors: theme.palette.text.secondary,
          fontSize: '10px'
        },
        formatter: (val) => `${(val / 1000).toFixed(val >= 1000 ? 1 : 0)}K`
      }
    },
    tooltip: {
      theme: theme.palette.mode,
      y: {
        formatter: (val) => `${val.toLocaleString('en-IN')} NOS`
      }
    }
  };

  const series = [
    {
      name: 'Actual Demand',
      data: data.length > 0 ? data : [420, 680, 850, 1100, 1420, 1850]
    }
  ];

  return (
    <Card className="p360-card" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 1.5, pb: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
            Demand Trend
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
            (NOS)
          </Typography>
        </Box>
        <FormControl size="small">
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            sx={{
              fontSize: '0.72rem',
              height: 24,
              borderRadius: '6px',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'
            }}
          >
            <MenuItem value="6M" sx={{ fontSize: '0.75rem' }}>Last 6 Months</MenuItem>
            <MenuItem value="12M" sx={{ fontSize: '0.75rem' }}>Last 12 Months</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <CardContent sx={{ p: 1, pt: 0, flexGrow: 1 }}>
        <Box sx={{ height: 160 }}>
          <ReactApexChart options={chartOptions} series={series} type="area" height={160} />
        </Box>
      </CardContent>
    </Card>
  );
}
