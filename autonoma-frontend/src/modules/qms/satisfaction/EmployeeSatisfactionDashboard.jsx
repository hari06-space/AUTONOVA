import { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Stack,
  Box,
  Grid,
  Button,
  Card,
  CardContent,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Avatar
} from '@mui/material';
import Chart from 'react-apexcharts';
import {
  IconDashboard,
  IconUsers,
  IconChecks,
  IconAlertTriangle,
  IconChartBar,
  IconBell,
  IconSearch,
  IconPlus,
  IconHistory,
  IconListDetails
} from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import usePagePermissions from 'hooks/usePagePermissions';
import { BOSDataTable, BOSStatusChip, BOSFormDialog } from 'ui-component/bos';

const CURRENT_CYCLE = 'June 2026';

const columnsTracking = [
  { id: 'empCode', label: 'Employee Code', minWidth: 120, fontWeight: 600 },
  { id: 'employeeName', label: 'Name', minWidth: 150 },
  { id: 'department', label: 'Department', minWidth: 130 },
  { id: 'designation', label: 'Designation', minWidth: 130 },
  {
    id: 'joiningDate',
    label: 'Joining Date',
    minWidth: 110,
    render: (row) => row.joiningDate ? new Date(row.joiningDate).toLocaleDateString('en-GB') : '-'
  },
  {
    id: 'status',
    label: 'Status',
    minWidth: 130,
    render: (row) => (
      <BOSStatusChip
        status={row.status}
        showIcon={true}
        width={130}
      />
    )
  },
  {
    id: 'averageScore',
    label: 'Avg Score',
    minWidth: 100,
    align: 'right',
    render: (row) => row.status === 'Completed' ? row.averageScore : '-'
  },
  {
    id: 'riskLevel',
    label: 'Risk Level',
    minWidth: 130,
    render: (row) => row.status === 'Completed' ? (
      <BOSStatusChip
        status={row.riskLevel}
        showIcon={true}
        width={130}
      />
    ) : '-'
  }
];

const columnsReminder = [
  { id: 'empCode', label: 'Employee Code', minWidth: 120, fontWeight: 600 },
  { id: 'employeeName', label: 'Employee Name', minWidth: 150 },
  { id: 'reminderCount', label: 'Reminder Count', minWidth: 100, align: 'right' },
  {
    id: 'firstReminderDate',
    label: 'First Reminder Date',
    minWidth: 160,
    render: (row) => row.firstReminderDate ? new Date(row.firstReminderDate).toLocaleString('en-GB') : '-'
  },
  {
    id: 'lastReminderDate',
    label: 'Last Reminder Date',
    minWidth: 160,
    render: (row) => row.lastReminderDate ? new Date(row.lastReminderDate).toLocaleString('en-GB') : '-'
  },
  {
    id: 'nextReminderDate',
    label: 'Next Scheduled Date',
    minWidth: 160,
    render: (row) => row.nextReminderDate ? new Date(row.nextReminderDate).toLocaleDateString('en-GB') : '-'
  },
  {
    id: 'emailStatus',
    label: 'Email Status',
    minWidth: 130,
    render: (row) => (
      <BOSStatusChip
        status={row.emailStatus || 'Not Sent'}
        showIcon={true}
        width={130}
      />
    )
  }
];

const columnsDetails = [
  {
    id: 'satisfactionCriteria',
    label: 'Question / Criteria',
    minWidth: 350,
    render: (row) => (
      <span dangerouslySetInnerHTML={{ __html: row.question?.satisfactionCriteria || '-' }} />
    )
  },
  {
    id: 'rating',
    label: 'Rating',
    minWidth: 130,
    align: 'center',
    render: (row) => (
      <BOSStatusChip
        status={row.rating}
        showIcon={true}
        width={130}
      />
    )
  },
  { id: 'score', label: 'Score', minWidth: 80, align: 'right' },
  { id: 'comments', label: 'Comments', minWidth: 200, render: (row) => row.comments || '-' }
];

export default function EmployeeSatisfactionDashboard() {
  const dispatch = useDispatch();
  const perms = usePagePermissions('QM1520');

  const [activeTab, setActiveTab] = useState(0);
  const [cycle, setCycle] = useState(CURRENT_CYCLE);
  const [cards, setCards] = useState({
    totalEligible: 0,
    completedFeedback: 0,
    pendingFeedback: 0,
    overdueFeedback: 0,
    completionPercentage: 0,
    averageSatisfactionScore: 0,
    awaitingReminder: 0,
    lowSatisfactionEmployees: 0
  });

  const [departments, setDepartments] = useState([]);
  const [employeesMapping, setEmployeesMapping] = useState([]);
  const [reminderTracking, setReminderTracking] = useState([]);
  const [chartsData, setChartsData] = useState(null);

  // Filters
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedRisk, setSelectedRisk] = useState('All');
  const [scoreMin, setScoreMin] = useState('');
  const [scoreMax, setScoreMax] = useState('');

  // Dialog states
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [timelineDialogOpen, setTimelineDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const [detailResponses, setDetailResponses] = useState([]);
  const [allActiveEmployees, setAllActiveEmployees] = useState([]);
  const [selectedAssignEmps, setSelectedAssignEmps] = useState([]);

  // Pagination states for BOSDataTable components
  const [trackingPage, setTrackingPage] = useState(0);
  const [trackingSize, setTrackingSize] = useState(10);
  const [reminderPage, setReminderPage] = useState(0);
  const [reminderSize, setReminderSize] = useState(10);
  const [assignPage, setAssignPage] = useState(0);
  const [assignSize, setAssignSize] = useState(10);
  const [detailPage, setDetailPage] = useState(0);
  const [detailSize, setDetailSize] = useState(10);

  // Feedback entries (submitted via QMS feedback form)
  const [feedbackEntries, setFeedbackEntries] = useState([]);
  const [feedbackEntriesLoading, setFeedbackEntriesLoading] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState(null);

  // Reset pagination when active tab or filters change
  useEffect(() => {
    setTrackingPage(0);
    setReminderPage(0);
  }, [activeTab, selectedDept, selectedStatus, selectedRisk, scoreMin, scoreMax]);

  // Fetch initial dashboard KPI cards & charts
  const fetchDashboardData = useCallback(async () => {
    try {
      const cardRes = await axios.get('/api/qms/satisfaction/dashboard/cards', { params: { cycle } });
      setCards(cardRes.data);

      const chartRes = await axios.get('/api/qms/satisfaction/dashboard/charts', { params: { cycle } });
      setChartsData(chartRes.data);
    } catch (err) {
      console.error(err);
    }
  }, [cycle]);

  const fetchEmployeesMapping = useCallback(async () => {
    try {
      const params = {
        cycle,
        departmentId: selectedDept !== 'All' ? selectedDept : undefined,
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
        riskLevel: selectedRisk !== 'All' ? selectedRisk : undefined,
        minScore: scoreMin ? Number(scoreMin) : undefined,
        maxScore: scoreMax ? Number(scoreMax) : undefined
      };
      const res = await axios.get('/api/qms/satisfaction/dashboard/employees', { params });
      setEmployeesMapping(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }, [cycle, selectedDept, selectedStatus, selectedRisk, scoreMin, scoreMax]);

  const fetchReminders = useCallback(async () => {
    try {
      const res = await axios.get('/api/qms/satisfaction/dashboard/reminders', { params: { cycle } });
      setReminderTracking(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }, [cycle]);

  // Fetch departments list
  useEffect(() => {
    axios.get('/api/master/hr/departments/active')
      .then((res) => {
        const content = Array.isArray(res.data) ? res.data : (res.data?.content || []);
        setDepartments(content);
      })
      .catch((err) => console.error(err));
  }, []);

  const fetchFeedbackEntries = useCallback(async () => {
    setFeedbackEntriesLoading(true);
    try {
      const res = await axios.get('/api/qms/satisfaction/feedback/list', { params: { type: 'All' } });
      setFeedbackEntries(res.data || []);
    } catch (err) {
      console.error('Failed to fetch feedback entries:', err);
    } finally {
      setFeedbackEntriesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    if (activeTab === 0) {
      fetchDashboardData();
    } else if (activeTab === 1) {
      fetchEmployeesMapping();
    } else if (activeTab === 2) {
      fetchReminders();
    } else if (activeTab === 3) {
      fetchFeedbackEntries();
    }
  }, [activeTab, fetchDashboardData, fetchEmployeesMapping, fetchReminders, fetchFeedbackEntries]);

  const handleManualReminder = async (empId) => {
    try {
      await axios.post(`/api/qms/satisfaction/dashboard/trigger-reminder/${empId}`, null, { params: { cycle } });
      dispatch(
        openSnackbar({
          open: true,
          message: 'Reminder email sent successfully!',
          variant: 'alert',
          severity: 'success'
        })
      );
      fetchReminders();
    } catch (err) {
      console.error(err);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to send reminder email.',
          variant: 'alert',
          severity: 'error'
        })
      );
    }
  };

  const handleOpenTimeline = async (emp) => {
    setSelectedEmployee(emp);
    try {
      const res = await axios.get(`/api/qms/satisfaction/dashboard/timeline/${emp.employeeId}`, { params: { cycle } });
      setTimelineData(res.data || []);
      setTimelineDialogOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenDetails = async (emp) => {
    setSelectedEmployee(emp);
    try {
      const res = await axios.get(`/api/qms/satisfaction/dashboard/responses/${emp.employeeId}`, { params: { cycle } });
      setDetailResponses(res.data || []);
      setDetailPage(0);
      setDetailDialogOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAssign = async () => {
    try {
      const res = await axios.get('/api/master/hr/employees');
      const emps = Array.isArray(res.data) ? res.data : (res.data?.content || []);
      setAllActiveEmployees(emps.filter((e) => {
        const s = typeof e.status === 'object' && e.status !== null ? e.status.name : e.status;
        return String(s || '').toLowerCase() === 'active' || e.isActive === true;
      }));
      setSelectedAssignEmps([]);
      setAssignPage(0);
      setAssignDialogOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignSubmit = async () => {
    if (selectedAssignEmps.length === 0) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Please select at least one employee.',
          variant: 'alert',
          severity: 'warning'
        })
      );
      return;
    }

    try {
      await axios.post('/api/qms/satisfaction/dashboard/assign', {
        employeeIds: selectedAssignEmps
      }, { params: { cycle } });

      dispatch(
        openSnackbar({
          open: true,
          message: 'Feedback cycle assigned successfully!',
          variant: 'alert',
          severity: 'success'
        })
      );
      setAssignDialogOpen(false);
      fetchDashboardData();
      fetchEmployeesMapping();
    } catch (err) {
      console.error(err);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to assign feedback cycle.',
          variant: 'alert',
          severity: 'error'
        })
      );
    }
  };

  // ApexCharts config helper
  const getDeptChartConfig = () => {
    if (!chartsData?.departmentComparison) return null;
    const categories = chartsData.departmentComparison.map((d) => d.department);
    const data = chartsData.departmentComparison.map((d) => d.averageScore);

    return {
      series: [{ name: 'Average Score', data }],
      options: {
        chart: { type: 'bar', height: 350 },
        plotOptions: { bar: { borderRadius: 4, horizontal: true } },
        xaxis: { categories },
        colors: ['#2196F3']
      }
    };
  };

  const getScoreDistChartConfig = () => {
    if (!chartsData?.scoreDistribution) return null;
    const series = chartsData.scoreDistribution.map((s) => s.count);
    const labels = chartsData.scoreDistribution.map((s) => s.range);

    return {
      series,
      options: {
        chart: { type: 'pie', height: 350 },
        labels,
        colors: ['#E53935', '#FB8C00', '#4CAF50']
      }
    };
  };

  const getRiskChartConfig = () => {
    if (!chartsData?.riskDistribution) return null;
    const series = chartsData.riskDistribution.map((r) => r.count);
    const labels = chartsData.riskDistribution.map((r) => r.risk);

    return {
      series,
      options: {
        chart: { type: 'donut', height: 350 },
        labels,
        colors: ['#D32F2F', '#F57C00', '#388E3C']
      }
    };
  };

  const getCompletionChartConfig = () => {
    if (!chartsData?.completionStatus) return null;
    const series = chartsData.completionStatus.map((c) => c.count);
    const labels = chartsData.completionStatus.map((c) => c.status);

    return {
      series,
      options: {
        chart: { type: 'donut', height: 350 },
        labels,
        colors: ['#2E7D32', '#C62828']
      }
    };
  };

  const trackingActionColumn = {
    label: 'Actions',
    render: (row) => (
      <Stack direction="row" spacing={0.5} justifyContent="center">
        <IconButton size="small" title="Activity Timeline" onClick={() => handleOpenTimeline(row)}>
          <IconHistory size={18} />
        </IconButton>
        <IconButton
          size="small"
          title="Detailed Responses"
          disabled={row.status !== 'Completed'}
          onClick={() => handleOpenDetails(row)}
        >
          <IconListDetails size={18} />
        </IconButton>
      </Stack>
    )
  };

  const reminderActionColumn = {
    label: 'Actions',
    render: (row) => (
      <Button
        size="small"
        variant="outlined"
        color="warning"
        startIcon={<IconBell size={14} />}
        disabled={row.status === 'Completed' || !perms.write}
        onClick={() => handleManualReminder(row.employeeId)}
      >
        Remind
      </Button>
    )
  };

  const columnsAssign = [
    {
      id: 'select',
      label: 'Select',
      minWidth: 60,
      align: 'center',
      render: (row) => {
        const isChecked = selectedAssignEmps.includes(row.id);
        return (
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => {
              if (isChecked) {
                setSelectedAssignEmps(selectedAssignEmps.filter((id) => id !== row.id));
              } else {
                setSelectedAssignEmps([...selectedAssignEmps, row.id]);
              }
            }}
          />
        );
      }
    },
    { id: 'empCode', label: 'Code', minWidth: 100 },
    { id: 'employeeName', label: 'Name', minWidth: 150 },
    { id: 'departmentName', label: 'Department', minWidth: 150, render: (row) => row.department?.departmentName || '-' }
  ];

  const resolvedTrackingRows = employeesMapping.slice(
    trackingPage * trackingSize,
    (trackingPage + 1) * trackingSize
  );

  const resolvedReminderRows = reminderTracking.slice(
    reminderPage * reminderSize,
    (reminderPage + 1) * reminderSize
  );

  const resolvedAssignRows = allActiveEmployees.slice(
    assignPage * assignSize,
    (assignPage + 1) * assignSize
  );

  const resolvedDetailRows = detailResponses.slice(
    detailPage * detailSize,
    (detailPage + 1) * detailSize
  );

  return (
    <MainCard
      icon={IconDashboard}
      title={"Employee Satisfaction Dashboard"}
      secondary={
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField
            size="small"
            label="Feedback Cycle"
            value={cycle}
            onChange={(e) => setCycle(e.target.value)}
            sx={{ width: 155 }}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<IconPlus size={18} />}
            onClick={handleOpenAssign}
            disabled={!perms.write}
          >
            Assign Feedback
          </Button>
        </Stack>
      }
    >
      <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} sx={{ mb: 3 }}>
        <Tab label="Analytics Overview" />
        <Tab label="Employee Tracking & Risk Levels" />
        <Tab label="Email Reminder logs" />
        <Tab label="Feedback Entries" />
      </Tabs>

      {/* ────────────────── Tab 0: Analytics Overview ────────────────── */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              {[
                { title: 'Total Eligible Employees', value: cards.totalEligible, icon: <IconUsers color="#1e88e5" /> },
                { title: 'Completed Feedback', value: cards.completedFeedback, icon: <IconChecks color="#43a047" /> },
                { title: 'Pending Feedback', value: cards.pendingFeedback, icon: <IconAlertTriangle color="#ffb300" /> },
                { title: 'Overdue Feedback', value: cards.overdueFeedback, icon: <IconAlertTriangle color="#e53935" /> },
                { title: 'Completion Rate', value: `${cards.completionPercentage}%`, icon: <IconChartBar color="#8e24aa" /> },
                { title: 'Average Score', value: cards.averageSatisfactionScore, icon: <IconChartBar color="#3949ab" /> },
                { title: 'Awaiting Reminder', value: cards.awaitingReminder, icon: <IconBell color="#00acc1" /> },
                { title: 'Low Satisfaction Employees', value: cards.lowSatisfactionEmployees, icon: <IconAlertTriangle color="#c2185b" /> }
              ].map((c, i) => (
                <Grid item xs={12} sm={6} md={3} key={i}>
                  <Card sx={{ bgcolor: 'background.paper', boxShadow: 1 }}>
                    <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: '16px !important' }}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          {c.title}
                        </Typography>
                        <Typography variant="h3" sx={{ mt: 0.5, fontWeight: 700 }}>
                          {c.value}
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: 'action.hover', width: 44, height: 44 }}>
                        {c.icon}
                      </Avatar>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Charts Row 1 */}
          {chartsData && (
            <>
              <Grid item xs={12} md={6}>
                <MainCard title="Department-wise Average Satisfaction Score">
                  {getDeptChartConfig() && (
                    <Chart
                      options={getDeptChartConfig().options}
                      series={getDeptChartConfig().series}
                      type="bar"
                      height={320}
                    />
                  )}
                </MainCard>
              </Grid>

              <Grid item xs={12} md={6}>
                <MainCard title="Risk Distribution Profile">
                  {getRiskChartConfig() && (
                    <Chart
                      options={getRiskChartConfig().options}
                      series={getRiskChartConfig().series}
                      type="donut"
                      height={320}
                    />
                  )}
                </MainCard>
              </Grid>

              {/* Charts Row 2 */}
              <Grid item xs={12} md={6}>
                <MainCard title="Feedback Completion Status">
                  {getCompletionChartConfig() && (
                    <Chart
                      options={getCompletionChartConfig().options}
                      series={getCompletionChartConfig().series}
                      type="donut"
                      height={320}
                    />
                  )}
                </MainCard>
              </Grid>

              <Grid item xs={12} md={6}>
                <MainCard title="Satisfaction Score Distribution Range">
                  {getScoreDistChartConfig() && (
                    <Chart
                      options={getScoreDistChartConfig().options}
                      series={getScoreDistChartConfig().series}
                      type="pie"
                      height={320}
                    />
                  )}
                </MainCard>
              </Grid>
            </>
          )}
        </Grid>
      )}

      {/* ────────────────── Tab 1: Employee Tracking ────────────────── */}
      {activeTab === 1 && (
        <Grid container spacing={2}>
          {/* Filters Bar */}
          <Grid item xs={12}>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Department</InputLabel>
                <Select value={selectedDept} label="Department" onChange={(e) => setSelectedDept(e.target.value)}>
                  <MenuItem value="All">All Departments</MenuItem>
                  {departments.map((d) => (
                    <MenuItem key={d.id} value={d.id}>{d.departmentName}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel>Feedback Status</InputLabel>
                <Select value={selectedStatus} label="Feedback Status" onChange={(e) => setSelectedStatus(e.target.value)}>
                  <MenuItem value="All">All Statuses</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Overdue">Overdue</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Risk Level</InputLabel>
                <Select value={selectedRisk} label="Risk Level" onChange={(e) => setSelectedRisk(e.target.value)}>
                  <MenuItem value="All">All Risks</MenuItem>
                  <MenuItem value="Low">Low Risk</MenuItem>
                  <MenuItem value="Medium">Medium Risk</MenuItem>
                  <MenuItem value="High">High Risk</MenuItem>
                </Select>
              </FormControl>
              <TextField
                size="small"
                label="Min Score"
                type="number"
                value={scoreMin}
                onChange={(e) => setScoreMin(e.target.value)}
                sx={{ width: 100 }}
              />
              <TextField
                size="small"
                label="Max Score"
                type="number"
                value={scoreMax}
                onChange={(e) => setScoreMax(e.target.value)}
                sx={{ width: 100 }}
              />
              <Button variant="contained" startIcon={<IconSearch size={18} />} onClick={fetchEmployeesMapping}>
                Filter
              </Button>
            </Stack>
          </Grid>

          {/* Grid View */}
          <Grid item xs={12}>
            <BOSDataTable
              id="qms-emp-satisfaction-tracking-table"
              columns={columnsTracking}
              rows={resolvedTrackingRows}
              page={trackingPage}
              size={trackingSize}
              totalCount={employeesMapping.length}
              onPageChange={(p) => setTrackingPage(p)}
              onSizeChange={(s) => {
                setTrackingSize(s);
                setTrackingPage(0);
              }}
              actionColumn={trackingActionColumn}
            />
          </Grid>
        </Grid>
      )}

      {/* ────────────────── Tab 2: Reminder Logs ────────────────── */}
      {activeTab === 2 && (
        <BOSDataTable
          id="qms-emp-satisfaction-reminders-table"
          columns={columnsReminder}
          rows={resolvedReminderRows}
          page={reminderPage}
          size={reminderSize}
          totalCount={reminderTracking.length}
          onPageChange={(p) => setReminderPage(p)}
          onSizeChange={(s) => {
            setReminderSize(s);
            setReminderPage(0);
          }}
          actionColumn={reminderActionColumn}
        />
      )}

      {/* ────────────────── Tab 3: Feedback Entries ────────────────── */}
      {activeTab === 3 && (
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Submitted Feedback Entries
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={fetchFeedbackEntries}
              disabled={feedbackEntriesLoading}
            >
              {feedbackEntriesLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </Stack>

          {feedbackEntriesLoading && (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>Loading feedback entries...</Typography>
          )}

          {!feedbackEntriesLoading && feedbackEntries.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h5" color="text.secondary" sx={{ mb: 1 }}>No Feedback Entries Yet</Typography>
              <Typography variant="body2" color="text.disabled">
                Submitted feedback will appear here. Use the Feedback Entry page to submit responses.
              </Typography>
            </Box>
          )}

          {!feedbackEntriesLoading && feedbackEntries.map((entry) => (
            <Card key={entry.id} sx={{ mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {entry.submittedBy}
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <Typography variant="caption" color="text.secondary">
                        Type: <strong>{entry.satisfactionType}</strong>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Date: <strong>{entry.submittedDate ? new Date(entry.submittedDate).toLocaleString('en-GB') : '-'}</strong>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total Score: <strong>{entry.totalScore ?? '-'}</strong>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Avg Score: <strong>{entry.averageScore != null ? Number(entry.averageScore).toFixed(1) : '-'}</strong>
                      </Typography>
                    </Stack>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                  >
                    {expandedEntry === entry.id ? 'Hide Details' : 'View Details'}
                  </Button>
                </Stack>

                {expandedEntry === entry.id && entry.responses && entry.responses.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <BOSDataTable
                      id={`qms-feedback-responses-${entry.id}`}
                      columns={[
                        {
                          id: 'questionText',
                          label: 'Question / Criteria',
                          minWidth: 320,
                          render: (row) => (
                            <span dangerouslySetInnerHTML={{ __html: row.question?.satisfactionCriteria || row.questionText || '-' }} />
                          )
                        },
                        { id: 'rating', label: 'Rating', minWidth: 120 },
                        { id: 'score', label: 'Score', minWidth: 80, align: 'right' },
                        { id: 'comments', label: 'Comments', minWidth: 200, render: (row) => row.comments || '-' }
                      ]}
                      rows={entry.responses}
                    />
                  </Box>
                )}

                {expandedEntry === entry.id && (!entry.responses || entry.responses.length === 0) && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    No response details available.
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* ────────────────── Assign Dialog ────────────────── */}
      <BOSFormDialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        onSave={handleAssignSubmit}
        title={`Assign Feedback Cycle - ${cycle}`}
        maxWidth="sm"
      >
        <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
          Select active employees to assign them the feedback form.
        </Typography>
        <BOSDataTable
          id="qms-emp-satisfaction-assign-table"
          columns={columnsAssign}
          rows={resolvedAssignRows}
          page={assignPage}
          size={assignSize}
          totalCount={allActiveEmployees.length}
          onPageChange={(p) => setAssignPage(p)}
          onSizeChange={(s) => {
            setAssignSize(s);
            setAssignPage(0);
          }}
        />
      </BOSFormDialog>

      {/* ────────────────── Timeline Activity Dialog ────────────────── */}
      <BOSFormDialog
        open={timelineDialogOpen}
        onClose={() => setTimelineDialogOpen(false)}
        isViewOnly={true}
        title={`Timeline Activity: ${selectedEmployee?.employeeName || ''}`}
        maxWidth="xs"
        showCloseInFooter={true}
      >
        <List>
          {timelineData.map((act, idx) => (
            <ListItem key={act.id}>
              <ListItemText
                primary={
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {act.description}
                  </Typography>
                }
                secondary={new Date(act.activityDate).toLocaleString('en-GB')}
              />
            </ListItem>
          ))}
          {timelineData.length === 0 && (
            <Typography align="center" sx={{ py: 3, color: 'text.secondary' }}>
              No activity history found.
            </Typography>
          )}
        </List>
      </BOSFormDialog>

      {/* ────────────────── Detailed Responses Dialog ────────────────── */}
      <BOSFormDialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        isViewOnly={true}
        title={`Detailed Response View: ${selectedEmployee?.employeeName || ''}`}
        maxWidth="md"
        showCloseInFooter={true}
      >
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Submission Date:{' '}
          {selectedEmployee?.submittedDate
            ? new Date(selectedEmployee.submittedDate).toLocaleString('en-GB')
            : '-'}
        </Typography>
        <BOSDataTable
          id="qms-emp-satisfaction-detail-responses-table"
          columns={columnsDetails}
          rows={resolvedDetailRows}
          page={detailPage}
          size={detailSize}
          totalCount={detailResponses.length}
          onPageChange={(p) => setDetailPage(p)}
          onSizeChange={(s) => {
            setDetailSize(s);
            setDetailPage(0);
          }}
        />
      </BOSFormDialog>
    </MainCard>
  );
}
