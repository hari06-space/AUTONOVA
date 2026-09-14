import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ReactApexChart from 'react-apexcharts';

export default function ProjectedStockChart({ projectedStocks = [] }) {
  const theme = useTheme();

  const categories = projectedStocks.map((p) => p.timeLabel);
  const data = projectedStocks.map((p) => Number(p.projectedStock) || 0);
  const safetyStockVal = projectedStocks.length > 0 && projectedStocks[0].safetyStock != null ? Number(projectedStocks[0].safetyStock) : 0;

  const chartOptions = {
    chart: {
      type: 'area',
      height: 160,
      fontFamily: 'Inter, sans-serif',
      toolbar: { show: false }
    },
    colors: ['#1e88e5'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.5,
        opacityTo: 0.1,
        stops: [0, 90, 100]
      }
    },
    stroke: {
      curve: 'straight',
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
      categories: categories.length > 0 ? categories : ['Today', '30 Days', '60 Days', '90 Days'],
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
        formatter: (val) => `${Number(val).toLocaleString('en-IN')}`
      }
    },
    annotations: {
      yaxis: [
        {
          y: safetyStockVal,
          borderColor: '#f44336',
          strokeDashArray: 4,
          label: {
            borderColor: '#f44336',
            style: {
              color: '#f44336',
              background: 'transparent',
              fontSize: '10px',
              fontWeight: 700
            },
            text: `Safety Stock (${safetyStockVal})`,
            position: 'left'
          }
        }
      ]
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
      name: 'Projected Stock',
      data: data.length > 0 ? data : [0, 0, 0, 0]
    }
  ];

  return (
    <Card className="p360-card" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 1.5, pb: 0 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
          Projected Stock
        </Typography>
        <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
          (NOS)
        </Typography>
      </Box>
      <CardContent sx={{ p: 1, pt: 0, flexGrow: 1 }}>
        <Box sx={{ height: 160 }}>
          <ReactApexChart options={chartOptions} series={series} type="area" height={160} />
        </Box>
      </CardContent>
    </Card>
  );
}
