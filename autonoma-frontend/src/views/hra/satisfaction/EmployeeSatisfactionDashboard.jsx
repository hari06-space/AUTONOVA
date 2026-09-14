import { useState, useEffect } from 'react';
import {
  Typography,
  Stack,
  Grid,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Button
} from '@mui/material';
import axios from 'utils/axios';
import {
  IconMoodSmile,
  IconAlertTriangle,
  IconMail,
  IconTrendingUp,
  IconChartBar,
  IconFileSpreadsheet,
  IconUsers,
  IconClock,
  IconAlertCircle,
  IconArchive,
  IconPlus,
  IconBell
} from '@tabler/icons-react';
import { useSelector, useDispatch } from 'react-redux';
import Chart from 'react-apexcharts';
import { useTheme } from '@mui/material/styles';
import { openSnackbar } from 'store/slices/snackbar';
import { setFilterConfig } from 'store/slices/search';
import MainCard from 'ui-component/cards/MainCard';
import {
  BOSDataTable,
  BOSFormDialog,
  BOSFormSection,
  BOSTextField,
  BOSStatusChip,
  btnNew,
  btnNewGradient,
  hoverLift,
  hoverLiftSubtle
} from 'ui-component/bos';

// Automated Client Demonstration Mock Data Layer
// Automated Client Demonstration Mock Data Layer
const mockStats = {
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
};

const mockQuestionPerf = {
  highestScoring: 'N/A',
  lowestScoring: 'N/A',
  mostPositive: 'N/A',
  mostNegative: 'N/A',
  mostExcellent: 'N/A',
  mostPoor: 'N/A',
  mostCommented: 'N/A'
};

const mockDeptAnalytics = [];
const mockDetailedResponses = [];
const mockRiskAnalysis = [];
const mockReminders = [];

const rankingColumns = [
  { id: 'ranking', label: 'RANK', minWidth: 80, align: 'center', bold: true },
  { id: 'department', label: 'DEPARTMENT', minWidth: 200, align: 'left', bold: true },
  { id: 'scoreDisplay', label: 'AVG SCORE', minWidth: 120, align: 'center', bold: true },
  { id: 'status', label: 'STATUS', minWidth: 160, align: 'center', status: true }
];

const detailedColumns = [
  { id: 'empId', label: 'EMPLOYEE ID', minWidth: 130, align: 'left', bold: true },
  { id: 'empName', label: 'EMPLOYEE NAME', minWidth: 180, align: 'left' },
  { id: 'department', label: 'DEPARTMENT', minWidth: 150, align: 'left' },
  { id: 'rating', label: 'RATING', minWidth: 140, align: 'center', status: true },
  { id: 'scoreDisplay', label: 'SCORE', minWidth: 100, align: 'center', bold: true },
  { id: 'comment', label: 'GENERAL COMMENTS', minWidth: 250, align: 'left' },
  { id: 'date', label: 'SUBMISSION DATE', minWidth: 140, align: 'center' }
];

const riskColumns = [
  { id: 'empId', label: 'EMPLOYEE ID', minWidth: 130, align: 'left', bold: true },
  { id: 'empName', label: 'EMPLOYEE NAME', minWidth: 180, align: 'left' },
  { id: 'department', label: 'DEPARTMENT', minWidth: 150, align: 'left' },
  { id: 'scoreDisplay', label: 'AVERAGE SCORE', minWidth: 120, align: 'center', bold: true },
  { id: 'riskCategory', label: 'RISK CATEGORY', minWidth: 140, align: 'center', status: true },
  { id: 'reason', label: 'IDENTIFIED REASON', minWidth: 250, align: 'left' },
  { id: 'action', label: 'RECOMMENDED HR ACTION', minWidth: 250, align: 'left', bold: true }
];

const reminderColumns = [
  { id: 'entityId', label: 'EMPLOYEE ID', minWidth: 130, align: 'left', bold: true },
  { id: 'entityName', label: 'EMPLOYEE NAME', minWidth: 180, align: 'left' },
  { id: 'cycle', label: 'FEEDBACK CYCLE', minWidth: 140, align: 'center' },
  { id: 'reminderCount', label: 'REMINDERS SENT', minWidth: 130, align: 'center', bold: true },
  { id: 'lastDate', label: 'LAST REMINDER', minWidth: 140, align: 'center' },
  { id: 'nextDate', label: 'NEXT REMINDER', minWidth: 140, align: 'center' },
  { id: 'status', label: 'FEEDBACK STATUS', minWidth: 150, align: 'center', status: true },
  { id: 'mailStatus', label: 'MAIL DELIVERY STATUS', minWidth: 160, align: 'center', status: true }
];

export default function EmployeeSatisfactionDashboard() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const isDark = theme.palette.mode === 'dark';
  const [activeTab, setActiveTab] = useState(0);

  // Filters from Redux global filter bar
  const searchQuery = useSelector((state) => state.search?.query || '');
  const globalFilters = useSelector((state) => state.search?.filters || {});
  
  // Local filter states
  const cycleFilter = globalFilters.feedbackCycle || 'ALL';
  const statusFilter = globalFilters.status || 'ALL';
  const [loading, setLoading] = useState(false);

  // Modal States
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [newCycleName, setNewCycleName] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(false);

  // Pagination states
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  // Data States
  const [stats, setStats] = useState(mockStats);
  const [questionPerf, setQuestionPerf] = useState(mockQuestionPerf);
  const [deptAnalytics, setDeptAnalytics] = useState(mockDeptAnalytics);
  const [detailedResponses, setDetailedResponses] = useState(mockDetailedResponses);
  const [riskAnalysis, setRiskAnalysis] = useState(mockRiskAnalysis);
  const [reminders, setReminders] = useState(mockReminders);

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
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {
        cycle: cycleFilter !== 'ALL' ? formatCycleForBackend(cycleFilter) : null,
        status: statusFilter !== 'ALL' ? statusFilter : null,
        search: searchQuery || null
      };

      // 1. Dashboard summary
      const summaryRes = await axios.get('/api/hra/employee-satisfaction/dashboard-summary', { params });
      let currentStats = {
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
      };
      if (summaryRes.data) {
        const apiAssigned = summaryRes.data.totalEligibleEmployees || 0;
        const apiCompleted = summaryRes.data.feedbackCompleted || 0;
        const apiPending = summaryRes.data.feedbackPending || 0;
        const apiOverdue = summaryRes.data.feedbackOverdue || 0;
        const apiClosed = summaryRes.data.feedbackClosed || 0;
        const apiAvg = summaryRes.data.averageSatisfactionScore || 0;

        currentStats = {
          assigned: apiAssigned,
          completed: apiCompleted,
          pending: apiPending,
          overdue: apiOverdue,
          closed: apiClosed,
          totalResponses: apiCompleted,
          averageScore: apiAvg,
          highestScore: apiAvg,
          lowestScore: apiAvg,
          satisfactionIndex: apiAvg
        };
      }
      setStats(currentStats);

      // 2. Mappings list
      const mappingsRes = await axios.get('/api/hra/employee-satisfaction/mappings', { params });
      let finalReminders = [];
      let finalDetailed = [];
      
      if (mappingsRes.data && mappingsRes.data.length > 0) {
        const mappings = mappingsRes.data;

        // Extract completed detailed responses
        const completedMappings = mappings.filter(m => m.status === 'Completed');
        if (completedMappings.length > 0) {
          finalDetailed = completedMappings.map(m => {
            const avgScore = parseFloat(m.averageScore) || 0;
            let rating = 'Moderate';
            if (avgScore >= 90) rating = 'Excellent';
            else if (avgScore >= 75) rating = 'Very Good';
            else if (avgScore >= 50) rating = 'Good';
            else if (avgScore < 25) rating = 'Poor';

            return {
              id: m.id,
              empId: m.employeeId,
              empName: m.employeeName,
              department: m.department,
              question: 'Overall Satisfaction',
              rating: rating,
              score: avgScore,
              comment: m.generalComments || m.suggestions || 'No comments',
              date: m.submittedDate ? m.submittedDate.split(' ')[0] : 'N/A'
            };
          });
        }

        // Reminders list
        finalReminders = mappings.map(m => ({
          entityId: m.employeeId,
          entityName: m.employeeName,
          entityType: 'Employee',
          cycle: m.feedbackCycle,
          reminderCount: m.reminderCount || 0,
          lastDate: m.lastReminderDate !== 'N/A' ? m.lastReminderDate : '',
          nextDate: m.nextReminderDate !== 'N/A' ? m.nextReminderDate : '',
          status: m.status,
          mailStatus: m.reminderCount > 0 ? 'Delivered' : 'Not Sent'
        }));
      }
      setDetailedResponses(finalDetailed);
      setReminders(finalReminders);

      // 3. Department Analytics
      const analyticsRes = await axios.get('/api/hra/employee-satisfaction/analytics', { params });
      let finalDeptAnalytics = [];
      if (analyticsRes.data && Object.keys(analyticsRes.data.departmentAverages || {}).length > 0) {
        const deptMap = analyticsRes.data.departmentAverages || {};
        finalDeptAnalytics = Object.keys(deptMap).map((dept, idx) => {
          const score = parseFloat(deptMap[dept]) || 0;
          return {
            department: dept,
            score: score,
            index: score,
            ranking: idx + 1,
            trend: 'Stable',
            status: score >= 75 ? 'Top Performing' : score >= 50 ? 'Stable' : 'Watchlist'
          };
        });
        finalDeptAnalytics.sort((a, b) => b.score - a.score);
        finalDeptAnalytics.forEach((d, idx) => { d.ranking = idx + 1; });
      }
      setDeptAnalytics(finalDeptAnalytics);

      // 4. Risk Employees
      const riskRes = await axios.get('/api/hra/employee-satisfaction/risk-employees', { params });
      let finalRisk = [];
      if (riskRes.data && riskRes.data.length > 0) {
        finalRisk = riskRes.data.map(r => ({
          empId: r.employeeId,
          empName: r.employeeName,
          department: r.department,
          score: r.averageScore,
          riskCategory: r.riskLevel || 'High',
          reason: r.riskLevel === 'High' ? 'Repeated poor scores in support/accuracy' : 'Declining index score',
          action: r.riskLevel === 'High' ? 'HR One-on-One Counseling session scheduled' : 'Department monitoring'
        }));
      }
      setRiskAnalysis(finalRisk);

    } catch (e) {
      console.error('Error fetching employee satisfaction data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [cycleFilter, statusFilter, searchQuery]);

  const handleAssignFeedback = async () => {
    if (!newCycleName.trim()) return;
    setAssignLoading(true);
    try {
      const res = await axios.post(`/api/hra/employee-satisfaction/trigger-auto-assign?cycle=${encodeURIComponent(newCycleName.trim())}`);
      dispatch(
        openSnackbar({
          open: true,
          message: `Auto-assignment completed successfully. Assigned ${res.data.assignedCount || 0} employees.`,
          variant: 'alert',
          severity: 'success'
        })
      );
      setAssignModalOpen(false);
      setNewCycleName('');
      loadData();
    } catch (e) {
      console.error(e);
      dispatch(
        openSnackbar({
          open: true,
          message: e.response?.data?.message || 'Failed to trigger feedback assignment.',
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setAssignLoading(false);
    }
  };

  const handleSendReminder = async () => {
    setReminderLoading(true);
    try {
      await axios.post('/api/hra/employee-satisfaction/trigger-reminders');
      dispatch(
        openSnackbar({
          open: true,
          message: `Reminder notifications broadcasted successfully to all pending employees.`,
          variant: 'alert',
          severity: 'success'
        })
      );
      setReminderModalOpen(false);
      loadData();
    } catch (e) {
      console.error(e);
      dispatch(
        openSnackbar({
          open: true,
          message: e.response?.data?.message || 'Failed to send reminders.',
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setReminderLoading(false);
    }
  };

  const metrics = [
    { label: 'Assigned Surveys', value: stats.assigned, color: '#1e88e5', icon: <IconUsers size={22} /> },
    { label: 'Completed Surveys', value: stats.completed, color: '#2e7d32', icon: <IconMoodSmile size={22} /> },
    { label: 'Pending Reviews', value: stats.pending, color: '#ed6c02', icon: <IconClock size={22} /> },
    { label: 'Overdue Responses', value: stats.overdue, color: '#d32f2f', icon: <IconAlertCircle size={22} /> },
    { label: 'Closed Surveys', value: stats.closed, color: '#757575', icon: <IconArchive size={22} /> },
    { label: 'Satisfaction Index', value: `${stats.satisfactionIndex?.toFixed(1)}%`, color: '#6a1b9a', icon: <IconTrendingUp size={22} /> }
  ];

  const deptChartOptions = {
    chart: { 
      id: 'dept-averages', 
      toolbar: { show: false },
      background: 'transparent'
    },
    theme: {
      mode: isDark ? 'dark' : 'light'
    },
    xaxis: { 
      categories: deptAnalytics.map(d => d.department),
      labels: {
        style: {
          colors: isDark ? '#ffffff' : '#666666'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: isDark ? '#ffffff' : '#666666'
        }
      }
    },
    colors: [theme.palette.primary.main],
    plotOptions: { 
      bar: { 
        borderRadius: 4, 
        horizontal: true,
        barHeight: '60%'
      } 
    },
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return val.toFixed(1) + "%";
      },
      style: {
        fontSize: '11px',
        colors: ['#fff']
      }
    }
  };

  const deptChartSeries = [{
    name: 'Satisfaction Score',
    data: deptAnalytics.map(d => d.score)
  }];

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
          <IconMoodSmile size={24} color={theme.palette.primary.main} />
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650, display: 'block', mb: 0.2 }}>
              Home / HRA / Employee Self Care
            </Typography>
            <Typography variant="h3">Employee Satisfaction</Typography>
          </Box>
        </Stack>
      }
    >

      {/* Row of Summary Metrics Cards */}
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

      {/* Navigation Tabs - Extended Full Width Layout */}
      <Box sx={{ 
        width: '100%',
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderTop: '1px solid',
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        boxShadow: '0 -4px 30px rgba(0,0,0,0.02)',
        overflow: 'hidden'
      }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            width: '100%',
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '2px'
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
          <Tab icon={<IconChartBar size={18} />} label="Overview & Questions" iconPosition="start" sx={{ flexGrow: 1, maxWidth: 'none' }} />
          <Tab icon={<IconTrendingUp size={18} />} label="Department Analytics" iconPosition="start" sx={{ flexGrow: 1, maxWidth: 'none' }} />
          <Tab icon={<IconFileSpreadsheet size={18} />} label="Detailed Responses" iconPosition="start" sx={{ flexGrow: 1, maxWidth: 'none' }} />
          <Tab icon={<IconAlertTriangle size={18} />} label="Risk Analysis" iconPosition="start" sx={{ flexGrow: 1, maxWidth: 'none' }} />
          <Tab icon={<IconMail size={18} />} label="Reminder Logs" iconPosition="start" sx={{ flexGrow: 1, maxWidth: 'none' }} />
        </Tabs>

        {/* Tab Contents - Fully Expanded Layout */}
        <Box sx={{ py: 3, px: { xs: 2, sm: 3.5 }, width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8, flexGrow: 1, alignItems: 'center' }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {activeTab === 0 && (
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                  gap: 3,
                  width: '100%',
                  flexGrow: 1
                }}>
                  {/* Score Summary Metrics */}
                  <Box sx={{ p: 3, bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)', borderRadius: '12px', border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
                      Score Summary Metrics
                    </Typography>
                    <Stack spacing={2} sx={{ flexGrow: 1 }}>
                      {[
                        { label: 'Total Responses', value: stats.totalResponses, desc: 'Feedback counts collected so far.' },
                        { label: 'Average Score', value: `${stats.averageScore?.toFixed(1)}%`, desc: 'Standard average score of all criteria.' },
                        { label: 'Highest Score', value: `${stats.highestScore?.toFixed(1)}%`, desc: 'Top employee feedback average score.' },
                        { label: 'Lowest Score', value: `${stats.lowestScore?.toFixed(1)}%`, desc: 'Lowest employee feedback average score.' },
                        { label: 'Satisfaction Index', value: `${stats.satisfactionIndex?.toFixed(1)}%`, desc: 'Consolidated performance indicator.', highlight: true }
                      ].map((item, idx) => (
                        <Box key={idx} sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 2,
                          borderRadius: '8px',
                          bgcolor: item.highlight ? (isDark ? 'rgba(30,136,229,0.1)' : 'primary.light') : 'background.paper',
                          border: item.highlight ? '1px solid' : 'none',
                          borderColor: 'primary.main',
                          flexGrow: 1
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

                  {/* Question Performance Analysis */}
                  <Box sx={{ p: 3, bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)', borderRadius: '12px', border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
                      Question Performance Analysis
                    </Typography>
                    <Stack spacing={1.5} sx={{ flexGrow: 1 }}>
                      {[
                        { label: 'Highest Scoring Aspect', value: questionPerf.highestScoring, color: 'success.main' },
                        { label: 'Lowest Scoring Aspect', value: questionPerf.lowestScoring, color: 'error.main' },
                        { label: 'Most Positive Topic', value: questionPerf.mostPositive, color: 'text.primary' },
                        { label: 'Most Negative Topic', value: questionPerf.mostNegative, color: 'text.primary' },
                        { label: 'Highest Frequency of Excellent', value: questionPerf.mostExcellent, color: 'text.primary' },
                        { label: 'Highest Frequency of Poor', value: questionPerf.mostPoor, color: 'text.primary' },
                        { label: 'Most Commented Area', value: questionPerf.mostCommented, color: 'text.primary' }
                      ].map((item, idx) => (
                        <Box key={idx} sx={{
                          p: 2,
                          borderRadius: '8px',
                          bgcolor: 'background.paper',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.5,
                          flexGrow: 1,
                          justifyContent: 'center'
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

              {activeTab === 1 && (
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '4fr 6fr' },
                  gap: 3,
                  width: '100%',
                  flexGrow: 1
                }}>
                  {/* Rankings Table */}
                  <Box sx={{ p: 3, bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)', borderRadius: '12px', border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
                      Department Satisfaction Rankings
                    </Typography>
                    <BOSDataTable
                      columns={rankingColumns}
                      rows={deptAnalytics.slice(page * size, page * size + size).map(d => ({ ...d, scoreDisplay: d.score }))}
                      page={page}
                      size={size}
                      totalCount={deptAnalytics.length}
                      loading={loading}
                      onPageChange={setPage}
                      onSizeChange={(s) => { setSize(s); setPage(0); }}
                      renderCell={renderRankingCell}
                    />
                  </Box>

                  {/* Horizontal Bar Chart */}
                  <Box sx={{ p: 3, bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)', borderRadius: '12px', border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
                      Satisfaction Averages By Department
                    </Typography>
                    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320, width: '100%' }}>
                      <Chart options={deptChartOptions} series={deptChartSeries} type="bar" height={320} style={{ width: '100%' }} />
                    </Box>
                  </Box>
                </Box>
              )}

              {activeTab === 2 && (
                <Box sx={{ width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <BOSDataTable
                    columns={detailedColumns}
                    rows={detailedResponses
                      .filter(r => {
                        const q = searchQuery.toLowerCase();
                        return r.empId.toLowerCase().includes(q) || r.empName.toLowerCase().includes(q);
                      })
                      .slice(page * size, page * size + size)
                      .map(r => ({ ...r, scoreDisplay: r.score }))
                    }
                    page={page}
                    size={size}
                    totalCount={detailedResponses.filter(r => {
                      const q = searchQuery.toLowerCase();
                      return r.empId.toLowerCase().includes(q) || r.empName.toLowerCase().includes(q);
                    }).length}
                    loading={loading}
                    onPageChange={setPage}
                    onSizeChange={(s) => { setSize(s); setPage(0); }}
                    renderCell={renderDetailedCell}
                  />
                </Box>
              )}

              {activeTab === 3 && (
                <Box sx={{ width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
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

              {activeTab === 4 && (
                <Box sx={{ width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
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
      </Box>

      {/* Assign Feedback Modal Dialog */}
      <BOSFormDialog
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        onSave={handleAssignFeedback}
        title="Assign Feedback Cycle"
        maxWidth="xs"
        saveButtonDisabled={assignLoading || !newCycleName.trim()}
      >
        <BOSFormSection title="Cycle Details">
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Trigger auto-assignment of employee satisfaction forms for the specified cycle.
          </Typography>
          <BOSTextField
            autoFocus
            label="Feedback Cycle (e.g. 2026-Q2)"
            type="text"
            value={newCycleName}
            onChange={(e) => setNewCycleName(e.target.value)}
            disabled={assignLoading}
            placeholder="2026-Q2"
            required
          />
        </BOSFormSection>
      </BOSFormDialog>

      {/* Reminder Pop-up Overlay Component */}
      <BOSFormDialog
        open={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        onSave={handleSendReminder}
        title="Employee Satisfaction Reminder Message"
        maxWidth="sm"
        saveButtonDisabled={reminderLoading}
      >
        <BOSFormSection title="Reminder Details">
          <BOSTextField
            multiline
            rows={3}
            fullWidth
            defaultValue="Dear Employee, your feedback is valuable to us. Please take a few minutes to complete the Employee Satisfaction Survey for the current cycle."
            placeholder="Enter reminder message..."
            sx={{ mb: 3 }}
          />

          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
            Pending Target Employees ({reminders.filter(r => r.status === 'Pending').length})
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', maxHeight: 200, overflowY: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Employee ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Employee Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Cycle</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reminders.filter(r => r.status === 'Pending').map((emp, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ fontWeight: 600 }}>{emp.entityId}</TableCell>
                    <TableCell>{emp.entityName}</TableCell>
                    <TableCell>{emp.cycle}</TableCell>
                  </TableRow>
                ))}
                {reminders.filter(r => r.status === 'Pending').length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 2, color: 'text.secondary' }}>
                      No pending employees.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </BOSFormSection>
      </BOSFormDialog>

    </MainCard>
  );
}