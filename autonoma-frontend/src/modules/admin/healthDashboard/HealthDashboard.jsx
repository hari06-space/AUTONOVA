import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from 'hooks/useAuth';
import {
  Box,
  Grid,
  Typography,
  MenuItem,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Divider,
  useTheme,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  IconActivity,
  IconServer,
  IconCpu,
  IconCpu2,
  IconDatabase,
  IconBrandAppstore,
  IconClock,
  IconWifi,
  IconRefresh,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconTrendingUp
} from '@tabler/icons-react';
import ReactApexChart from 'react-apexcharts';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import { BOSTextField } from 'ui-component/bos';

export default function HealthDashboard() {
  const theme = useTheme();
  const { user } = useAuth();

  const [clients, setClients] = useState([]);
  const [selectedClientCode, setSelectedClientCode] = useState('');
  const [healthData, setHealthData] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch list of clients with health monitoring enabled
  const fetchClients = async () => {
    try {
      const res = await axios.get('/api/v1/client-health/clients');
      const list = res.data || [];
      setClients(list);
      if (list.length > 0 && !selectedClientCode) {
        setSelectedClientCode(list[0].clientCode);
      }
    } catch (err) {
      console.error('Failed to fetch monitoring clients:', err);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Fetch Live Health Data & Trends
  const fetchHealthData = useCallback(async (clientCode, range) => {
    if (!clientCode) return;
    setRefreshing(true);
    try {
      const res = await axios.get(`/api/v1/client-health/${clientCode}/trends?range=${range}`);
      setHealthData(res.data);
    } catch (err) {
      console.error('Failed to fetch client health summary:', err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedClientCode) return;

    setLoading(true);
    fetchHealthData(selectedClientCode, timeRange);

    // Automatic Real-Time Live Sync every 10 seconds
    const intervalId = setInterval(() => {
      fetchHealthData(selectedClientCode, timeRange);
    }, 10000);

    return () => clearInterval(intervalId);
  }, [selectedClientCode, timeRange, fetchHealthData]);

  const handleRefresh = () => {
    if (selectedClientCode) {
      fetchHealthData(selectedClientCode, timeRange);
    }
  };

  // Helper for overall status pill color
  const getOverallColor = (status) => {
    switch (status) {
      case 'CRITICAL':
        return { bg: '#fee2e2', color: '#dc2626', border: '#fca5a5', icon: '🔴' };
      case 'WARNING':
        return { bg: '#fef3c7', color: '#b45309', border: '#fcd34d', icon: '🟡' };
      case 'HEALTHY':
      default:
        return { bg: '#dcfce7', color: '#15803d', border: '#86efac', icon: '🟢' };
    }
  };

  const getMetricColor = (val, warnThreshold = 75, critThreshold = 90) => {
    if (val >= critThreshold) return theme.palette.error.main;
    if (val >= warnThreshold) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  // Trend Chart Options
  const trendChartOptions = {
    chart: {
      type: 'area',
      height: 350,
      toolbar: { show: false },
      background: 'transparent',
      animations: { enabled: true, easing: 'easeinout', speed: 800 }
    },
    colors: [theme.palette.primary.main, theme.palette.warning.main, theme.palette.info.main],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 90, 100]
      }
    },
    xaxis: {
      categories: (healthData?.trendPoints || []).map((p) => p.timestampStr),
      labels: { style: { colors: theme.palette.text.secondary, fontSize: '12px', fontWeight: 600 } }
    },
    yaxis: {
      max: 100,
      min: 0,
      labels: {
        style: { colors: theme.palette.text.secondary, fontSize: '12px' },
        formatter: (val) => `${val}%`
      }
    },
    grid: { borderColor: theme.palette.divider, strokeDashArray: 4 },
    tooltip: { theme: theme.palette.mode }
  };

  const trendSeries = [
    { name: 'CPU Usage (%)', data: (healthData?.trendPoints || []).map((p) => p.cpuUsagePct) },
    { name: 'Memory Usage (%)', data: (healthData?.trendPoints || []).map((p) => p.memoryUsagePct) },
    { name: 'Disk Usage (%)', data: (healthData?.trendPoints || []).map((p) => p.diskUsagePct) }
  ];

  const overall = getOverallColor(healthData?.overallStatus || 'HEALTHY');

  if (!user || user.userLevel < 5) {
    return <Navigate to="/access-denied" replace />;
  }

  return (
    <MainCard
      icon={IconActivity}
      title="Client Health Monitoring Dashboard"
      secondary={
        <Box display="flex" alignItems="center" gap={2}>
          {/* Client Selector */}
          <BOSTextField
            select
            size="small"
            label="Select Client"
            value={selectedClientCode}
            onChange={(e) => setSelectedClientCode(e.target.value)}
            sx={{ minWidth: 240 }}
          >
            {clients.length === 0 ? (
              <MenuItem value="" disabled>
                No Monitored Clients
              </MenuItem>
            ) : (
              clients.map((c) => (
                <MenuItem key={c.clientCode} value={c.clientCode}>
                  {c.clientName} ({c.clientCode})
                </MenuItem>
              ))
            )}
          </BOSTextField>

          {/* Refresh Button */}
          <Tooltip title="Refresh Live Metrics">
            <IconButton
              color="primary"
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{
                bgcolor: 'action.hover',
                borderRadius: '8px',
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } }
              }}
            >
              <IconRefresh size={20} />
            </IconButton>
          </Tooltip>

          {/* Overall Health Pill */}
          {healthData && (
            <Chip
              label={`${overall.icon} ${healthData.overallStatus}`}
              sx={{
                fontWeight: 800,
                fontSize: '0.85rem',
                bgcolor: overall.bg,
                color: overall.color,
                border: `1px solid ${overall.border}`,
                px: 1,
                py: 2.2,
                borderRadius: '10px'
              }}
            />
          )}
        </Box>
      }
    >
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" py={10}>
          <CircularProgress size={50} />
        </Box>
      ) : !selectedClientCode ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h5" color="text.secondary">
            No client selected or no clients configured for Health Monitoring.
          </Typography>
        </Box>
      ) : (
        <Box display="flex" flexDirection="column" gap={3}>
          {/* Top Info Banner */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '12px',
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: theme.palette.mode === 'dark' ? 'background.default' : '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2
            }}
          >
            <Box display="flex" alignItems="center" gap={3}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="700">
                  CLIENT NAME
                </Typography>
                <Typography variant="subtitle1" fontWeight="700">
                  {healthData?.clientName || 'N/A'} ({healthData?.clientCode})
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="700">
                  SERVER IP
                </Typography>
                <Typography variant="subtitle1" fontWeight="700">
                  {healthData?.serverIp || 'N/A'}
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="700">
                  UPTIME
                </Typography>
                <Typography variant="subtitle1" fontWeight="700" color="success.main">
                  {healthData?.serverUptime || 'N/A'}
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="700">
                  SYSTEM CONFIG
                </Typography>
                <Typography variant="subtitle1" fontWeight="700" color="primary.main">
                  {healthData?.systemConfig || 'N/A'}
                </Typography>
              </Box>
            </Box>

            <Typography variant="caption" color="text.secondary" fontWeight="600">
              Last Updated:{' '}
              {healthData?.lastUpdated
                ? new Date(healthData.lastUpdated).toLocaleTimeString()
                : 'Just Now'}
            </Typography>
          </Paper>

          {/* 8 Modern KPI Cards */}
          <Grid container spacing={2.5}>
            {/* Card 1: Server Status */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" color="text.secondary" fontWeight="700">
                      SERVER STATUS
                    </Typography>
                    <IconServer color={theme.palette.primary.main} size={24} />
                  </Box>
                  <Box display="flex" alignItems="center" gap={1} mt={2}>
                    <Chip
                      size="small"
                      icon={<IconCheck size={14} />}
                      label={healthData?.serverStatus || 'ONLINE'}
                      color="success"
                      sx={{ fontWeight: 700, px: 1 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Card 2: CPU Usage */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" color="text.secondary" fontWeight="700">
                      CPU USAGE
                    </Typography>
                    <IconCpu color={getMetricColor(healthData?.cpuUsagePct || 0)} size={24} />
                  </Box>
                  <Box display="flex" alignItems="baseline" gap={1} mt={1}>
                    <Typography variant="h3" fontWeight="800" color={getMetricColor(healthData?.cpuUsagePct || 0)}>
                      {healthData?.cpuUsagePct ?? 0}%
                    </Typography>
                  </Box>
                  {/* Progress Bar */}
                  <Box sx={{ width: '100%', bgcolor: 'action.hover', borderRadius: 2, height: 6, mt: 1.5, overflow: 'hidden' }}>
                    <Box
                      sx={{
                        width: `${Math.min(100, healthData?.cpuUsagePct || 0)}%`,
                        bgcolor: getMetricColor(healthData?.cpuUsagePct || 0),
                        height: '100%',
                        borderRadius: 2,
                        transition: 'width 0.8s ease'
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Card 3: Memory Usage */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" color="text.secondary" fontWeight="700">
                      MEMORY USAGE
                    </Typography>
                    <IconCpu2 color={getMetricColor(healthData?.memoryUsagePct || 0)} size={24} />
                  </Box>
                  <Box display="flex" alignItems="baseline" gap={1} mt={1}>
                    <Typography variant="h3" fontWeight="800" color={getMetricColor(healthData?.memoryUsagePct || 0)}>
                      {healthData?.memoryUsagePct ?? 0}%
                    </Typography>
                  </Box>
                  {/* Progress Bar */}
                  <Box sx={{ width: '100%', bgcolor: 'action.hover', borderRadius: 2, height: 6, mt: 1.5, overflow: 'hidden' }}>
                    <Box
                      sx={{
                        width: `${Math.min(100, healthData?.memoryUsagePct || 0)}%`,
                        bgcolor: getMetricColor(healthData?.memoryUsagePct || 0),
                        height: '100%',
                        borderRadius: 2,
                        transition: 'width 0.8s ease'
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Card 4: Disk Usage */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" color="text.secondary" fontWeight="700">
                      DISK USAGE
                    </Typography>
                    <IconDatabase color={getMetricColor(healthData?.diskUsagePct || 0, 80, 90)} size={24} />
                  </Box>
                  <Box display="flex" alignItems="baseline" gap={1} mt={1}>
                    <Typography variant="h3" fontWeight="800" color={getMetricColor(healthData?.diskUsagePct || 0, 80, 90)}>
                      {healthData?.diskUsagePct ?? 0}%
                    </Typography>
                  </Box>
                  {/* Progress Bar */}
                  <Box sx={{ width: '100%', bgcolor: 'action.hover', borderRadius: 2, height: 6, mt: 1.5, overflow: 'hidden' }}>
                    <Box
                      sx={{
                        width: `${Math.min(100, healthData?.diskUsagePct || 0)}%`,
                        bgcolor: getMetricColor(healthData?.diskUsagePct || 0, 80, 90),
                        height: '100%',
                        borderRadius: 2,
                        transition: 'width 0.8s ease'
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Card 5: SQL Server Status */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" color="text.secondary" fontWeight="700">
                      SQL SERVER
                    </Typography>
                    <IconDatabase color={theme.palette.success.main} size={24} />
                  </Box>
                  <Box mt={2}>
                    <Chip
                      size="small"
                      label={healthData?.sqlServerStatus || 'ONLINE'}
                      color={healthData?.sqlServerStatus === 'OFFLINE' ? 'error' : 'success'}
                      sx={{ fontWeight: 700, px: 1 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Card 6: Application Status */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" color="text.secondary" fontWeight="700">
                      APPLICATION
                    </Typography>
                    <IconBrandAppstore color={theme.palette.info.main} size={24} />
                  </Box>
                  <Box mt={2}>
                    <Chip
                      size="small"
                      label={healthData?.applicationStatus || 'ONLINE'}
                      color={healthData?.applicationStatus === 'OFFLINE' ? 'error' : 'success'}
                      sx={{ fontWeight: 700, px: 1 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Card 7: Server Uptime */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" color="text.secondary" fontWeight="700">
                      SERVER UPTIME
                    </Typography>
                    <IconClock color={theme.palette.secondary.main} size={24} />
                  </Box>
                  <Typography variant="h4" fontWeight="800" mt={2} color="text.primary">
                    {healthData?.serverUptime || 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Card 8: Network Latency */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" color="text.secondary" fontWeight="700">
                      NETWORK LATENCY
                    </Typography>
                    <IconWifi color={theme.palette.success.main} size={24} />
                  </Box>
                  <Typography variant="h4" fontWeight="800" mt={2} color="success.main">
                    {healthData?.networkLatencyMs ?? 0} ms
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Historical Trends Chart */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <IconTrendingUp color={theme.palette.primary.main} size={22} />
                <Typography variant="h4" fontWeight="700">
                  Historical Health Trends
                </Typography>
              </Box>

              {/* Time Range Filter Buttons */}
              <Box display="flex" gap={1}>
                {['1h', '24h', '7d', '30d'].map((r) => (
                  <Button
                    key={r}
                    size="small"
                    variant={timeRange === r ? 'contained' : 'outlined'}
                    color="primary"
                    onClick={() => setTimeRange(r)}
                    sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
                  >
                    {r === '1h' ? 'Last 1 Hour' : r === '24h' ? 'Last 24 Hours' : r === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
                  </Button>
                ))}
              </Box>
            </Box>

            <ReactApexChart options={trendChartOptions} series={trendSeries} type="area" height={320} />
          </Paper>

          {/* Active Alerts Panel */}
          {healthData?.activeAlerts && healthData.activeAlerts.length > 0 && (
            <Box display="flex" flexDirection="column" gap={1.5}>
              <Box display="flex" alignItems="center" gap={1}>
                <IconAlertTriangle color={theme.palette.warning.main} size={22} />
                <Typography variant="h4" fontWeight="700">
                  Active Alerts ({healthData.activeAlerts.length})
                </Typography>
              </Box>

              {healthData.activeAlerts.map((alert, idx) => (
                <Alert
                  key={idx}
                  severity={alert.severity?.toLowerCase() === 'critical' ? 'error' : 'warning'}
                  sx={{ borderRadius: '10px', '& .MuiAlert-message': { width: '100%' } }}
                >
                  <AlertTitle sx={{ fontWeight: 700 }}>{alert.title}</AlertTitle>
                  {alert.description}
                </Alert>
              ))}
            </Box>
          )}
        </Box>
      )}
    </MainCard>
  );
}
