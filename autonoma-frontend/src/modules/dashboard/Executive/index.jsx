import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, CircularProgress, Alert, Button, Card, Skeleton } from '@mui/material';
import { IconRefresh as RefreshCw } from '@tabler/icons-react';
import axios from 'utils/axios';

import {
  AiBriefing,
  HealthScores,
  LiveCounters,
  BusinessSummary,
  TopPerformersAndBalancing,
  BottlenecksAlerts,
  TimelineAndRisk,
  DecisionCenter,
  SmartSearch,
  ExecutiveDigest
} from './DashboardComponents';
import './executive.css';

export default function ExecutiveDashboard() {
  const [data, setData] = useState(null);
  const [briefing, setBriefing] = useState('');
  const [loading, setLoading] = useState(true);
  const [briefingLoading, setBriefingLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/executive/dashboard-data');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
      setError('Unable to retrieve executive operational data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBriefing = async () => {
    setBriefingLoading(true);
    try {
      const res = await axios.get('/api/executive/briefing');
      setBriefing(res.data?.briefing || '');
    } catch (err) {
      console.error('Failed to load AI Briefing:', err);
      setBriefing('AI Briefing could not be loaded.');
    } finally {
      setBriefingLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchBriefing();
  }, []);

  const handleDecisionApproved = (id) => {
    // Optimistically update decisions list
    if (data) {
      const updatedDecisions = data.decisions.filter((d) => d.id !== id);
      const updatedCounters = { ...data.counters };
      if (updatedCounters.approvalsPending > 0) {
        updatedCounters.approvalsPending -= 1;
      }
      setData({
        ...data,
        decisions: updatedDecisions,
        counters: updatedCounters
      });
    }
  };

  const isDarkMode = document.body.classList.contains('dark') || false;

  return (
    <div className={`exec-container ${isDarkMode ? 'dark-mode-exec' : ''}`}>
      {/* Header Grid */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Box>
          <Typography variant="h2" fontWeight="800" sx={{ letterSpacing: '-0.5px' }}>
            Executive Command Center
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            BOS Single Source of Truth for Top Management
          </Typography>
        </Box>
        <Box display="flex" gap={1.5}>
          <Button
            variant="outlined"
            startIcon={<RefreshCw size={16} />}
            onClick={() => {
              fetchDashboardData();
              fetchBriefing();
            }}
          >
            Refresh System
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" variant="outlined" sx={{ borderRadius: '12px' }}>
          {error}
        </Alert>
      )}

      {/* Main Command Center Grid */}
      <Grid container spacing={3}>
        {/* Row 1: AI Briefing */}
        <Grid item xs={12}>
          {briefingLoading ? (
            <Card className="glass-card" style={{ padding: '24px' }}>
              <Skeleton variant="text" width="60%" height={32} />
              <Skeleton variant="text" width="80%" height={20} style={{ marginTop: '12px' }} />
              <Skeleton variant="text" width="95%" height={20} style={{ marginTop: '6px' }} />
            </Card>
          ) : (
            <AiBriefing briefing={briefing} onRefresh={fetchBriefing} />
          )}
        </Grid>

        {/* Row 2: Live Operations & Counters */}
        <Grid item xs={12}>
          {loading ? (
            <Grid container spacing={2}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Grid item xs={6} sm={2.4} key={i}>
                  <Card className="glass-card" style={{ padding: '16px', minHeight: '100px' }}>
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="rectangular" height={36} style={{ marginTop: '12px', borderRadius: '8px' }} />
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <LiveCounters counters={data?.counters} />
          )}
        </Grid>

        {/* Row 3: Health Score Analysis */}
        <Grid item xs={12}>
          {loading ? (
            <Card className="glass-card" style={{ padding: '24px' }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4} display="flex" justifyContent="center">
                  <Skeleton variant="circular" width={180} height={180} />
                </Grid>
                <Grid item xs={12} md={8}>
                  <Grid container spacing={2}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Grid item xs={4} key={i}>
                        <Skeleton variant="rectangular" height={80} style={{ borderRadius: '12px' }} />
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              </Grid>
            </Card>
          ) : (
            <HealthScores overall={data?.health?.overall} breakdown={data?.health?.breakdown} />
          )}
        </Grid>

        {/* Row 4: Today's Business Summary */}
        <Grid item xs={12}>
          {loading ? (
            <Card className="glass-card" style={{ padding: '24px' }}>
              <Grid container spacing={3}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Grid item xs={2.4} key={i}>
                    <Skeleton variant="rectangular" height={60} style={{ borderRadius: '8px' }} />
                  </Grid>
                ))}
              </Grid>
            </Card>
          ) : (
            <BusinessSummary summary={data?.summary} />
          )}
        </Grid>

        {/* Row 5: Performers and Workload balancing */}
        <Grid item xs={12}>
          {loading ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Skeleton variant="rectangular" height={220} style={{ borderRadius: '16px' }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <Skeleton variant="rectangular" height={220} style={{ borderRadius: '16px' }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <Skeleton variant="rectangular" height={220} style={{ borderRadius: '16px' }} />
              </Grid>
            </Grid>
          ) : (
            <TopPerformersAndBalancing
              performers={data?.topPerformers}
              supportNeeded={data?.supportNeeded}
              workloadBalancer={data?.workloadBalancer}
            />
          )}
        </Grid>

        {/* Row 6: Bottlenecks & Live Alerts */}
        <Grid item xs={12}>
          {loading ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Skeleton variant="rectangular" height={260} style={{ borderRadius: '16px' }} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Skeleton variant="rectangular" height={260} style={{ borderRadius: '16px' }} />
              </Grid>
            </Grid>
          ) : (
            <BottlenecksAlerts 
              bottlenecks={data?.bottlenecks} 
              initialAlerts={data?.alerts} 
            />
          )}
        </Grid>

        {/* Row 7: Timeline & Risk */}
        <Grid item xs={12}>
          {loading ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Skeleton variant="rectangular" height={320} style={{ borderRadius: '16px' }} />
              </Grid>
              <Grid item xs={12} md={5}>
                <Skeleton variant="rectangular" height={320} style={{ borderRadius: '16px' }} />
              </Grid>
            </Grid>
          ) : (
            <TimelineAndRisk 
              timeline={data?.timeline} 
              riskMeter={data?.riskMeter} 
            />
          )}
        </Grid>

        {/* Row 8: Executive Decision Center */}
        <Grid item xs={12}>
          {loading ? (
            <Card className="glass-card" style={{ padding: '24px' }}>
              <Grid container spacing={3}>
                {[1, 2, 3].map((i) => (
                  <Grid item xs={4} key={i}>
                    <Skeleton variant="rectangular" height={150} style={{ borderRadius: '12px' }} />
                  </Grid>
                ))}
              </Grid>
            </Card>
          ) : (
            <DecisionCenter 
              decisions={data?.decisions} 
              onDecisionApproved={handleDecisionApproved} 
            />
          )}
        </Grid>

        {/* Row 9: Smart AI search */}
        <Grid item xs={12}>
          <SmartSearch />
        </Grid>

        {/* Row 10: Executive Digest */}
        <Grid item xs={12}>
          <ExecutiveDigest />
        </Grid>
      </Grid>
    </div>
  );
}
