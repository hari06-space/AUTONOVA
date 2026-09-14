// ==============================|| DASHBOARD - MARKET SHARE AREA CHART ||============================== //

const chartOptions = {
  chart: {
    id: 'market-share-area-chart',
    toolbar: { show: false },
    zoom: { enabled: false },
    offsetY: 0,
    background: 'transparent'
  },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 2 },
  legend: { show: false },
  grid: { show: false, padding: { left: 0, bottom: 0 } },
  yaxis: {
    min: 1,
    max: 100,
    labels: { show: false },
    axisBorder: { show: false },
    axisTicks: { show: false }
  },
  xaxis: {
    labels: { show: false },
    axisBorder: { show: false },
    axisTicks: { show: false },
    tooltip: { enabled: false }
  }
};

export default chartOptions;
