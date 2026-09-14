import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating,
  CircularProgress,
  Chip,
  Tooltip,
  IconButton,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  IconDashboard,
  IconRefresh,
  IconUsers,
  IconClipboardCheck,
  IconClock,
  IconAlertTriangle,
  IconLock,
  IconAward,
  IconStar,
  IconMail,
  IconPlus,
  IconSend
} from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, BOSTableToolbar } from 'ui-component/bos';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

// ==============================|| EMPLOYEE SATISFACTION DASHBOARD ||============================== //

export default function EmployeeSatisfactionDashboard() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('Employee');
  const [selectedCycle, setSelectedCycle] = useState('Q2 2026');
  const [activeTab, setActiveTab] = useState(0);

  // Assign Feedback Dialog States
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignForm, setAssignForm] = useState({
    satisfactionType: 'Employee',
    feedbackCycle: 'Q2 2026',
    entityId: '',
    entityName: '',
    dueDate: '',
    message: 'We value your input! Please take a few moments to fill out our Satisfaction survey.'
  });
  const [assignErrors, setAssignErrors] = useState({});

  // Dashboard states
  const [kpis, setKpis] = useState({ assigned: 0, completed: 0, pending: 0, overdue: 0, closed: 0 });
  const [overallScore, setOverallScore] = useState({
    totalResponses: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
    overallSatisfactionScore: 0
  });
  const [responses, setResponses] = useState([]);
  const [reminders, setReminders] = useState([]);

  const perms = usePagePermissions(PAGE_CODES.EMP_SATISFACTION_DASHBOARD);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleAssignClose = () => {
    setAssignOpen(false);
    setAssignForm({
      satisfactionType: selectedType,
      feedbackCycle: selectedCycle,
      entityId: '',
      entityName: '',
      dueDate: '',
      message: `We value your input! Please take a few moments to fill out our ${selectedType} Satisfaction survey.`
    });
    setAssignErrors({});
  };

  const handleAssignFormChange = (e) => {
    const { name, value } = e.target;
    setAssignForm((prev) => ({ ...prev, [name]: value }));
    if (assignErrors[name]) {
      setAssignErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleAssignSubmit = async () => {
    const errors = {};
    if (!assignForm.entityId.trim()) errors.entityId = 'Entity ID is required';
    if (!assignForm.entityName.trim()) errors.entityName = 'Recipient name is required';
    if (!assignForm.dueDate) errors.dueDate = 'Due Date is required';
    if (!assignForm.message.trim()) errors.message = 'Invitation message is required';

    if (Object.keys(errors).length > 0) {
      setAssignErrors(errors);
      return;
    }

    setAssignLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newReminder = {
        id: Date.now(),
        entityId: assignForm.entityId,
        entityName: assignForm.entityName,
        satisfactionType: assignForm.satisfactionType,
        reminderCount: 0,
        lastReminderDate: null,
        nextReminderDate: assignForm.dueDate,
        feedbackStatus: 'Assigned',
        emailStatus: 'Sent'
      };

      setReminders((prev) => [newReminder, ...prev]);

      // update KPIs locally
      setKpis((prev) => ({
        ...prev,
        assigned: prev.assigned + 1
      }));

      dispatch(
        openSnackbar({
          open: true,
          message: `Feedback request successfully assigned to ${assignForm.entityName}!`,
          variant: 'alert',
          severity: 'success',
          alert: { variant: 'filled' }
        })
      );

      handleAssignClose();
    } catch (err) {
      console.error(err);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to assign feedback request.',
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setAssignLoading(false);
    }
  };

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/master/hr/satisfaction-dashboard/data', {
        params: { type: selectedType }
      });
      const data = response.data || {};
      setKpis(data.kpis || { assigned: 0, completed: 0, pending: 0, overdue: 0, closed: 0 });
      setOverallScore(
        data.overallScore || { totalResponses: 0, averageScore: 0, highestScore: 0, lowestScore: 0, overallSatisfactionScore: 0 }
      );
      setResponses(data.responses || []);
      setReminders(data.reminders || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to load dashboard data', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [selectedType, dispatch]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Tables Columns Configuration
  const responseColumns = useMemo(
    () => [
      { id: 'index', label: 'S.No', minWidth: 60 },
      { id: 'entityId', label: 'Entity ID', bold: true, color: 'primary.main', minWidth: 100 },
      { id: 'entityName', label: 'Entity Name', minWidth: 180 },
      { id: 'satisfactionType', label: 'Satisfaction Type', minWidth: 130 },
      { id: 'question', label: 'Question', minWidth: 280 },
      {
        id: 'rating',
        label: 'Rating',
        minWidth: 140,
        render: (row) => <Rating value={row.rating} readOnly size="small" precision={0.5} />
      },
      {
        id: 'score',
        label: 'Score (%)',
        minWidth: 90,
        render: (row) => `${row.score}%`
      },
      { id: 'comment', label: 'Comment', minWidth: 200 },
      { id: 'submittedDate', label: 'Submitted Date', minWidth: 150 }
    ],
    []
  );

  const reminderColumns = useMemo(
    () => [
      { id: 'index', label: 'S.No', minWidth: 60 },
      { id: 'entityId', label: 'Entity ID', bold: true, color: 'primary.main', minWidth: 100 },
      { id: 'entityName', label: 'Entity Name', minWidth: 180 },
      { id: 'satisfactionType', label: 'Satisfaction Type', minWidth: 130 },
      { id: 'reminderCount', label: 'Reminder Count', minWidth: 120 },
      { id: 'lastReminderDate', label: 'Last Reminder Date', minWidth: 150 },
      { id: 'nextReminderDate', label: 'Next Reminder Date', minWidth: 150 },
      {
        id: 'feedbackStatus',
        label: 'Feedback Status',
        minWidth: 130,
        render: (row) => {
          let color = 'default';
          if (row.feedbackStatus === 'Completed') color = 'success';
          else if (row.feedbackStatus === 'Pending') color = 'warning';
          else if (row.feedbackStatus === 'Overdue') color = 'error';
          else if (row.feedbackStatus === 'Assigned') color = 'primary';
          else if (row.feedbackStatus === 'Closed') color = 'secondary';

          return <Chip label={row.feedbackStatus} color={color} size="small" variant="outlined" />;
        }
      },
      {
        id: 'emailStatus',
        label: 'Email Status',
        minWidth: 120,
        render: (row) => {
          let color = 'default';
          if (row.emailStatus === 'Sent') color = 'success';
          else if (row.emailStatus === 'Pending') color = 'warning';
          else if (row.emailStatus === 'Failed') color = 'error';
          else if (row.emailStatus === 'Bounced') color = 'secondary';

          return <Chip label={row.emailStatus} color={color} size="small" variant="light" />;
        }
      }
    ],
    []
  );

  // Map rows with index and formatted dates
  const formattedResponses = useMemo(() => {
    return responses.map((r, i) => ({
      ...r,
      index: i + 1,
      submittedDate: r.submittedDate ? new Date(r.submittedDate).toLocaleDateString() : '-'
    }));
  }, [responses]);

  const formattedReminders = useMemo(() => {
    return reminders.map((r, i) => ({
      ...r,
      index: i + 1,
      lastReminderDate: r.lastReminderDate ? new Date(r.lastReminderDate).toLocaleDateString() : '-',
      nextReminderDate: r.nextReminderDate ? new Date(r.nextReminderDate).toLocaleDateString() : '-'
    }));
  }, [reminders]);

  return (
    <MainCard
      content={false}
      sx={{
        bgcolor: 'transparent',
        boxShadow: 'none'
      }}
    >
      {/* Premium Structured Header */}
      <Box
        sx={{
          mb: 4,
          p: 3,
          borderRadius: '16px',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 4px 20px rgba(0,0,0,0.015)'
        }}
      >
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} md={5}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: '12px',
                  bgcolor: 'primary.lighter',
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(33, 150, 243, 0.15)'
                }}
              >
                <IconDashboard size={28} />
              </Box>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  Employee Satisfaction Dashboard
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Monitor sentiment, review feedback, and manage cycles
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={7}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="flex-end"
              alignItems={{ xs: 'stretch', sm: 'center' }}
            >
              {/* Satisfaction Type Dropdown */}
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel id="dash-satisfaction-type-label">Type</InputLabel>
                <Select
                  labelId="dash-satisfaction-type-label"
                  id="dash-satisfaction-type"
                  value={selectedType}
                  label="Type"
                  onChange={(e) => setSelectedType(e.target.value)}
                  sx={{ borderRadius: '10px' }}
                >
                  <MenuItem value="Employee">Employee</MenuItem>
                  <MenuItem value="Vendor">Vendor</MenuItem>
                  <MenuItem value="Customer">Customer</MenuItem>
                  <MenuItem value="Internal Customer">Internal Customer</MenuItem>
                </Select>
              </FormControl>

              {/* Feedback Cycle Dropdown */}
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel id="dash-feedback-cycle-label">Feedback Cycle</InputLabel>
                <Select
                  labelId="dash-feedback-cycle-label"
                  id="dash-feedback-cycle"
                  value={selectedCycle}
                  label="Feedback Cycle"
                  onChange={(e) => setSelectedCycle(e.target.value)}
                  sx={{ borderRadius: '10px' }}
                >
                  <MenuItem value="Q1 2026">Q1 2026</MenuItem>
                  <MenuItem value="Q2 2026">Q2 2026 (Active)</MenuItem>
                  <MenuItem value="H1 2026">H1 2026</MenuItem>
                  <MenuItem value="Annual 2025">Annual 2025</MenuItem>
                </Select>
              </FormControl>

              {/* Assign Feedback Primary Button */}
              <Button
                variant="contained"
                color="primary"
                startIcon={<IconPlus size={20} />}
                onClick={() => setAssignOpen(true)}
                sx={{
                  borderRadius: '10px',
                  px: 2.5,
                  py: 1,
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                  '&:hover': {
                    boxShadow: '0 6px 20px rgba(33, 150, 243, 0.4)'
                  }
                }}
              >
                Assign Feedback
              </Button>

              <Tooltip title="Refresh Dashboard">
                <IconButton
                  onClick={fetchDashboardData}
                  color="primary"
                  size="small"
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '10px',
                    p: 1,
                    height: '40px',
                    width: '40px'
                  }}
                >
                  <IconRefresh size={20} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {/* Clean Tab-based Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="dashboard navigation tabs"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              minWidth: 120,
              pb: 1.5,
              color: 'text.secondary',
              '&.Mui-selected': {
                color: 'primary.main'
              }
            },
            '& .MuiTabs-indicator': {
              height: '3px',
              borderRadius: '3px 3px 0 0'
            }
          }}
        >
          <Tab label="Overview" icon={<IconDashboard size={18} />} iconPosition="start" />
          <Tab label="Feedback Responses" icon={<IconAward size={18} />} iconPosition="start" />
          <Tab label="Reminder Tracking" icon={<IconMail size={18} />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      {activeTab === 0 && (
        <Stack spacing={4}>
          {/* Metrics summary cards */}
          <Grid container spacing={3}>
            {[
              { label: 'Assigned', value: kpis.assigned, color: '#4f46e5', bg: 'rgba(79, 70, 229, 0.05)', icon: <IconUsers size={28} /> },
              {
                label: 'Completed',
                value: kpis.completed,
                color: '#10b981',
                bg: 'rgba(16, 185, 129, 0.05)',
                icon: <IconClipboardCheck size={28} />
              },
              { label: 'Pending', value: kpis.pending, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.05)', icon: <IconClock size={28} /> },
              {
                label: 'Overdue',
                value: kpis.overdue,
                color: '#ef4444',
                bg: 'rgba(239, 68, 68, 0.05)',
                icon: <IconAlertTriangle size={28} />
              },
              { label: 'Closed', value: kpis.closed, color: '#6b7280', bg: 'rgba(107, 114, 128, 0.05)', icon: <IconLock size={28} /> }
            ].map((kpi, idx) => (
              <Grid item xs={12} sm={6} md={2.4} key={idx}>
                <Card
                  sx={{
                    borderRadius: '16px',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.01)',
                    background: `linear-gradient(135deg, ${kpi.bg} 0%, rgba(255,255,255,0.8) 100%)`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 10px 20px rgba(0,0,0,0.04)',
                      borderColor: kpi.color
                    }
                  }}
                >
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          sx={{
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            fontSize: '0.75rem',
                            letterSpacing: '0.08em'
                          }}
                        >
                          {kpi.label}
                        </Typography>
                        <Typography
                          variant="h2"
                          sx={{
                            mt: 1,
                            fontWeight: 800,
                            fontSize: '2rem',
                            color: 'text.primary'
                          }}
                        >
                          {loading ? <CircularProgress size={20} thickness={5} /> : kpi.value}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: '12px',
                          color: kpi.color,
                          bgcolor: kpi.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid',
                          borderColor: 'rgba(0,0,0,0.03)'
                        }}
                      >
                        {kpi.icon}
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Overall Score Summary */}
          <Card
            sx={{
              borderRadius: '16px',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 4px 12px rgba(0,0,0,0.01)',
              background: 'background.paper'
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
                Overall Performance Score Summary
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Grid container spacing={4} alignItems="center">
                  {/* Visual Gauge */}
                  <Grid item xs={12} md={4}>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 4,
                        borderRadius: '16px',
                        bgcolor: 'grey.50',
                        border: '1px solid',
                        borderColor: 'grey.100',
                        position: 'relative',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)'
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        color="text.secondary"
                        sx={{ fontWeight: 700, mb: 3, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.8rem' }}
                      >
                        SATISFACTION SCORE
                      </Typography>
                      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                        <CircularProgress variant="determinate" value={100} size={140} thickness={6} sx={{ color: 'grey.200' }} />
                        <CircularProgress
                          variant="determinate"
                          value={overallScore.overallSatisfactionScore}
                          size={140}
                          thickness={6}
                          color={
                            overallScore.overallSatisfactionScore >= 75
                              ? 'success'
                              : overallScore.overallSatisfactionScore >= 50
                                ? 'warning'
                                : 'error'
                          }
                          sx={{
                            position: 'absolute',
                            left: 0,
                            '& .MuiCircularProgress-circle': { strokeLinecap: 'round' }
                          }}
                        />
                        <Box
                          sx={{
                            top: 0,
                            left: 0,
                            bottom: 0,
                            right: 0,
                            position: 'absolute',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column'
                          }}
                        >
                          <Typography variant="h1" sx={{ fontWeight: 800, fontSize: '2.2rem' }}>
                            {overallScore.overallSatisfactionScore}%
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 3, fontWeight: 600 }}>
                        Based on {overallScore.totalResponses} submissions
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Score Stats Grid */}
                  <Grid item xs={12} md={8}>
                    <Grid container spacing={3}>
                      {[
                        {
                          title: 'Total Responses',
                          value: overallScore.totalResponses,
                          icon: <IconUsers size={22} />,
                          color: '#4f46e5',
                          bg: 'rgba(79, 70, 229, 0.05)'
                        },
                        {
                          title: 'Average Score',
                          value: `${overallScore.averageScore}%`,
                          icon: <IconAward size={22} />,
                          color: '#10b981',
                          bg: 'rgba(16, 185, 129, 0.05)'
                        },
                        {
                          title: 'Highest Score',
                          value: `${overallScore.highestScore}%`,
                          icon: <IconStar size={22} />,
                          color: '#f59e0b',
                          bg: 'rgba(245, 158, 11, 0.05)'
                        },
                        {
                          title: 'Lowest Score',
                          value: `${overallScore.lowestScore}%`,
                          icon: <IconAlertTriangle size={22} />,
                          color: '#ef4444',
                          bg: 'rgba(239, 68, 68, 0.05)'
                        }
                      ].map((stat, idx) => (
                        <Grid item xs={12} sm={6} key={idx}>
                          <Box
                            sx={{
                              p: 3,
                              borderRadius: '16px',
                              border: '1px solid',
                              borderColor: 'divider',
                              bgcolor: 'background.paper',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2.5,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.01)',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                borderColor: stat.color,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                              }
                            }}
                          >
                            <Box
                              sx={{
                                p: 1.75,
                                borderRadius: '12px',
                                color: stat.color,
                                bgcolor: stat.bg,
                                display: 'flex',
                                alignItems: 'center',
                                border: '1px solid',
                                borderColor: 'rgba(0,0,0,0.02)'
                              }}
                            >
                              {stat.icon}
                            </Box>
                            <Box>
                              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                {stat.title}
                              </Typography>
                              <Typography variant="h3" sx={{ mt: 0.5, fontWeight: 800, fontSize: '1.5rem', color: 'text.primary' }}>
                                {stat.value}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Stack>
      )}

      {activeTab === 1 && (
        <MainCard
          contentSX={{ p: 0 }}
          icon={IconAward}
      title={"Feedback Responses Details"}
          secondary={
            <BOSTableToolbar
              onRefresh={fetchDashboardData}
              exportData={formattedResponses}
              exportFilename={`Feedback_Responses_${selectedType}`}
              hasExportPermission={perms.export}
            />
          }
          sx={{
            borderRadius: '16px',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 4px 12px rgba(0,0,0,0.01)',
            overflow: 'hidden'
          }}
        >
          <BOSDataTable columns={responseColumns} rows={formattedResponses} loading={loading} />
        </MainCard>
      )}

      {activeTab === 2 && (
        <MainCard
          contentSX={{ p: 0 }}
          icon={IconMail}
      title={"Reminder Tracking Logs"}
          secondary={
            <BOSTableToolbar
              onRefresh={fetchDashboardData}
              exportData={formattedReminders}
              exportFilename={`Reminder_Tracking_${selectedType}`}
              hasExportPermission={perms.export}
            />
          }
          sx={{
            borderRadius: '16px',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 4px 12px rgba(0,0,0,0.01)',
            overflow: 'hidden'
          }}
        >
          <BOSDataTable columns={reminderColumns} rows={formattedReminders} loading={loading} />
        </MainCard>
      )}

      {/* Assign Feedback Dialog */}
      <Dialog
        open={assignOpen}
        onClose={handleAssignClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                p: 1,
                borderRadius: '8px',
                bgcolor: 'primary.lighter',
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <IconMail size={22} />
            </Box>
            <Typography variant="h4" fontWeight={700}>
              Assign New Feedback
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create a new satisfaction survey request. Recipients will receive an email notification with access instructions.
          </Typography>
          <Stack spacing={2.5}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel id="assign-type-label">Satisfaction Type</InputLabel>
                  <Select
                    labelId="assign-type-label"
                    name="satisfactionType"
                    value={assignForm.satisfactionType}
                    label="Satisfaction Type"
                    onChange={handleAssignFormChange}
                    sx={{ borderRadius: '10px' }}
                  >
                    <MenuItem value="Employee">Employee</MenuItem>
                    <MenuItem value="Vendor">Vendor</MenuItem>
                    <MenuItem value="Customer">Customer</MenuItem>
                    <MenuItem value="Internal Customer">Internal Customer</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel id="assign-cycle-label">Feedback Cycle</InputLabel>
                  <Select
                    labelId="assign-cycle-label"
                    name="feedbackCycle"
                    value={assignForm.feedbackCycle}
                    label="Feedback Cycle"
                    onChange={handleAssignFormChange}
                    sx={{ borderRadius: '10px' }}
                  >
                    <MenuItem value="Q1 2026">Q1 2026</MenuItem>
                    <MenuItem value="Q2 2026">Q2 2026</MenuItem>
                    <MenuItem value="H1 2026">H1 2026</MenuItem>
                    <MenuItem value="Annual 2025">Annual 2025</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              fullWidth
              size="small"
              name="entityId"
              label="Recipient Entity ID"
              placeholder="e.g. EMP045"
              value={assignForm.entityId}
              onChange={handleAssignFormChange}
              error={!!assignErrors.entityId}
              helperText={assignErrors.entityId}
              slotProps={{
                htmlInput: { sx: { borderRadius: '10px' } }
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />

            <TextField
              fullWidth
              size="small"
              name="entityName"
              label="Recipient Name"
              placeholder="e.g. Sarah Jenkins"
              value={assignForm.entityName}
              onChange={handleAssignFormChange}
              error={!!assignErrors.entityName}
              helperText={assignErrors.entityName}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />

            <TextField
              fullWidth
              size="small"
              name="dueDate"
              label="Due Date"
              type="date"
              value={assignForm.dueDate}
              onChange={handleAssignFormChange}
              error={!!assignErrors.dueDate}
              helperText={assignErrors.dueDate}
              InputLabelProps={{ shrink: true }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />

            <TextField
              fullWidth
              size="small"
              name="message"
              label="Custom Invitation Message"
              placeholder="Please share your feedback regarding your recent experience..."
              multiline
              rows={3}
              value={assignForm.message}
              onChange={handleAssignFormChange}
              error={!!assignErrors.message}
              helperText={assignErrors.message}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={handleAssignClose}
            color="inherit"
            disabled={assignLoading}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssignSubmit}
            variant="contained"
            color="primary"
            disabled={assignLoading}
            startIcon={assignLoading ? <CircularProgress size={16} /> : <IconSend size={16} />}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(33, 150, 243, 0.2)'
            }}
          >
            {assignLoading ? 'Assigning...' : 'Assign Feedback'}
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}
