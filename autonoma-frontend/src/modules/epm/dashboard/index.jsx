import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Typography, Paper, CircularProgress, Stack, Chip, Divider, Avatar
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { IconStar, IconTrendingUp, IconRocket, IconDiamond, IconCrown, IconBolt, IconTrophy, IconMedal } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import useAuth from 'hooks/useAuth';

const EpmDashboard = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axios.get(`/api/epm/me/dashboard`);
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user]);

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh"><CircularProgress /></Box>;
  }

  const { summary, recentTransactions, levelName, levelIcon, pointsToNextLevel } = data || {};
  const totalScore = summary?.totalScore || 0;
  
  const getIconComponent = (iconName) => {
    switch (iconName) {
      case 'IconStar': return <IconStar />;
      case 'IconTrendingUp': return <IconTrendingUp />;
      case 'IconRocket': return <IconRocket />;
      case 'IconDiamond': return <IconDiamond />;
      case 'IconCrown': return <IconCrown />;
      default: return <IconStar />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h3" fontWeight={800} color="text.primary">My Performance</Typography>
          <Typography variant="body2" color="text.secondary">Real-time breakdown of your productivity and impact.</Typography>
        </Box>
        <Chip 
          icon={getIconComponent(levelIcon)} 
          label={`${levelName} Level`} 
          color="primary" 
          sx={{ fontWeight: 'bold', fontSize: '1rem', p: 1, height: 40 }} 
        />
      </Box>

      <Grid container spacing={3}>
        {/* Score Cards */}
        <Grid item xs={12} md={4}>
          <MainCard sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
            <Typography variant="h6" color="text.secondary" textTransform="uppercase">Total Score</Typography>
            <Typography variant="h2" fontWeight={900} color="primary.main">{totalScore}</Typography>
            <Typography variant="caption" color="text.secondary">{pointsToNextLevel} points to next level</Typography>
          </MainCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <MainCard sx={{ bgcolor: alpha(theme.palette.success.main, 0.05), border: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
            <Typography variant="h6" color="text.secondary" textTransform="uppercase">Monthly Score</Typography>
            <Typography variant="h2" fontWeight={900} color="success.main">{summary?.monthlyScore || 0}</Typography>
            <Typography variant="caption" color="success.dark">Top 15% in your department</Typography>
          </MainCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <MainCard sx={{ bgcolor: alpha(theme.palette.warning.main, 0.05), border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}` }}>
            <Typography variant="h6" color="text.secondary" textTransform="uppercase">Yearly Score</Typography>
            <Typography variant="h2" fontWeight={900} color="warning.main">{summary?.yearlyScore || 0}</Typography>
            <Typography variant="caption" color="warning.dark">Consistent performer</Typography>
          </MainCard>
        </Grid>

        {/* Ledger */}
        <Grid item xs={12}>
          <MainCard title="Recent Activity Ledger">
            {(!recentTransactions || recentTransactions.length === 0) ? (
              <Typography color="text.secondary" align="center" py={4}>No recent score activity found.</Typography>
            ) : (
              <Stack spacing={2}>
                {recentTransactions.map((tx, idx) => (
                  <Box key={idx} sx={{ 
                    p: 2, borderRadius: 2, 
                    border: `1px solid ${theme.palette.divider}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>{tx.transactionType}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {tx.reason} • Ref: {tx.referenceId} • {new Date(tx.transactionDate).toLocaleString()}
                      </Typography>
                    </Box>
                    <Chip 
                      label={tx.points > 0 ? `+${tx.points}` : `${tx.points}`} 
                      color={tx.points > 0 ? 'success' : 'error'} 
                      sx={{ fontWeight: 800, fontSize: '1rem' }} 
                    />
                  </Box>
                ))}
              </Stack>
            )}
          </MainCard>
        </Grid>

        {/* Badges Preview */}
        <Grid item xs={12}>
          <MainCard title="Unlocked Badges">
            <Stack direction="row" spacing={3}>
              <Box textAlign="center">
                <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.2), color: theme.palette.warning.main, width: 64, height: 64, mb: 1, mx: 'auto' }}>
                  <IconTrophy size={32} />
                </Avatar>
                <Typography variant="subtitle2" fontWeight={700}>First Task</Typography>
              </Box>
              <Box textAlign="center">
                <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.2), color: theme.palette.info.main, width: 64, height: 64, mb: 1, mx: 'auto' }}>
                  <IconBolt size={32} />
                </Avatar>
                <Typography variant="subtitle2" fontWeight={700}>Speed Master</Typography>
              </Box>
            </Stack>
          </MainCard>
        </Grid>

      </Grid>
    </Box>
  );
};

export default EpmDashboard;
