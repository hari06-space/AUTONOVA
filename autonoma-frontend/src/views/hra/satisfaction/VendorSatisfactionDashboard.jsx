import { useState, useEffect } from 'react';
import {
  Typography,
  Stack,
  Grid,
  Box,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import axios from 'utils/axios';
import {
  IconTruck,
  IconAlertTriangle,
  IconMail,
  IconTrendingUp,
  IconChartBar,
  IconFileSpreadsheet,
  IconUsers,
  IconMoodSmile,
  IconClock,
  IconAlertCircle,
  IconArchive
} from '@tabler/icons-react';
import { useSelector, useDispatch } from 'react-redux';
import Chart from 'react-apexcharts';
import { useTheme } from '@mui/material/styles';
import { setFilterConfig } from 'store/slices/search';
import MainCard from 'ui-component/cards/MainCard';
import {
  BOSDataTable,
  BOSStatusChip
} from 'ui-component/bos';

const formatCycleForBackend = (cycleStr) => {
  if (!cycleStr || cycleStr === 'ALL') return 'ALL';
  if (/^\d{4}-\d{2}$/.test(cycleStr)) return cycleStr;
  const parts = cycleStr.trim().split(/\s+/);
  if (parts.length === 2) {
    const [m, y] = parts;
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIdx = monthNames.indexOf(m);
    if (monthIdx !== -1) {
      const monthNum = String(monthIdx + 1).padStart(2, '0');
      return `${y}-${monthNum}`;
    }
  }
  return cycleStr;
};

const rankingColumns = [
  { id: 'ranking', label: 'RANK', minWidth: 80, align: 'center', bold: true },
  { id: 'category', label: 'SUPPLIER NAME', minWidth: 200, align: 'left', bold: true },
  { id: 'scoreDisplay', label: 'AVG SCORE', minWidth: 120, align: 'center', bold: true },
  { id: 'trend', label: 'TREND', minWidth: 100, align: 'center', bold: true },
  { id: 'status', label: 'PERFORMANCE STATUS', minWidth: 180, align: 'center', status: true }
];

const detailedColumns = [
  { id: 'vendorId', label: 'VENDOR ID', minWidth: 130, align: 'left', bold: true },
  { id: 'vendorName', label: 'VENDOR NAME', minWidth: 180, align: 'left' },
  { id: 'category', label: 'CATEGORY', minWidth: 150, align: 'left' },
  { id: 'question', label: 'QUESTION', minWidth: 200, align: 'left' },
  { id: 'rating', label: 'RATING', minWidth: 140, align: 'center', status: true },
  { id: 'scoreDisplay', label: 'SCORE', minWidth: 100, align: 'center', bold: true },
  { id: 'comment', label: 'COMMENT', minWidth: 250, align: 'left' },
  { id: 'date', label: 'SUBMISSION DATE', minWidth: 140, align: 'center' }
];

const riskColumns = [
  { id: 'vendorId', label: 'VENDOR ID', minWidth: 130, align: 'left', bold: true },
  { id: 'vendorName', label: 'VENDOR NAME', minWidth: 180, align: 'left' },
  { id: 'category', label: 'CATEGORY', minWidth: 150, align: 'left' },
  { id: 'scoreDisplay', label: 'AVERAGE SCORE', minWidth: 120, align: 'center', bold: true },
  { id: 'riskCategory', label: 'RISK CATEGORY', minWidth: 140, align: 'center', status: true },
  { id: 'reason', label: 'REASON', minWidth: 250, align: 'left' },
  { id: 'action', label: 'RECOMMENDED ACTION', minWidth: 250, align: 'left', bold: true }
];

const reminderColumns = [
  { id: 'entityId', label: 'ENTITY ID', minWidth: 130, align: 'left', bold: true },
  { id: 'entityName', label: 'ENTITY NAME', minWidth: 180, align: 'left' },
  { id: 'entityType', label: 'ENTITY TYPE', minWidth: 120, align: 'center' },
  { id: 'cycle', label: 'FEEDBACK CYCLE', minWidth: 140, align: 'center' },
  { id: 'reminderCount', label: 'REMINDER COUNT', minWidth: 130, align: 'center', bold: true },
  { id: 'lastDate', label: 'LAST REMINDER DATE', minWidth: 140, align: 'center' },
  { id: 'nextDate', label: 'NEXT REMINDER DATE', minWidth: 140, align: 'center' },
  { id: 'status', label: 'FEEDBACK STATUS', minWidth: 150, align: 'center', status: true },
  { id: 'mailStatus', label: 'EMAIL STATUS', minWidth: 160, align: 'center', status: true }
];

export default function VendorSatisfactionDashboard() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const isDark = theme.palette.mode === 'dark';
  const [activeTab, setActiveTab] = useState(0);

  // Filters from Redux global filter bar
  const searchQuery = useSelector((state) => state.search?.query || '');
  const globalFilters = useSelector((state) => state.search?.filters || {});
  const cycleFilter = globalFilters.feedbackCycle || 'ALL';
  const statusFilter = globalFilters.status || 'ALL';

  // Pagination states
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);

  // Data States
  const [stats, setStats] = useState({
    assigned: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    closed: 0,
    totalResponses: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
    satisfactionIndex: 0
  });

  const [questionPerf, setQuestionPerf] = useState({
    highestScoring: 'N/A',
    lowestScoring: 'N/A',
    mostPositive: 'N/A',
    mostNegative: 'N/A',
    mostExcellent: 'N/A',
    mostPoor: 'N/A',
    mostCommented: 'N/A'
  });

  const [vendorAnalytics, setVendorAnalytics] = useState([]);
  const [detailedResponses, setDetailedResponses] = useState([]);
  const [riskAnalysis, setRiskAnalysis] = useState([]);
  const [reminders, setReminders] = useState([]);

  // Reset pagination on tab change
  useEffect(() => {
    setPage(0);
  }, [activeTab]);

  // Register global filter configs in the header search section
  useEffect(() => {
    dispatch(
      setFilterConfig([
        {
          id: 'feedbackCycle',
          label: 'Feedback Cycle',
          type: 'monthYear',
          isStarred: true,
          defaultValue: '2026-06'
        }
      ])
    );
    return () => {
      dispatch(setFilterConfig(null));
    };
  }, [dispatch]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {
        cycle: cycleFilter !== 'ALL' ? formatCycleForBackend(cycleFilter) : null,
        status: statusFilter !== 'ALL' ? statusFilter : null,
        search: searchQuery || null
      };

      // 1. Dashboard summary
      const summaryRes = await axios.get('/api/qms/vendor-satisfaction/dashboard-summary', { params });
      if (summaryRes.data) {
        setStats(prev => ({
          ...prev,
          assigned: summaryRes.data.total || 0,
          completed: summaryRes.data.completed || 0,
          pending: summaryRes.data.pending || 0,
          overdue: summaryRes.data.overdue || 0,
          closed: summaryRes.data.closed || 0,
          totalResponses: summaryRes.data.completed || 0
        }));
      }

      // 2. Mappings list
      const mappingsRes = await axios.get('/api/qms/vendor-satisfaction/mappings', { params });
      if (mappingsRes.data) {
        const mappings = mappingsRes.data;
        const completedMappings = mappings.filter(m => m.status === 'Completed');

        // Detailed responses
        const detailed = completedMappings.map(m => {
          const avgScore = parseFloat(m.averageScore) || 0;
          let rating = 'Moderate';
          if (avgScore >= 90) rating = 'Excellent';
          else if (avgScore >= 75) rating = 'Very Good';
          else if (avgScore >= 50) rating = 'Good';
          else if (avgScore < 25) rating = 'Poor';

          return {
            id: m.id,
            vendorId: m.vendorId,
            vendorName: m.vendorName,
            category: 'General Supplier',
            question: 'Overall Performance',
            rating: rating,
            score: avgScore,
            comment: m.generalComments || 'No comments',
            date: m.submittedDate ? m.submittedDate.split(' ')[0] : 'N/A'
          };
        });
        setDetailedResponses(detailed);

        // Reminders list
        const rems = mappings.map(m => ({
          entityId: m.vendorId,
          entityName: m.vendorName,
          entityType: 'Vendor',
          cycle: m.feedbackCycle,
          reminderCount: m.reminderCount || 0,
          lastDate: m.lastReminderDate || '',
          nextDate: m.nextReminderDate || '',
          status: m.status,
          mailStatus: m.reminderCount > 0 ? 'Delivered' : 'Not Sent'
        }));
        setReminders(rems);

        // Calculate analytics & rankings grouped by vendor name
        const vendorGroups = {};
        completedMappings.forEach(m => {
          const name = m.vendorName || 'General';
          if (!vendorGroups[name]) {
            vendorGroups[name] = [];
          }
          vendorGroups[name].push(parseFloat(m.averageScore) || 0);
        });

        const mappedVendors = Object.keys(vendorGroups).map((name, idx) => {
          const scores = vendorGroups[name];
          const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
          return {
            category: name,
            score: avgScore,
            index: avgScore,
            ranking: idx + 1,
            trend: 'Stable',
            status: avgScore >= 75 ? 'Top Performing' : avgScore >= 50 ? 'Stable' : 'Watchlist'
          };
        });
        mappedVendors.sort((a, b) => b.score - a.score);
        mappedVendors.forEach((v, idx) => { v.ranking = idx + 1; });
        setVendorAnalytics(mappedVendors);

        // Risk Analysis
        const risks = mappings
          .filter(m => m.riskLevel && m.riskLevel !== 'Low')
          .map(m => ({
            vendorId: m.vendorId,
            vendorName: m.vendorName,
            category: 'General Supplier',
            score: parseFloat(m.averageScore) || 0,
            riskCategory: m.riskLevel,
            reason: 'Performance score fell below standard threshold',
            action: m.riskLevel === 'High' ? 'Supplier Quality Audit triggered' : 'Performance improvement plan requested'
          }));
        setRiskAnalysis(risks);

        // Calculate avg score stats
        if (completedMappings.length > 0) {
          const scores = completedMappings.map(m => parseFloat(m.averageScore) || 0);
          const totalSum = scores.reduce((a, b) => a + b, 0);
          const avg = totalSum / scores.length;
          setStats(prev => ({
            ...prev,
            averageScore: avg,
            satisfactionIndex: avg,
            highestScore: Math.max(...scores),
            lowestScore: Math.min(...scores)
          }));
        }

        // Fetch detailed responses for question performance aggregation
        const allResponsesPromises = completedMappings.slice(0, 10).map(m =>
          axios.get(`/api/qms/vendor-satisfaction/responses?mappingId=${m.id}`)
        );
        const allResponsesRes = await Promise.all(allResponsesPromises);
        const flatResponses = allResponsesRes.flatMap(r => r.data || []);

        if (flatResponses.length > 0) {
          const questionGroups = {};
          flatResponses.forEach(r => {
            const q = r.questionCriteria;
            if (!questionGroups[q]) {
              questionGroups[q] = { totalScore: 0, count: 0, excellentCount: 0, poorCount: 0 };
            }
            questionGroups[q].totalScore += r.score;
            questionGroups[q].count += 1;
            if (r.rating === 'Excellent') questionGroups[q].excellentCount += 1;
            if (r.rating === 'Poor') questionGroups[q].poorCount += 1;
          });

          let highestQ = 'N/A';
          let highestAvg = -1;
          let lowestQ = 'N/A';
          let lowestAvg = 101;
          let mostPositive = 'N/A';
          let mostNegative = 'N/A';
          let mostExcellent = 'N/A';
          let maxExcellent = -1;
          let mostPoor = 'N/A';
          let maxPoor = -1;

          Object.keys(questionGroups).forEach(q => {
            const group = questionGroups[q];
            const avg = group.totalScore / group.count;
            if (avg > highestAvg) {
              highestAvg = avg;
              highestQ = `${q} (${avg.toFixed(1)}%)`;
            }
            if (avg < lowestAvg) {
              lowestAvg = avg;
              lowestQ = `${q} (${avg.toFixed(1)}%)`;
            }
            if (group.excellentCount > maxExcellent) {
              maxExcellent = group.excellentCount;
              mostExcellent = q;
            }
            if (group.poorCount > maxPoor) {
              maxPoor = group.poorCount;
              mostPoor = q;
            }
          });

          setQuestionPerf({
            highestScoring: highestQ,
            lowestScoring: lowestQ,
            mostPositive: highestQ.split(' (')[0],
            mostNegative: lowestQ.split(' (')[0],
            mostExcellent: mostExcellent,
            mostPoor: mostPoor,
            mostCommented: Object.keys(questionGroups)[0] || 'N/A'
          });
        }
      }
    } catch (e) {
      console.error('Error fetching vendor satisfaction data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [cycleFilter, statusFilter, searchQuery]);

  const categoryChartOptions = {
    chart: { id: 'vendor-categories', toolbar: { show: false }, background: 'transparent' },
    theme: { mode: isDark ? 'dark' : 'light' },
    xaxis: {
      categories: vendorAnalytics.map(v => v.category),
      labels: { style: { colors: isDark ? '#ffffff' : '#666666' } }
    },
    yaxis: {
      labels: { style: { colors: isDark ? '#ffffff' : '#666666' } }
    },
    colors: ['#00796b'],
    plotOptions: { bar: { borderRadius: 4, horizontal: true } }
  };
  const categoryChartSeries = [{
    name: 'Satisfaction Score',
    data: vendorAnalytics.map(v => v.score)
  }];

  const metrics = [
    { label: 'Assigned Surveys', value: stats.assigned, color: '#1e88e5', icon: <IconUsers size={22} /> },
    { label: 'Completed Surveys', value: stats.completed, color: '#2e7d32', icon: <IconMoodSmile size={22} /> },
    { label: 'Pending Reviews', value: stats.pending, color: '#ed6c02', icon: <IconClock size={22} /> },
    { label: 'Overdue Responses', value: stats.overdue, color: '#d32f2f', icon: <IconAlertCircle size={22} /> },
    { label: 'Closed Surveys', value: stats.closed, color: '#757575', icon: <IconArchive size={22} /> },
    { label: 'Satisfaction Index', value: `${stats.satisfactionIndex?.toFixed(1)}%`, color: '#6a1b9a', icon: <IconTrendingUp size={22} /> }
  ];

  const renderRankingCell = (row, colId, value) => {
    if (colId === 'ranking') return `#${value}`;
    if (colId === 'scoreDisplay') return `${row.score?.toFixed(1)}%`;
    if (colId === 'status') {
      return <BOSStatusChip status={row.status} showIcon={true} width={130} />;
    }
    return value;
  };

  const renderDetailedCell = (row, colId, value) => {
    if (colId === 'scoreDisplay') return `${row.score?.toFixed(1)}%`;
    if (colId === 'rating') {
      return <BOSStatusChip status={row.rating} showIcon={true} width={130} />;
    }
    return value;
  };

  const renderRiskCell = (row, colId, value) => {
    if (colId === 'scoreDisplay') return `${row.score?.toFixed(1)}%`;
    if (colId === 'riskCategory') {
      return <BOSStatusChip status={row.riskCategory} showIcon={true} width={130} />;
    }
    return value;
  };

  const renderReminderCell = (row, colId, value) => {
    if (colId === 'status') {
      return <BOSStatusChip status={row.status} showIcon={true} width={130} />;
    }
    if (colId === 'mailStatus') {
      return <BOSStatusChip status={row.mailStatus} showIcon={true} width={130} />;
    }
    return value;
  };

  return (
    <MainCard
      fullWidth
      title={
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconTruck size={24} color="#00796b" />
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650, display: 'block', mb: 0.2 }}>
              Home / HRA / Vendor Satisfaction
            </Typography>
            <Typography variant="h3">Vendor Satisfaction Dashboard</Typography>
          </Box>
        </Stack>
      }
    >
      {/* KPI Ribbon */}
      <Box sx={{ mb: 4, px: { xs: 2, sm: 3.5 } }}>
        <Grid container spacing={3}>
          {metrics.map((kpi, idx) => (
            <Grid item xs={12} sm={4} md={2} key={idx}>
              <Box sx={{
                p: 3,
                bgcolor: 'background.paper',
                borderRadius: '16px',
                border: '1px solid',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.06)'
                }
              }}>
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                    {kpi.label}
                  </Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.75rem', color: 'text.primary', lineHeight: 1.2 }}>
                    {kpi.value}
                  </Typography>
                </Stack>
                <Box sx={{
                  p: 1.5,
                  borderRadius: '12px',
                  bgcolor: isDark ? 'rgba(255,255,255,0.04)' : `${kpi.color}12`,
                  color: kpi.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {kpi.icon}
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Sub Tabs Navigation */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: isDark ? 'background.default' : '#fcfcfc', p: 0.5 }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
          sx={{
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '1.5px'
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              py: 2.5,
              px: 3,
              maxWidth: 'none',
              flexGrow: 1,
              color: 'text.secondary',
              '&.Mui-selected': {
                color: 'primary.main'
              }
            }
          }}
        >
          <Tab icon={<IconChartBar size={18} />} label="Score Summary & Question Performance" iconPosition="start" />
          <Tab icon={<IconTrendingUp size={18} />} label="Vendor Performance" iconPosition="start" />
          <Tab icon={<IconFileSpreadsheet size={18} />} label="Detailed Responses" iconPosition="start" />
          <Tab icon={<IconAlertTriangle size={18} />} label="Risk Analysis" iconPosition="start" />
          <Tab icon={<IconMail size={18} />} label="Reminder Tracking" iconPosition="start" />
        </Tabs>
      </Box>

      <Box sx={{ py: 3, px: { xs: 2, sm: 3.5 }, width: '100%', boxSizing: 'border-box' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Tab 0: Score Summary & Question Performance */}
            {activeTab === 0 && (
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: 3,
                width: '100%',
                flexGrow: 1
              }}>
                <Box sx={{ p: 3, bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)', borderRadius: '12px', border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', height: '100%', flexGrow: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
                    Vendor Score Summary Metrics
                  </Typography>
                  <Stack spacing={2}>
                    {[
                      { label: 'Total Responses', value: stats.totalResponses, desc: 'Feedback counts collected so far.' },
                      { label: 'Average Score', value: `${stats.averageScore?.toFixed(1)}%`, desc: 'Standard average score of all criteria.' },
                      { label: 'Highest Score', value: `${stats.highestScore?.toFixed(1)}%`, desc: 'Top feedback average score.' },
                      { label: 'Lowest Score', value: `${stats.lowestScore?.toFixed(1)}%`, desc: 'Lowest feedback average score.' },
                      { label: 'Vendor Satisfaction Index', value: `${stats.satisfactionIndex?.toFixed(1)}%`, desc: 'Consolidated performance indicator.', highlight: true }
                    ].map((item, idx) => (
                      <Box key={idx} sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 2,
                        borderRadius: '8px',
                        bgcolor: item.highlight ? (isDark ? 'rgba(30,136,229,0.1)' : 'primary.light') : 'background.paper',
                        border: item.highlight ? '1px solid' : 'none',
                        borderColor: 'primary.main'
                      }}>
                        <Stack>
                          <Typography variant="subtitle1" sx={{ fontWeight: item.highlight ? 700 : 600 }}>
                            {item.label}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {item.desc}
                          </Typography>
                        </Stack>
                        <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: item.highlight ? 'primary.main' : 'text.primary' }}>
                          {item.value}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
                <Box sx={{ p: 3, bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)', borderRadius: '12px', border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', height: '100%', flexGrow: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
                    Question Performance Analysis
                  </Typography>
                  <Stack spacing={1.5}>
                    {[
                      { label: 'Highest Scoring Question', value: questionPerf.highestScoring, color: 'success.main' },
                      { label: 'Lowest Scoring Question', value: questionPerf.lowestScoring, color: 'error.main' },
                      { label: 'Most Positive Question', value: questionPerf.mostPositive, color: 'text.primary' },
                      { label: 'Most Negative Question', value: questionPerf.mostNegative, color: 'text.primary' },
                      { label: 'Most Frequently Rated Excellent', value: questionPerf.mostExcellent, color: 'text.primary' },
                      { label: 'Most Frequently Rated Poor', value: questionPerf.mostPoor, color: 'text.primary' },
                      { label: 'Most Commented Question', value: questionPerf.mostCommented, color: 'text.primary' }
                    ].map((item, idx) => (
                      <Box key={idx} sx={{
                        p: 2,
                        borderRadius: '8px',
                        bgcolor: 'background.paper',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.5
                      }}>
                        <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                          {item.label}
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: item.color }}>
                          {item.value}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Box>
            )}

            {/* Tab 1: Vendor Category Performance */}
            {activeTab === 1 && (
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '4fr 6fr' },
                gap: 3,
                width: '100%',
                flexGrow: 1
              }}>
                <Box sx={{ p: 3, bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)', borderRadius: '12px', border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', height: '100%', flexGrow: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
                    Supplier Satisfaction Index
                  </Typography>
                  <BOSDataTable
                    columns={rankingColumns}
                    rows={vendorAnalytics.slice(page * size, page * size + size).map(v => ({ ...v, scoreDisplay: v.score }))}
                    page={page}
                    size={size}
                    totalCount={vendorAnalytics.length}
                    loading={loading}
                    onPageChange={setPage}
                    onSizeChange={(s) => { setSize(s); setPage(0); }}
                    renderCell={renderRankingCell}
                  />
                </Box>
                <Box sx={{ p: 3, bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)', borderRadius: '12px', border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', flexGrow: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
                    Supplier Average Scores Visualization
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320, width: '100%' }}>
                    <Chart options={categoryChartOptions} series={categoryChartSeries} type="bar" height={320} style={{ width: '100%' }} />
                  </Box>
                </Box>
              </Box>
            )}

            {/* Tab 2: Detailed Responses */}
            {activeTab === 2 && (
              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                <BOSDataTable
                  columns={detailedColumns}
                  rows={detailedResponses
                    .filter(r => {
                      const q = searchQuery.toLowerCase();
                      return r.vendorId.toLowerCase().includes(q) || r.vendorName.toLowerCase().includes(q);
                    })
                    .slice(page * size, page * size + size)
                    .map(r => ({ ...r, scoreDisplay: r.score }))
                  }
                  page={page}
                  size={size}
                  totalCount={detailedResponses.filter(r => {
                    const q = searchQuery.toLowerCase();
                    return r.vendorId.toLowerCase().includes(q) || r.vendorName.toLowerCase().includes(q);
                  }).length}
                  loading={loading}
                  onPageChange={setPage}
                  onSizeChange={(s) => { setSize(s); setPage(0); }}
                  renderCell={renderDetailedCell}
                />
              </Box>
            )}

            {/* Tab 3: Risk Analysis */}
            {activeTab === 3 && (
              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                <BOSDataTable
                  columns={riskColumns}
                  rows={riskAnalysis.slice(page * size, page * size + size).map(r => ({ ...r, scoreDisplay: r.score }))}
                  page={page}
                  size={size}
                  totalCount={riskAnalysis.length}
                  loading={loading}
                  onPageChange={setPage}
                  onSizeChange={(s) => { setSize(s); setPage(0); }}
                  renderCell={renderRiskCell}
                />
              </Box>
            )}

            {/* Tab 4: Reminder Tracking */}
            {activeTab === 4 && (
              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                <BOSDataTable
                  columns={reminderColumns}
                  rows={reminders.slice(page * size, page * size + size)}
                  page={page}
                  size={size}
                  totalCount={reminders.length}
                  loading={loading}
                  onPageChange={setPage}
                  onSizeChange={(s) => { setSize(s); setPage(0); }}
                  renderCell={renderReminderCell}
                />
              </Box>
            )}
          </>
        )}
      </Box>
    </MainCard>
  );
}