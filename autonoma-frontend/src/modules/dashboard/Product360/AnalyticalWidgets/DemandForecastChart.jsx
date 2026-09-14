import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, Select, MenuItem, FormControl } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ReactApexChart from 'react-apexcharts';

export default function DemandForecastChart({ forecastSummary = {} }) {
  const theme = useTheme();
  const [period, setPeriod] = useState('90D');

  const buckets = forecastSummary.buckets || [];
  const categories = buckets.map((b) => b.bucketName);
  const historicalData = buckets.map((b) => Number(b.historical) || 0);
  const forecastData = buckets.map((b) => Number(b.forecast) || 0);

  const chartOptions = {
    chart: {
      type: 'bar',
      height: 160,
      fontFamily: 'Inter, sans-serif',
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '45%',
        borderRadius: 4
      }
    },
    colors: ['#1e88e5', '#43a047'],
    dataLabels: { enabled: false },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    grid: {
      borderColor: theme.palette.divider,
      strokeDashArray: 3,
      padding: { top: 0, right: 10, bottom: 0, left: 10 }
    },
    xaxis: {
      categories: categories.length > 0 ? categories : ['0-30 Days', '31-60 Days', '61-90 Days'],
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
        formatter: (val) => val >= 1000 ? `${(val / 1000).toFixed(1)}K` : `${val}`
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '10px',
      markers: { radius: 12 },
      labels: { colors: theme.palette.text.secondary }
    },
    tooltip: {
      theme: theme.palette.mode,
      y: {
        formatter: (val) => `${Number(val).toLocaleString('en-IN')} NOS`
      }
    }
  };

  const series = [
    {
      name: 'Historical',
      data: historicalData.length > 0 ? historicalData : [0, 0, 0]
    },
    {
      name: 'Forecast',
      data: forecastData.length > 0 ? forecastData : [0, 0, 0]
    }
  ];

  return (
    <Card className="p360-card" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 1.5, pb: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
            Forecast (Demand)
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
            <MenuItem value="90D" sx={{ fontSize: '0.75rem' }}>Next 90 Days</MenuItem>
            <MenuItem value="180D" sx={{ fontSize: '0.75rem' }}>Next 180 Days</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <CardContent sx={{ p: 1, pt: 0, flexGrow: 1 }}>
        <Box sx={{ height: 160 }}>
          <ReactApexChart options={chartOptions} series={series} type="bar" height={160} />
        </Box>
      </CardContent>
    </Card>
  );
}
