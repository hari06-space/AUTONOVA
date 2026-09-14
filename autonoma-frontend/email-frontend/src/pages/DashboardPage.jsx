import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStats } from '../store/slices/dashboardSlice';
import { useNavigate } from 'react-router-dom';
import {
  Skeleton, Box, Paper, Typography, Grid, Card, CardContent, Button,
  ButtonGroup, LinearProgress, IconButton, Tooltip
} from '@mui/material';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import BugReportRoundedIcon from '@mui/icons-material/BugReportRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';

const lineData = [
  { name: 'Mon', emails: 45, quotes: 12, confirmed: 8 },
  { name: 'Tue', emails: 52, quotes: 18, confirmed: 10 },
  { name: 'Wed', emails: 38, quotes: 15, confirmed: 12 },
  { name: 'Thu', emails: 65, quotes: 25, confirmed: 18 },
  { name: 'Fri', emails: 48, quotes: 20, confirmed: 15 },
  { name: 'Sat', emails: 25, quotes: 8, confirmed: 5 },
  { name: 'Sun', emails: 18, quotes: 5, confirmed: 3 },
];

const pieData = [
  { name: 'Client', value: 45, color: '#00D9A6' },
  { name: 'Promotional', value: 25, color: '#FFB347' },
  { name: 'Spam', value: 20, color: '#FF5C6C' },
  { name: 'Advertisement', value: 10, color: '#6C63FF' },
];

const funnelData = [
  { label: 'Inbound Emails', value: 100, color: '#6C63FF' },
  { label: 'Qualified Enquiries', value: 65, color: '#8B83FF' },
  { label: 'Quotations Sent', value: 40, color: '#A6A0FF' },
  { label: 'Orders Confirmed', value: 25, color: '#C1BDFF' },
];

export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { stats, loading } = useSelector((state) => state.dashboard);
  const [timeRange, setTimeRange] = useState('Weekly');

  const handleRefresh = () => {
    dispatch(fetchStats());
  };

  useEffect(() => {
    handleRefresh();
  }, [dispatch]);

  const statCards = stats ? [
    { label: 'Total Mail', value: stats.totalEmailsProcessed, icon: <EmailRoundedIcon />, color: 'purple', path: '/inbox' },
    { label: 'Quotations', value: stats.quotationsSent, icon: <CheckCircleRoundedIcon />, color: 'green', path: '/work-items' },
    { label: 'Pending Review', value: stats.pendingReviews, icon: <PendingActionsRoundedIcon />, color: 'orange', path: '/review-queue' },
    { label: 'Spam Filtered', value: Math.floor(stats.totalEmailsProcessed * 0.1), icon: <BugReportRoundedIcon />, color: 'red', path: '/email-history' },
    { label: 'Total Customers', value: stats.totalCustomers, icon: <PeopleAltRoundedIcon />, color: 'purple', path: '/customers' },
    { label: 'Master Parts', value: stats.totalMasterParts, icon: <Inventory2RoundedIcon />, color: 'green', path: '/master-parts' },
    { label: 'Invoices Sent', value: stats.invoicesSent, icon: <ReceiptLongRoundedIcon />, color: 'orange', path: '/work-items' },
    { label: 'Growth Rate', value: '+12.5%', icon: <TrendingUpRoundedIcon />, color: 'green', path: '/' },
  ] : [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      {/* Enhanced Header */}
      <Box sx={{ flexShrink: 0, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#fff', mb: 0.5 }}>Process Progress Visuals</Typography>
          <Typography variant="body2" color="text.secondary">Real-time analytics and performance surveys of Nutech Email processing</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button 
            variant="outlined" 
            startIcon={<RefreshRoundedIcon />} 
            onClick={handleRefresh}
            sx={{ 
              borderColor: 'rgba(255,255,255,0.1)', 
              color: 'text.secondary',
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': { borderColor: 'rgba(255,255,255,0.2)', bgcolor: 'rgba(255,255,255,0.05)' }
            }}
          >
            Refresh
          </Button>
          <ButtonGroup size="small" sx={{ bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, p: 0.5 }}>
            {['Today', 'Weekly', 'Monthly', 'Yearly'].map((range) => (
              <Button
                key={range}
                onClick={() => setTimeRange(range)}
                sx={{
                  border: 'none !important',
                  borderRadius: '6px !important',
                  textTransform: 'none',
                  px: 2,
                  fontWeight: 600,
                  bgcolor: timeRange === range ? 'background.paper' : 'transparent',
                  color: timeRange === range ? 'primary.main' : 'text.secondary',
                  boxShadow: timeRange === range ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                  '&:hover': { bgcolor: timeRange === range ? 'background.paper' : 'rgba(255,255,255,0.05)' }
                }}
              >
                {range}
              </Button>
            ))}
          </ButtonGroup>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '8px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' } }}>
        {/* Stats Grid - 8 items */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Grid item xs={12} sm={6} md={3} lg={1.5} key={i}>
                  <Card className="stat-card" sx={{ p: '12px !important' }}>
                    <Skeleton variant="rounded" width={32} height={32} sx={{ mb: 1, bgcolor: 'rgba(255,255,255,0.05)' }} />
                    <Skeleton variant="text" width="60%" sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                    <Skeleton variant="text" width="80%" sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                  </Card>
                </Grid>
              ))
            : statCards.map((card, idx) => (
                <Grid item xs={12} sm={6} md={3} lg={1.5} key={idx}>
                  <Card 
                    className="stat-card animate-in" 
                    onClick={() => card.path && navigate(card.path)}
                    style={{ 
                      animationDelay: `${idx * 0.05}s`, 
                      padding: '16px',
                      cursor: card.path ? 'pointer' : 'default'
                    }}
                  >
                    <Box className={`stat-card__icon stat-card__icon--${card.color}`} sx={{ width: 36, height: 36, fontSize: '1.1rem', mb: 1.5 }}>
                      {card.icon}
                    </Box>
                    <Box className="stat-card__value" sx={{ fontSize: '1.4rem' }}>{card.value}</Box>
                    <Box className="stat-card__label" sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{card.label}</Box>
                  </Card>
                </Grid>
              ))
          }
        </Grid>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Weekly Process Flow */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)', height: 400 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Weekly Process Flow</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#6C63FF' }} />
                    <Typography variant="caption" color="text.secondary">Emails</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#00D9A6' }} />
                    <Typography variant="caption" color="text.secondary">Quotes</Typography>
                  </Box>
                </Box>
              </Box>
              <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEmails" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6C63FF" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorQuotes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D9A6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00D9A6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9AA0B0', fontSize: 11 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9AA0B0', fontSize: 11 }} />
                  <ChartTooltip 
                    contentStyle={{ backgroundColor: '#161D30', border: '1px solid rgba(108, 99, 255, 0.2)', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                    itemStyle={{ color: '#fff', fontSize: 12 }}
                    labelStyle={{ color: '#9AA0B0', marginBottom: 4, fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="emails" stroke="#6C63FF" strokeWidth={3} fillOpacity={1} fill="url(#colorEmails)" />
                  <Area type="monotone" dataKey="quotes" stroke="#00D9A6" strokeWidth={3} fillOpacity={1} fill="url(#colorQuotes)" />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Email Distribution */}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)', height: 400 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Email Classification</Typography>
              <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    contentStyle={{ backgroundColor: '#161D30', border: '1px solid rgba(108, 99, 255, 0.2)', borderRadius: 12 }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center" 
                    iconType="circle"
                    formatter={(value) => <span style={{ color: '#9AA0B0', fontSize: '12px' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* Bottom Row: Funnel and Surveys */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} lg={7}>
            <Paper sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)', height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 4 }}>Conversion Funnel</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {funnelData.map((item, idx) => (
                  <Box key={idx}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{item.label}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: item.color }}>{item.value}%</Typography>
                    </Box>
                    <Box sx={{ position: 'relative', width: '100%', height: 10, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 5, overflow: 'hidden' }}>
                      <Box 
                        sx={{ 
                          position: 'absolute', 
                          left: 0, 
                          top: 0, 
                          height: '100%', 
                          width: `${item.value}%`, 
                          bgcolor: item.color,
                          borderRadius: 5,
                          transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: `0 0 15px ${item.color}33`
                        }} 
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={5}>
            <Paper sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)', height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Efficiency Surveys</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {[
                  { label: 'AI Prediction Accuracy', value: 94, color: '#6C63FF' },
                  { label: 'Avg. Response Time', value: 82, color: '#00D9A6' },
                  { label: 'Customer Satisfaction', value: 88, color: '#FFB347' },
                  { label: 'System Uptime', value: 99.9, color: '#00D9A6' },
                ].map((survey, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                      <Box sx={{ 
                        width: 50, 
                        height: 50, 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        bgcolor: 'rgba(255,255,255,0.03)',
                        border: `2px solid ${survey.color}22`
                      }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: survey.color }}>{survey.value}%</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>{survey.label}</Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={survey.value} 
                        sx={{ 
                          height: 6, 
                          borderRadius: 3, 
                          bgcolor: 'rgba(255,255,255,0.05)',
                          '& .MuiLinearProgress-bar': { bgcolor: survey.color, borderRadius: 3 }
                        }} 
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
