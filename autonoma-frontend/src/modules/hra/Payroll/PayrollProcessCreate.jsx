import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid, Button, Stack, MenuItem, Typography, useTheme, Box, Divider,
  IconButton, Card, CardContent, TextField, CircularProgress, Chip, Avatar, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, InputBase, Tooltip
} from '@mui/material';
import {
  IconArrowLeft, IconDeviceFloppy, IconUser,
  IconTrendingUp, IconTrendingDown, IconUsers, IconReceipt, IconHistory,
  IconBriefcase, IconBuildingBank, IconCalendarEvent, IconId, IconCalendarTime,
  IconHierarchy, IconUserCircle, IconMapPin, IconClock, IconCrown, IconBed, IconBeach,
  IconTrees, IconHeart, IconCalendar, IconScale, IconActivity, IconRefresh
} from '@tabler/icons-react';
import MainCard from 'ui-component/cards/MainCard';
import { BOSAutocomplete, BOSEmployeeAutocomplete, BOSFormSection, getPhotoUrl } from 'ui-component/bos';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { openSnackbar } from 'store/slices/snackbar';
import axios from 'utils/axios';
import useLookups from 'hooks/useLookups';
import { API_PATHS } from 'utils/api-constants';

const MONTHS = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

class LocalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#fee', color: '#c00', border: '1px solid #c00', borderRadius: '4px' }}>
          <h2>Component Crashed</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {this.state.error && this.state.error.toString()}
          </pre>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.8em' }}>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function PayrollProcessCreate() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { payrollEmployees: employees = [], loading: lookupsLoading } = useLookups(['PAYROLL_EMPLOYEES']);

  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);
  const [employee, setEmployee] = useState(null);
  const [employeeProfile, setEmployeeProfile] = useState(null);
  const [personalDetails, setPersonalDetails] = useState(null);
  const [jobProfile, setJobProfile] = useState(null);
  const [leaveDetails, setLeaveDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [salaryExists, setSalaryExists] = useState(false);

  const hasVal = (val) => {
    if (val === null || val === undefined) return false;
    const str = String(val).trim().toUpperCase();
    return str !== '' && str !== '-' && str !== 'UNINFORMED' && str !== 'N/A';
  };

  const InfoRow = ({ label, value }) => {
    if (!hasVal(value)) return null;
    return (
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: '4px', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
        <Typography sx={{ fontSize: '11px', color: 'text.secondary', fontWeight: 500 }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: 'text.primary', textAlign: 'right' }}>
          {value}
        </Typography>
      </Box>
    );
  };

  const InfoField = ({ label, value }) => {
    if (!hasVal(value)) return null;
    return (
      <Box sx={{ minWidth: 0, py: 0.5 }}>
        <Typography sx={{ fontSize: '11px', color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px', mb: 0.3 }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: '14px', fontWeight: 750, color: 'text.primary', wordBreak: 'break-word', lineHeight: 1.3 }}>
          {value}
        </Typography>
      </Box>
    );
  };

  const [calcResult, setCalcResult] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [loading, setLoading] = useState(false);

  const snack = useCallback((msg, sev = 'success') => {
    dispatch(openSnackbar({ open: true, message: msg, variant: 'alert', alert: { variant: 'filled' }, severity: sev }));
  }, [dispatch]);

  const handleCalculate = useCallback(async (empId) => {
    const id = empId || employee?.id;
    if (!id) return;
    setCalculating(true);
    setCalcResult(null);
    try {
      const url = `/api/payroll/process/calculate?year=${year}&month=${month}&employeeId=${id}`;
      const { data } = await axios.post(url);
      if (data && data.length > 0) {
        const empResult = data.find(r => String(r.employeeId) === String(id)) || data[0];
        if (empResult) {
          setCalcResult(empResult);
          if (empResult.noSalaryComponents) {
            snack('Salary Component Not Found', 'error');
          }
        } else {
          snack('Salary Component Not Found', 'error');
        }
      } else {
        snack('Salary Component Not Found', 'error');
      }
    } catch (e) {
      console.error(e);
      snack('Failed to fetch/calculate components. Please check employee salary mapping.', 'error');
    } finally {
      setCalculating(false);
    }
  }, [employee?.id, month, year, snack]);

  const loadEmployeeData = useCallback((empId) => {
    if (!empId) return;
    setDetailsLoading(true);
    setCalcResult(null);
    setEmployeeProfile(null);
    setPersonalDetails(null);
    setJobProfile(null);
    setLeaveDetails(null);
    setSalaryExists(false);

    Promise.all([
      axios.get(`${API_PATHS.HRM.EMPLOYEES}/${empId}`),
      axios.get(`/api/master/hr/employees/${empId}/personal`).catch(() => ({ data: null })),
      axios.get(`/api/master/hr/employees/${empId}/job-profile`).catch(() => ({ data: null })),
      axios.get(`/api/hr/leave-entries/employee-details/${empId}`).catch(() => ({ data: null })),
      axios.get(`/api/payroll/process/details?year=${year}&month=${month}`).catch(() => ({ data: [] }))
    ])
      .then(([empRes, personalRes, jobRes, leaveRes, detailsRes]) => {
        setEmployeeProfile(empRes.data);
        if (personalRes.data) setPersonalDetails(personalRes.data);
        if (jobRes.data) setJobProfile(jobRes.data);
        if (leaveRes.data) setLeaveDetails(leaveRes.data);

        // Check if salary already exists
        const processedList = detailsRes.data || [];
        const exists = processedList.some(r => String(r.employeeId) === String(empId));
        if (exists) {
          setSalaryExists(true);
          const empName = employee?.employeeName || empRes.data?.employeeName || 'Employee';
          snack(`Salary already processed for ${empName} in ${month} ${year}`, 'warning');
        } else {
          // Auto-calculate components
          handleCalculate(empId);
        }
      })
      .catch(err => {
        console.error(err);
        snack('Failed to fetch employee details', 'error');
      })
      .finally(() => {
        setDetailsLoading(false);
      });
  }, [month, year, snack, handleCalculate, employee?.employeeName]);

  const handleRefreshClick = () => {
    if (!employee?.id) {
      snack('Please select an employee first', 'warning');
      return;
    }
    loadEmployeeData(employee.id);
  };

  // Auto-fetch profile, personal details, job profile, leave balance and calculate components
  useEffect(() => {
    if (employee?.id) {
      loadEmployeeData(employee.id);
    } else {
      setEmployeeProfile(null);
      setPersonalDetails(null);
      setJobProfile(null);
      setLeaveDetails(null);
      setCalcResult(null);
      setSalaryExists(false);
    }
  }, [employee?.id, loadEmployeeData]);

  // Real-Time Data Synchronization Listener
  useEffect(() => {
    const handleRealtimeSync = (event) => {
      const url = (event?.detail?.url || '').toLowerCase();
      if (!url || url.includes('payroll') || url.includes('master') || url.includes('statutory') || url.includes('preference')) {
        if (employee?.id) {
          handleCalculateSingle(employee.id);
        }
      }
    };
    window.addEventListener('bos-realtime-update', handleRealtimeSync);
    return () => window.removeEventListener('bos-realtime-update', handleRealtimeSync);
  }, [employee?.id, handleCalculateSingle]);

  const handleSave = async () => {
    if (!calcResult) return;
    setLoading(true);
    try {
      const url = `/api/payroll/process/save?year=${year}&month=${month}`;
      await axios.post(url, [calcResult]);
      snack(`Payroll for ${employee.employeeName} (${month} ${year}) processed and saved!`);
      navigate('/hra/payroll/payroll-process');
    } catch (e) {
      console.error(e);
      snack('Failed to save processed payroll.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isShowInRegister = (c) => c.showInRegister === undefined || c.showInRegister === null || c.showInRegister === true || String(c.showInRegister) === 'true' || c.showInRegister === 1 || String(c.showInRegister) === '1';

  const earnings = calcResult?.components?.filter(c => c.componentType === 'EARNING' && isShowInRegister(c)) || [];
  const deductions = calcResult?.components?.filter(c => c.componentType === 'DEDUCTION' && isShowInRegister(c)) || [];
  const contributions = calcResult?.components?.filter(c => (c.componentType === 'CONTRIBUTION' || c.componentType === 'EMPLOYER_CONTRIBUTION') && isShowInRegister(c)) || [];

  const renderComponentTable = (components, totalLabel, totalAmount, colorScheme) => {
    return (
      <TableContainer component={Box} sx={{ bgcolor: 'transparent', border: 'none', boxShadow: 'none' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { borderBottom: `2px solid ${theme.palette.divider}`, bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : '#2196f3', color: theme.palette.mode === 'dark' ? 'text.primary' : 'white' } }}>
              <TableCell sx={{ fontWeight: 800, py: 1.8, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.8px', pl: 1.5 }}>Component</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, py: 1.8, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.8px', width: 110 }}>Actual</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, py: 1.8, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.8px', width: 160, pr: 2.5 }}>Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {components.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                  No components configured
                </TableCell>
              </TableRow>
            ) : (
              components.map((c, idx) => {
                const isFldDisabled = c.calcType !== 'MANUAL';

                // Show the formula as a tooltip for formula components
                let tooltipTitle = 'Manual Entry';
                if (c.formula) {
                  tooltipTitle = `Formula: ${c.formula}`;
                } else if (c.calcType === 'DAILY_RATE' || c.calcType === 'DAILY') {
                  tooltipTitle = `Based on Attendance: ${(parseFloat(c.actualAmount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / day`;
                }

                return (
                  <TableRow
                    key={c.componentCode || idx}
                    sx={{
                      transition: 'background-color 0.2s',
                      '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)' },
                      '& td': { borderBottom: `1px solid ${theme.palette.divider}` }
                    }}
                  >
                    <TableCell sx={{ py: 1.5, pl: 1.5 }}>
                      <Tooltip title={tooltipTitle} arrow placement="top">
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', cursor: 'help', display: 'inline-block' }}>
                          {c.componentName}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                        {c.actualAmount !== null && c.actualAmount !== undefined && c.actualAmount !== '' && !isNaN(parseFloat(c.actualAmount)) && parseFloat(c.actualAmount) !== 0
                          ? parseFloat(c.actualAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : ''}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.5, pr: 1.5 }}>
                      <InputBase
                        type="number"
                        value={c.processAmount || 0}
                        disabled={isFldDisabled}
                        sx={{
                          width: '100%',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: `1px solid ${theme.palette.divider}`,
                          bgcolor: isFldDisabled
                            ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.03)')
                            : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#fafafa'),
                          transition: 'all 0.2s',
                          fontSize: '0.875rem',
                          '& input': {
                            textAlign: 'right',
                            padding: 0,
                            fontWeight: 700,
                            color: isFldDisabled
                              ? theme.palette.text.secondary
                              : theme.palette.primary.main,
                          },
                          '&:hover': {
                            borderColor: isFldDisabled ? theme.palette.divider : theme.palette.primary.main,
                            bgcolor: isFldDisabled
                              ? 'transparent'
                              : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#fff'),
                          },
                          '&.Mui-focused': {
                            borderColor: theme.palette.primary.main,
                            bgcolor: 'background.paper',
                            boxShadow: `0 0 0 3px ${theme.palette.primary.light}25`,
                          }
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}

            {/* Total Row */}
            <TableRow sx={{
              borderTop: `2px double ${theme.palette.divider}`,
              background: theme.palette.mode === 'dark'
                ? (colorScheme === 'success'
                  ? 'linear-gradient(90deg, rgba(76, 175, 80, 0.15) 0%, rgba(76, 175, 80, 0.05) 100%)'
                  : colorScheme === 'error'
                    ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)'
                    : 'linear-gradient(90deg, rgba(156, 39, 176, 0.15) 0%, rgba(156, 39, 176, 0.05) 100%)')
                : (colorScheme === 'success'
                  ? 'linear-gradient(90deg, rgba(76, 175, 80, 0.08) 0%, rgba(76, 175, 80, 0.02) 100%)'
                  : colorScheme === 'error'
                    ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.02) 100%)'
                    : 'linear-gradient(90deg, rgba(156, 39, 176, 0.08) 0%, rgba(156, 39, 176, 0.02) 100%)')
            }}>
              <TableCell colSpan={2} sx={{ py: 2, pl: 2 }}>
                <Typography variant="subtitle2" sx={{
                  fontWeight: 805,
                  color: colorScheme === 'success' ? 'success.dark' : colorScheme === 'error' ? 'error.dark' : 'secondary.dark',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {totalLabel}
                </Typography>
              </TableCell>
              <TableCell align="right" sx={{ py: 2, pr: 2.5 }}>
                <Typography variant="h4" sx={{
                  fontWeight: 900,
                  color: colorScheme === 'success' ? 'success.main' : colorScheme === 'error' ? 'error.main' : 'secondary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 0.5
                }}>
                  {totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <LocalErrorBoundary>
      <Box sx={{ width: '100%', pb: 10 }}>
        <MainCard
          fullWidth
          stretch={false}
          contentSX={{ p: 1 }}
          sx={{ width: '100%', maxWidth: 'none' }}
          title={
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 0.5 }}>
              <IconButton onClick={() => navigate('/hra/payroll/payroll-process')} color="inherit">
                <IconArrowLeft size={20} />
              </IconButton>
              <Typography variant="h3" sx={{ fontWeight: 800 }}>Process Employee Payroll</Typography>
            </Stack>
          }
        >
          {lookupsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress size={40} />
            </Box>
          ) : employees.length === 0 ? (
            <Box sx={{ p: 3 }}>
              <Alert severity="warning">No active employees found in the Employee Master database.</Alert>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {salaryExists && (
                <Grid item xs={12}>
                  <Alert severity="error" sx={{ borderRadius: '8px' }}>
                    Salary has already been processed/saved for <strong>{employee?.employeeName}</strong> in <strong>{month} {year}</strong>.
                  </Alert>
                </Grid>
              )}
              {/* Employee Details Panel */}
              <Grid item xs={12} sx={{ width: '100%' }}>
                {detailsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={30} />
                  </Box>
                ) : (
                  <BOSFormSection sx={{ width: '100%', overflow: 'visible' }} contentSx={{ p: 0 }}>
                    {/* Custom Header with Center Selectors */}
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      p: 1.5,
                      px: 2.5,
                      minHeight: 56,
                      position: 'relative',
                      bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8f9fa',
                      borderTopLeftRadius: '12px',
                      borderTopRightRadius: '12px'
                    }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <IconUser size={18} color={theme.palette.primary.main} />
                        <Typography sx={{ fontSize: '14px', fontWeight: 700, color: 'text.primary' }}>
                          Employee Details
                        </Typography>
                      </Stack>

                      {/* Center Selectors Stack */}
                      <Box sx={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 10
                      }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <TextField
                            select
                            size="small"
                            label="Month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            sx={{
                              width: 130,
                              '& .MuiInputLabel-root': { fontSize: '11px', transform: 'translate(14px, 8px) scale(1)' },
                              '& .MuiInputLabel-shrink': { transform: 'translate(14px, -6px) scale(0.75)' },
                              '& .MuiOutlinedInput-root': { height: '32px', fontSize: '11px' }
                            }}
                          >
                            {MONTHS.map((m) => (
                              <MenuItem key={m} value={m} sx={{ fontSize: '11px' }}>{m}</MenuItem>
                            ))}
                          </TextField>
                          <TextField
                            size="small"
                            label="Year"
                            type="number"
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            sx={{
                              width: 80,
                              '& .MuiInputLabel-root': { fontSize: '11px', transform: 'translate(14px, 8px) scale(1)' },
                              '& .MuiInputLabel-shrink': { transform: 'translate(14px, -6px) scale(0.75)' },
                              '& .MuiOutlinedInput-root': { height: '32px', fontSize: '11px' }
                            }}
                          />
                          <BOSEmployeeAutocomplete
                            size="small"
                            label="Employee Name"
                            options={employees}
                            value={employee}
                            onChange={(val) => setEmployee(val)}
                            placeholder="Search Employee..."
                            sx={{
                              width: 220,
                              '& .MuiInputLabel-root': { fontSize: '11px', transform: 'translate(14px, 8px) scale(1)' },
                              '& .MuiInputLabel-shrink': { transform: 'translate(14px, -6px) scale(0.75)' },
                              '& .MuiOutlinedInput-root': { height: '32px', fontSize: '11px' }
                            }}
                          />
                          <Tooltip title="Recalculate Payroll">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={handleRefreshClick}
                              disabled={calculating}
                              sx={{
                                border: '1px solid',
                                borderColor: theme.palette.divider,
                                borderRadius: '4px',
                                height: '32px',
                                width: '32px',
                                bgcolor: 'background.paper',
                                '&:hover': { bgcolor: 'action.hover' }
                              }}
                            >
                              {calculating ? (
                                <CircularProgress size={16} color="inherit" />
                              ) : (
                                <IconRefresh size={16} />
                              )}
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Box>

                      {/* Right Placeholder to balance center absolute layout */}
                      <Box sx={{ width: 24 }} />
                    </Box>

                    {/* Content Body Box */}
                    <Box sx={{ p: 2 }}>
                      {employeeProfile ? (
                        <Box sx={{
                          display: 'flex',
                          flexDirection: { xs: 'column', md: 'row' },
                          gap: '10px',
                          width: '100%',
                          alignItems: 'stretch',
                          mt: 1
                        }}>
                          {/* Left: Employee Summary Card */}
                          <Box sx={{
                            width: { xs: '100%', md: 240 },
                            minWidth: { md: 240 },
                            flexShrink: 0,
                            bgcolor: theme.palette.mode === 'dark' ? 'background.default' : '#ffffff',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                            p: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center'
                          }}>
                            <Box sx={{ position: 'relative', mb: 1.5 }}>
                              <Avatar
                                src={employeeProfile.employeePhotoUpload ? getPhotoUrl(employeeProfile.employeePhotoUpload) : null}
                                sx={{
                                  width: 80,
                                  height: 80,
                                  border: '3px solid',
                                  borderColor: 'primary.light',
                                  boxShadow: '0 4px 10px rgba(0,0,0,0.08)'
                                }}
                              >
                                {employeeProfile.employeeName?.charAt(0)}
                              </Avatar>
                              <Box sx={{
                                position: 'absolute',
                                bottom: 0,
                                right: 4,
                                width: 14,
                                height: 14,
                                bgcolor: '#4caf50',
                                border: '2.5px solid #ffffff',
                                borderRadius: '50%'
                              }} />
                            </Box>

                            <Typography sx={{ fontSize: '15px', fontWeight: 700, color: 'text.primary', mb: 0.5, lineHeight: 1.2 }}>
                              {employeeProfile.employeeName}
                            </Typography>
                            <Typography sx={{ fontSize: '11px', color: 'text.secondary', fontWeight: 550, mb: 1.5 }}>
                              Old Code: {employeeProfile.oldEmpCode || '-'}
                            </Typography>

                            <Divider sx={{ width: '100%', mb: 1.5 }} />

                            <Stack spacing={1} sx={{ width: '100%', textAlign: 'left', mb: 2 }}>
                              <Box>
                                <Typography sx={{ fontSize: '10px', color: 'text.secondary', textTransform: 'uppercase', fontWeight: 500 }}>Designation</Typography>
                                <Typography sx={{ fontSize: '12px', fontWeight: 600, color: 'text.primary' }}>{employeeProfile.designation?.designationName || employeeProfile.designation?.name || '-'}</Typography>
                              </Box>
                              <Box>
                                <Typography sx={{ fontSize: '10px', color: 'text.secondary', textTransform: 'uppercase', fontWeight: 500 }}>Department</Typography>
                                <Typography sx={{ fontSize: '12px', fontWeight: 600, color: 'text.primary' }}>{employeeProfile.department?.departmentName || employeeProfile.department?.name || '-'}</Typography>
                              </Box>
                              <Box>
                                <Typography sx={{ fontSize: '10px', color: 'text.secondary', textTransform: 'uppercase', fontWeight: 500 }}>Date of Joining</Typography>
                                <Typography sx={{ fontSize: '12px', fontWeight: 600, color: 'text.primary' }}>
                                  {employeeProfile.dateOfJoining || employeeProfile.doj ? new Date(employeeProfile.dateOfJoining || employeeProfile.doj).toLocaleDateString('en-IN') : '-'}
                                </Typography>
                              </Box>

                            </Stack>
                          </Box>

                          {/* Center: Employee Information */}
                          <Box sx={{
                            flexGrow: 1,
                            minWidth: 0,
                            bgcolor: theme.palette.mode === 'dark' ? 'background.default' : '#ffffff',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                            p: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                          }}>
                            {/* Section 1: Personal Details */}
                            <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: '10px', bgcolor: 'background.paper' }}>
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5, pb: 0.8, borderBottom: '1px solid', borderColor: 'divider' }}>
                                <IconUser size={16} color={theme.palette.primary.main} />
                                <Typography sx={{ fontSize: '13px', fontWeight: 700, color: 'text.primary', letterSpacing: '0.2px' }}>
                                  Personal Details
                                </Typography>
                              </Stack>
                              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2, width: '100%' }}>
                                {hasVal(personalDetails?.gender) && (
                                  <InfoField label="Gender" value={personalDetails?.gender} />
                                )}
                                {hasVal(personalDetails?.maritalStatus) && (
                                  <InfoField label="Marital Status" value={personalDetails?.maritalStatus} />
                                )}
                                {hasVal(personalDetails?.birthDate) && (
                                  <InfoField label="Date of Birth" value={personalDetails?.birthDate ? new Date(personalDetails.birthDate).toLocaleDateString('en-IN') : null} />
                                )}
                                {hasVal(jobProfile?.wagesType) && (
                                  <InfoField label="Wages Type" value={jobProfile?.wagesType} />
                                )}
                                {hasVal(jobProfile?.officeEmail) && (
                                  <InfoField label="Official Email" value={jobProfile?.officeEmail} />
                                )}
                              </Box>
                            </Box>

                            {/* Section 2: Bank Information */}
                            <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: '10px', bgcolor: 'background.paper' }}>
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5, pb: 0.8, borderBottom: '1px solid', borderColor: 'divider' }}>
                                <IconBuildingBank size={16} color={theme.palette.primary.main} />
                                <Typography sx={{ fontSize: '13px', fontWeight: 700, color: 'text.primary', letterSpacing: '0.2px' }}>
                                  Bank Information
                                </Typography>
                              </Stack>
                              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' }, gap: 2, width: '100%' }}>
                                {hasVal(jobProfile?.paymentMode) && (
                                  <InfoField label="Payment Mode" value={jobProfile?.paymentMode} />
                                )}
                                {hasVal(jobProfile?.bankName) && (
                                  <InfoField label="Bank Name" value={jobProfile?.bankName} />
                                )}
                                {hasVal(jobProfile?.accountName) && (
                                  <InfoField label="Account Name" value={jobProfile?.accountName} />
                                )}
                                {hasVal(jobProfile?.salaryAccountNumber) && (
                                  <InfoField label="Account Number" value={jobProfile?.salaryAccountNumber} />
                                )}
                                {hasVal(jobProfile?.ifscCode) && (
                                  <InfoField label="IFSC Code" value={jobProfile?.ifscCode} />
                                )}
                                {hasVal(jobProfile?.branchName) && (
                                  <InfoField label="Branch" value={jobProfile?.branchName} />
                                )}
                              </Box>
                            </Box>

                            {/* Section 3: Statutory Information */}
                            <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: '10px', bgcolor: 'background.paper' }}>
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5, pb: 0.8, borderBottom: '1px solid', borderColor: 'divider' }}>
                                <IconId size={16} color={theme.palette.primary.main} />
                                <Typography sx={{ fontSize: '13px', fontWeight: 700, color: 'text.primary', letterSpacing: '0.2px' }}>
                                  Statutory Information
                                </Typography>
                              </Stack>
                              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, width: '100%' }}>
                                {hasVal(personalDetails?.aadharNumber) && (
                                  <InfoField label="Aadhaar Number" value={personalDetails?.aadharNumber} />
                                )}
                                {hasVal(personalDetails?.panNumber) && (
                                  <InfoField label="PAN Number" value={personalDetails?.panNumber} />
                                )}
                                {hasVal(personalDetails?.pfNumber) && (
                                  <InfoField label="PF Number" value={personalDetails?.pfNumber} />
                                )}
                                {hasVal(personalDetails?.uanNumber) && (
                                  <InfoField label="UAN Number" value={personalDetails?.uanNumber} />
                                )}
                                {hasVal(personalDetails?.esiNumber || jobProfile?.esiNumber) && (
                                  <InfoField label="ESI Number" value={personalDetails?.esiNumber || jobProfile?.esiNumber} />
                                )}
                                {hasVal(personalDetails?.professionalTax || jobProfile?.professionalTax) && (
                                  <InfoField label="Professional Tax" value={personalDetails?.professionalTax || jobProfile?.professionalTax} />
                                )}
                              </Box>
                            </Box>

                            {/* Section 4: Leave Balances */}
                            {(() => {
                              const activeBalances = Object.entries(leaveDetails?.balances || {}).filter(([type, val]) => {
                                if (type === 'SO' || type === 'C_OFF' || type === 'WFH' || type === 'LOP') return false;
                                return val > 0;
                              });
                              if (activeBalances.length === 0) return null;
                              return (
                                <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: '10px', bgcolor: 'background.paper' }}>
                                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5, pb: 0.8, borderBottom: '1px solid', borderColor: 'divider' }}>
                                    <IconCalendarEvent size={16} color={theme.palette.primary.main} />
                                    <Typography sx={{ fontSize: '13px', fontWeight: 700, color: 'text.primary', letterSpacing: '0.2px' }}>
                                      Leave Balances
                                    </Typography>
                                  </Stack>
                                  <Grid container spacing={1.5}>
                                    {activeBalances.map(([type, val]) => {
                                      const label = {
                                        EL: 'Earn Leave (EL)',
                                        CL: 'Casual Leave (CL)',
                                        SL: 'Sick Leave (SL)',
                                        AL: 'Annual Leave (AL)',
                                        PL: 'Privilege Leave (PL)'
                                      }[type] || type;

                                      const config = {
                                        EL: { bg: '#e8f5e9', text: '#2e7d32', border: '#81c784', icon: <IconTrees size={16} /> },
                                        CL: { bg: '#e3f2fd', text: '#1565c0', border: '#64b5f6', icon: <IconBriefcase size={16} /> },
                                        SL: { bg: '#ffebee', text: '#c62828', border: '#e57373', icon: <IconBed size={16} /> },
                                        AL: { bg: '#fff3e0', text: '#e65100', border: '#ffb74d', icon: <IconBeach size={16} /> },
                                        PL: { bg: '#f3e5f5', text: '#6a1b9a', border: '#ba68c8', icon: <IconCrown size={16} /> }
                                      }[type] || { bg: '#f5f5f5', text: '#424242', border: '#e0e0e0', icon: <IconCalendar size={16} /> };

                                      return (
                                        <Grid item xs={12} sm={3} key={type}>
                                          <Box
                                            sx={{
                                              bgcolor: config.bg,
                                              border: '1px solid',
                                              borderColor: config.border,
                                              borderRadius: '8px',
                                              p: '8px 10px',
                                              height: '46px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'space-between'
                                            }}
                                          >
                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                                              <Box sx={{ color: config.text, display: 'flex', flexShrink: 0 }}>
                                                {config.icon}
                                              </Box>
                                              <Typography sx={{ fontWeight: 600, color: config.text, fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {label}
                                              </Typography>
                                            </Stack>
                                            <Typography sx={{ fontWeight: 800, color: config.text, fontSize: '14px', flexShrink: 0, ml: 1 }}>
                                              {val !== undefined && val !== null ? val.toFixed(1) : '0.0'}
                                            </Typography>
                                          </Box>
                                        </Grid>
                                      );
                                    })}
                                  </Grid>
                                </Box>
                              );
                            })()}

                            <Divider />
                          </Box>

                          {/* Right: Leave & Attendance Columns */}
                          <Box sx={{
                            width: { xs: '100%', md: 260 },
                            minWidth: { md: 260 },
                            flexShrink: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%'
                          }}>
                            {/* Attendance & Days Summary Card */}
                            {calcResult && (
                              <Box sx={{
                                bgcolor: theme.palette.mode === 'dark' ? 'background.default' : '#ffffff',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: '12px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                                p: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                                boxSizing: 'border-box'
                              }}>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                                  <IconCalendarTime size={14} color={theme.palette.primary.main} />
                                  <Typography sx={{ fontSize: '14px', fontWeight: 600, color: 'text.primary' }}>
                                    Attendance & Days
                                  </Typography>
                                </Stack>
                                <Box sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'space-between',
                                  flex: 1,
                                  gap: '8px'
                                }}>
                                  {[
                                    { label: 'Total Days', value: calcResult.totalDays || (month && year ? new Date(year, MONTHS.indexOf(month.toUpperCase()) + 1, 0).getDate() : 0), bg: '#f5f5f5', text: '#424242', border: '#e0e0e0', icon: <IconCalendar size={16} /> },
                                    { label: 'Working Days', value: calcResult.presentDays || 0, bg: '#e8f5e9', text: '#2e7d32', border: '#81c784', icon: <IconActivity size={16} /> },
                                    { label: 'Paid Leave Days', value: Math.max(0, (calcResult.paidDays || 0) - (calcResult.presentDays || 0)), bg: '#e3f2fd', text: '#1565c0', border: '#64b5f6', icon: <IconBeach size={16} /> },
                                    { label: 'Approved OT Hrs', value: calcResult.approvedOtHours || 0, bg: '#fff8e1', text: '#f57f17', border: '#ffe082', icon: <IconClock size={16} /> },
                                    { label: 'LOP Days', value: calcResult.lopDays || 0, bg: '#ffebee', text: '#c62828', border: '#e57373', icon: <IconScale size={16} /> }
                                  ].map((item) => (
                                    <Box
                                      key={item.label}
                                      sx={{
                                        bgcolor: item.bg,
                                        border: '1px solid',
                                        borderColor: item.border,
                                        borderRadius: '8px',
                                        p: '8px 10px',
                                        flex: 1,
                                        minHeight: '44px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                      }}
                                    >
                                      <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                                        <Box sx={{ color: item.text, display: 'flex', flexShrink: 0 }}>
                                          {item.icon}
                                        </Box>
                                        <Typography sx={{ fontWeight: 600, color: item.text, fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {item.label}
                                        </Typography>
                                      </Stack>
                                      <Typography sx={{ fontWeight: 800, color: item.text, fontSize: '14px', flexShrink: 0, ml: 1 }}>
                                        {item.value !== undefined && item.value !== null ? parseFloat(item.value).toFixed(1) : '0.0'}
                                      </Typography>
                                    </Box>
                                  ))}
                                </Box>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6, bgcolor: theme.palette.mode === 'dark' ? 'background.default' : 'grey.50', borderRadius: '12px', border: '1px dashed', borderColor: 'divider', m: 2 }}>
                          <Typography variant="body1" sx={{ color: 'text.secondary', fontStyle: 'italic', fontWeight: 500 }}>
                            Please select Month, Year, and Employee in the header above to load details and process payroll.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </BOSFormSection>
                )}</Grid>

              {/* Main Content: 3 Column Salary Structure */}
              {calcResult && (
                <>
                  <Grid item xs={12}>
                    <Card variant="outlined" sx={{
                      borderRadius: '16px',
                      border: '1px solid',
                      borderColor: 'divider',
                      boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.02)',
                      bgcolor: theme.palette.mode === 'dark' ? 'background.default' : '#ffffff'
                    }}>
                      {/* Header */}
                      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <IconReceipt size={22} color={theme.palette.primary.main} />
                          <Typography variant="h4" sx={{ fontWeight: 800 }}>Pay Component Details</Typography>
                        </Stack>
                        <Stack direction="row" spacing={1.5}>
                          <IconButton size="small" color="secondary" variant="outlined" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                            <IconHistory size={18} />
                          </IconButton>
                        </Stack>
                      </Box>
                      <Divider />

                      <CardContent sx={{ p: 3 }}>
                        <Grid container spacing={4} wrap="nowrap" sx={{ overflowX: 'auto', '&::-webkit-scrollbar': { height: '8px' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.1)', borderRadius: '4px' } }}>
                          {/* Column 1: Earnings */}
                          <Grid item xs={4} sx={{ minWidth: 280, flex: 1 }}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                              <IconTrendingUp size={20} color={theme.palette.success.main} />
                              <Typography variant="subtitle1" sx={{ color: 'success.main', fontWeight: 800, textTransform: 'uppercase' }}>Earnings</Typography>
                            </Stack>
                            {renderComponentTable(earnings, 'TOTAL GROSS SALARY', calcResult.grossSalary, 'success')}
                          </Grid>

                          <Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />

                          {/* Column 2: Deductions */}
                          <Grid item xs={4} sx={{ minWidth: 280, flex: 1 }}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                              <IconTrendingDown size={20} color={theme.palette.error.main} />
                              <Typography variant="subtitle1" sx={{ color: 'error.main', fontWeight: 800, textTransform: 'uppercase' }}>Deductions</Typography>
                            </Stack>
                            {renderComponentTable(deductions, 'TOTAL DEDUCTIONS', calcResult.totalDeductions, 'error')}
                          </Grid>

                          <Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />

                          {/* Column 3: Contributions */}
                          <Grid item xs={4} sx={{ minWidth: 280, flex: 1 }}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                              <IconUsers size={20} color={theme.palette.secondary.main} />
                              <Typography variant="subtitle1" sx={{ color: 'secondary.main', fontWeight: 800, textTransform: 'uppercase' }}>Contributions</Typography>
                            </Stack>
                            {renderComponentTable(contributions, 'TOTAL CONTRIBUTIONS', contributions.reduce((acc, c) => acc + (c.processAmount || 0), 0), 'secondary')}
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Real-time Salary Summary Panel */}
                  <Grid item xs={12} sx={{ width: '100%' }}>
                    <Box sx={{
                      mt: 2,
                      width: '100%',
                      p: 2.5,
                      borderRadius: '16px',
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.03)',
                      border: `1px solid ${theme.palette.divider}`,
                      display: 'flex',
                      justifyContent: 'space-around',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 2
                    }}>
                      {/* Gross */}
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>
                          Gross Earnings
                        </Typography>
                        <Typography variant="h3" sx={{ fontWeight: 800, color: 'success.main', mt: 0.5 }}>
                          ₹{calcResult.grossSalary?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>
                      </Box>

                      <Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />

                      {/* Deductions */}
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>
                          Total Deductions
                        </Typography>
                        <Typography variant="h3" sx={{ fontWeight: 800, color: 'error.main', mt: 0.5 }}>
                          ₹{calcResult.totalDeductions?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>
                      </Box>

                      <Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />

                      {/* Net Salary */}
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>
                          Net Salary (Payable)
                        </Typography>
                        <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main', mt: 0.5 }}>
                          ₹{calcResult.netSalary?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>
                      </Box>

                      <Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />

                      {/* CTC */}
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>
                          CTC (Cost to Company)
                        </Typography>
                        <Typography variant="h2" sx={{ fontWeight: 900, color: 'secondary.main', mt: 0.5 }}>
                          ₹{(calcResult.grossSalary + contributions.reduce((acc, c) => acc + (c.processAmount || 0), 0))?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        variant="contained"
                        color="success"
                        size="large"
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <IconDeviceFloppy size={20} />}
                        onClick={handleSave}
                        disabled={loading || salaryExists}
                        sx={{
                          px: 4,
                          py: 1.25,
                          borderRadius: '8px',
                          fontWeight: 700,
                          textTransform: 'none',
                          boxShadow: theme.palette.mode === 'dark' ? '0 4px 14px rgba(76, 175, 80, 0.4)' : '0 4px 14px rgba(76, 175, 80, 0.2)'
                        }}
                      >
                        {loading ? 'Saving...' : 'Save'}
                      </Button>
                    </Box>
                  </Grid>
                </>
              )}
            </Grid>
          )}
        </MainCard>
      </Box>
    </LocalErrorBoundary>
  );
}
