import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box, CircularProgress, Chip } from '@mui/material';
import { IconTrendingUp, IconTrendingDown, IconAlertTriangle } from '@tabler/icons-react';
import { sendMessage } from 'api/autonomaAiApi';

const ExecutiveCard = ({ title, value, trend, color, loading }) => (
  <Card sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(13,27,62,0.8) 0%, rgba(26,58,110,0.8) 100%)', color: '#fff', border: `1px solid ${color}40`, boxShadow: `0 4px 20px ${color}20` }}>
    <CardContent>
      <Typography variant="subtitle2" sx={{ color: '#94a3b8', mb: 1, fontWeight: 700 }}>{title}</Typography>
      {loading ? (
        <CircularProgress size={24} sx={{ color }} />
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 800 }}>{value}</Typography>
          {trend === 'up' && <IconTrendingUp color="#10b981" />}
          {trend === 'down' && <IconTrendingDown color="#ef4444" />}
        </Box>
      )}
    </CardContent>
  </Card>
);

const AutonomaAI = () => {
  const [data, setData] = useState({
    revenue: null, profitability: null, pendingApprovals: null, criticalInventory: null, businessHealth: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Pseudo-integration with the Executive Agent
        const res = await sendMessage("Generate Executive Dashboard Summary", "exec_dashboard_session");
        
        // Mocking the parsed response for visual demonstration since full backend integration requires data
        setData({
          revenue: '₹ 12.4M',
          profitability: '24.5%',
          pendingApprovals: '18',
          criticalInventory: '5 Items',
          businessHealth: '85/100'
        });
      } catch (error) {
        console.error("Failed to load Executive Insights", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, color: '#1e293b' }}>
          Executive AI Dashboard
        </Typography>
        <Chip label="AURA Copilot" color="primary" size="small" />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <ExecutiveCard title="Forecasted Revenue" value={data.revenue || '-'} trend="up" color="#00d4ff" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ExecutiveCard title="Profitability Margin" value={data.profitability || '-'} trend="up" color="#10b981" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ExecutiveCard title="Pending Approvals" value={data.pendingApprovals || '-'} trend="down" color="#f59e0b" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ExecutiveCard title="Critical Inventory" value={data.criticalInventory || '-'} trend="down" color="#ef4444" loading={loading} />
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 4, p: 3, borderRadius: 2, bgcolor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
        <Typography variant="h5" sx={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <IconAlertTriangle /> Business Risks Detected
        </Typography>
        {loading ? <CircularProgress size={24} sx={{ color: '#ef4444' }} /> : (
          <Typography variant="body1" sx={{ color: '#334155' }}>
            AURA has identified a <strong>Cash Flow Risk</strong> next week due to 3 high-value pending collections and upcoming vendor payments. Recommend expediting collections.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default AutonomaAI;
