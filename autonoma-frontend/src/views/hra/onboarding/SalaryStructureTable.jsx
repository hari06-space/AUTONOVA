/**
 * Organization: Nutech
 * Owner: Logaraj S
 * Created At: 2026-08-30
 * Updated By: Logaraj S
 * Updated At: 2026-09-01
 * Description: Memoized Salary Structure Component Table for Offer Letter Module (HA1360).
 *              Renders Earnings, Deductions, Contributions, Statutory Toggles, and Live Totals.
 */

import React, { memo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Stack,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  InputBase,
  Switch,
  Chip,
  Tooltip,
  Button,
  CircularProgress,
  useTheme,
  alpha
} from '@mui/material';
import {
  IconReceipt2,
  IconShieldCheck,
  IconTrendingDown,
  IconTrendingUp,
  IconUsers,
  IconHistory,
  IconRefresh
} from '@tabler/icons-react';

const SalaryStructureTable = memo(function SalaryStructureTable({
  salaryEarnings = [],
  salaryDeductions = [],
  salaryContributions = [],
  localSalary = {},
  onSalaryFieldChange,
  isReadOnly = false,
  salaryLoading = false,
  isPFEnabled = true,
  isESIEnabled = true,
  isPTaxEnabled = true,
  onSalaryToggleChange,
  grossVal = 0,
  deductionsVal = 0,
  contributionsVal = 0,
  netVal = 0,
  ctcVal = 0,
  totalCTC = 0,
  onOpenSalaryChangeLog,
  onAutoCalculate,
  activeCompsList = []
}) {
  const theme = useTheme();

  const renderSingleSalaryTable = (components, type) => {
    return (
      <TableContainer component={Box} sx={{ bgcolor: 'transparent', border: 'none', boxShadow: 'none' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { borderBottom: '2px solid', borderColor: 'divider', bgcolor: theme.palette.primary.main, color: '#ffffff' } }}>
              <TableCell sx={{ fontWeight: 800, py: 1.2, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#ffffff !important', bgcolor: `${theme.palette.primary.main} !important` }}>Component</TableCell>
              <TableCell sx={{ fontWeight: 800, py: 1.2, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#ffffff !important', width: 100, bgcolor: `${theme.palette.primary.main} !important` }}>Basis</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, py: 1.2, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#ffffff !important', width: 150, pr: 2, bgcolor: `${theme.palette.primary.main} !important` }}>Amount (₹)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {components.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ color: 'text.secondary', py: 3, fontSize: '0.8rem' }}>No components configured</TableCell>
              </TableRow>
            ) : (
              components.map((c) => {
                const name = c.componentCode;
                const isFldDisabled = isReadOnly || c.calculationType === 'FORMULA' || c.calculationType === 'PERCENTAGE';
                const placeholder = c.calculationType === 'FORMULA' ? `Formula: ${c.formulaExpression}` :
                  c.calculationType === 'PERCENTAGE' ? `Pct: ${c.calculationValue}%` :
                  c.calculationType === 'FIXED' ? `Fixed: ${c.calculationValue}` :
                  c.calculationType === 'DAILY_RATE' ? `Rate: ${c.calculationValue}` : '0.00';
                return (
                  <TableRow key={name} sx={{ transition: 'background-color 0.2s', '&:hover': { bgcolor: 'rgba(0,0,0,0.015)' }, '& td': { borderBottom: '1px solid', borderColor: 'divider' } }}>
                    <TableCell sx={{ py: 1.25 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{c.displayName || c.componentName}</Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }}>
                      <Chip
                        label={c.calculationType === 'DAILY_RATE' ? 'Attendance' : c.calculationType}
                        size="small"
                        sx={{
                          fontWeight: 750, fontSize: '0.62rem', borderRadius: '6px', height: 19, textTransform: 'uppercase', letterSpacing: '0.4px', border: 'none', cursor: 'default',
                          bgcolor: c.calculationType === 'MANUAL' ? alpha(theme.palette.primary.main, 0.08) : c.calculationType === 'FORMULA' ? alpha(theme.palette.secondary.main, 0.08) : c.calculationType === 'PERCENTAGE' ? alpha(theme.palette.warning.main, 0.08) : alpha(theme.palette.success.main, 0.08),
                          color: c.calculationType === 'MANUAL' ? 'primary.main' : c.calculationType === 'FORMULA' ? 'secondary.main' : c.calculationType === 'PERCENTAGE' ? 'warning.main' : 'success.main'
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25, pr: 1.5 }}>
                      <InputBase
                        type="number"
                        name={name}
                        value={localSalary[name] !== undefined && localSalary[name] !== null && localSalary[name] !== '' ? localSalary[name] : (['DAILY_RATE', 'FIXED'].includes(c.calculationType) ? (c.calculationValue || '') : '')}
                        onChange={(e) => onSalaryFieldChange && onSalaryFieldChange(name, e.target.value)}
                        disabled={isFldDisabled}
                        placeholder={placeholder}
                        sx={{
                          width: '100%', padding: '3px 8px', borderRadius: '6px', border: '1px solid', borderColor: 'divider',
                          bgcolor: isFldDisabled ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.03)') : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#fafafa'),
                          transition: 'all 0.2s', fontSize: '0.875rem',
                          '& input': { textAlign: 'right', padding: 0, fontWeight: 700, color: isFldDisabled ? 'text.secondary' : 'primary.main', '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 }, '&[type=number]': { MozAppearance: 'textfield' } },
                          '&:hover': { borderColor: isFldDisabled ? 'divider' : 'primary.main' },
                          '&.Mui-focused': { borderColor: 'primary.main', bgcolor: 'background.paper', boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.18)}` }
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
            {type === 'earning' && (
              <TableRow sx={{ borderTop: '2px double', borderColor: 'divider', background: 'linear-gradient(90deg,rgba(76,175,80,0.08) 0%,rgba(76,175,80,0.02) 100%)' }}>
                <TableCell colSpan={2} sx={{ py: 1.5, pl: 2 }}><Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'success.dark', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Gross Salary</Typography></TableCell>
                <TableCell align="right" sx={{ py: 1.5, pr: 2 }}><Typography variant="h4" sx={{ fontWeight: 900, color: 'success.main' }}>{grossVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography></TableCell>
              </TableRow>
            )}
            {type === 'deduction' && (
              <TableRow sx={{ borderTop: '2px double', borderColor: 'divider', background: 'linear-gradient(90deg,rgba(239,68,68,0.06) 0%,rgba(239,68,68,0.01) 100%)' }}>
                <TableCell colSpan={2} sx={{ py: 1.5, pl: 2 }}><Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'error.dark', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Deductions</Typography></TableCell>
                <TableCell align="right" sx={{ py: 1.5, pr: 2 }}><Typography variant="h4" sx={{ fontWeight: 900, color: 'error.main' }}>{deductionsVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography></TableCell>
              </TableRow>
            )}
            {type === 'contribution' && (
              <TableRow sx={{ borderTop: '2px double', borderColor: 'divider', background: 'linear-gradient(90deg,rgba(156,39,176,0.06) 0%,rgba(156,39,176,0.01) 100%)' }}>
                <TableCell colSpan={2} sx={{ py: 1.5, pl: 2 }}><Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'secondary.dark', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Contributions</Typography></TableCell>
                <TableCell align="right" sx={{ py: 1.5, pr: 2 }}><Typography variant="h4" sx={{ fontWeight: 900, color: 'secondary.main' }}>{contributionsVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography></TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  if (salaryLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 3, justifyContent: 'center' }}>
        <CircularProgress size={22} />
        <Typography color="text.secondary">Loading salary configuration...</Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      {/* Action Header with History and Auto Calculate */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconShieldCheck size={22} color={theme.palette.primary.main} />
          <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Salary Settings
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          {onOpenSalaryChangeLog && (
            <Tooltip title="Salary Component Audit History">
              <Button
                variant="outlined"
                onClick={onOpenSalaryChangeLog}
                disabled={isReadOnly}
                sx={{
                  minWidth: '36px',
                  width: '36px',
                  height: '36px',
                  p: 0,
                  borderRadius: '8px',
                  color: theme.palette.mode === 'dark' ? '#a855f7' : '#7c3aed',
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(168,85,247,0.3)' : 'rgba(124,58,237,0.2)',
                  '&:hover': {
                    borderColor: theme.palette.mode === 'dark' ? '#a855f7' : '#7c3aed',
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <IconHistory size={18} />
              </Button>
            </Tooltip>
          )}

          {onAutoCalculate && (
            <Button
              variant="contained"
              color="primary"
              onClick={onAutoCalculate}
              disabled={isReadOnly || salaryLoading}
              size="small"
              startIcon={<IconRefresh size={16} />}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                height: '36px',
                px: 1.5,
                boxShadow: 'none',
                '&:hover': { boxShadow: 'none' }
              }}
            >
              Auto Calculate
            </Button>
          )}
        </Stack>
      </Box>

      {/* PF / ESI / PTAX Toggle Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
        {[
          { key: 'providentFund', label: 'Provident Fund (PF)', icon: <IconReceipt2 size={20} />, val: isPFEnabled },
          { key: 'esiAllowed', label: 'Employee State Insurance (ESI)', icon: <IconShieldCheck size={20} />, val: isESIEnabled },
          { key: 'professionalTax', label: 'Professional Tax (PTAX)', icon: <IconTrendingDown size={20} />, val: isPTaxEnabled }
        ].map(({ key, label, icon, val }) => (
          <Box
            key={key}
            onClick={() => {
              if (!isReadOnly && onSalaryToggleChange) onSalaryToggleChange(key, !val);
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              borderRadius: '12px',
              border: '1px solid',
              cursor: isReadOnly ? 'default' : 'pointer',
              bgcolor: val ? (theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.12) : alpha(theme.palette.primary.main, 0.05)) : (theme.palette.mode === 'dark' ? 'background.paper' : '#fafafa'),
              borderColor: val ? 'primary.main' : 'divider',
              transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: val ? `0 2px 8px ${alpha(theme.palette.primary.main, 0.12)}` : 'none',
              '&:hover': { boxShadow: isReadOnly ? 'none' : '0 4px 12px rgba(0,0,0,0.05)', borderColor: isReadOnly ? 'divider' : 'primary.main' }
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ p: 0.75, borderRadius: '8px', bgcolor: val ? alpha(theme.palette.primary.main, 0.12) : 'action.hover', color: val ? 'primary.main' : 'text.secondary', display: 'flex', alignItems: 'center' }}>{icon}</Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>{label}</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: val ? 'success.main' : 'text.secondary' }}>{val ? 'Enabled' : 'Disabled'}</Typography>
              </Box>
            </Stack>
            <Switch checked={val} disabled={isReadOnly} color="primary" sx={{ pointerEvents: 'none' }} />
          </Box>
        ))}
      </Box>

      {/* Earnings / Deductions / Contributions Tables */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2.5, alignItems: 'stretch' }}>
        <Paper variant="outlined" sx={{ flex: '1 1 0', minWidth: 0, p: 2.5, display: 'flex', flexDirection: 'column', borderRadius: '14px', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : '#ffffff' }}>
          <Typography variant="subtitle1" sx={{ color: 'success.main', fontWeight: 800, textTransform: 'uppercase', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, letterSpacing: '0.5px', fontSize: '0.8rem' }}>
            <IconTrendingUp size={18} color={theme.palette.success.main} />Earnings
          </Typography>
          {renderSingleSalaryTable(salaryEarnings, 'earning')}
        </Paper>

        <Paper variant="outlined" sx={{ flex: '1 1 0', minWidth: 0, p: 2.5, display: 'flex', flexDirection: 'column', borderRadius: '14px', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : '#ffffff' }}>
          <Typography variant="subtitle1" sx={{ color: 'error.main', fontWeight: 800, textTransform: 'uppercase', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, letterSpacing: '0.5px', fontSize: '0.8rem' }}>
            <IconTrendingDown size={18} color={theme.palette.error.main} />Deductions
          </Typography>
          {renderSingleSalaryTable(salaryDeductions, 'deduction')}
        </Paper>

        <Paper variant="outlined" sx={{ flex: '1 1 0', minWidth: 0, p: 2.5, display: 'flex', flexDirection: 'column', borderRadius: '14px', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : '#ffffff' }}>
          <Typography variant="subtitle1" sx={{ color: 'secondary.main', fontWeight: 800, textTransform: 'uppercase', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, letterSpacing: '0.5px', fontSize: '0.8rem' }}>
            <IconUsers size={18} color={theme.palette.secondary.main} />Contributions
          </Typography>
          {renderSingleSalaryTable(salaryContributions, 'contribution')}
        </Paper>
      </Box>

      {/* Salary Summary Panel */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: '18px', bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.08) : alpha(theme.palette.primary.main, 0.03), border: '1px solid', borderColor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.primary.main, 0.1) }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr 1fr' }, gap: 2 }}>
          {[
            { label: 'Gross Earnings', value: grossVal, color: 'success.main', bg: 'rgba(76,175,80,0.04)' },
            { label: 'Total Deductions', value: deductionsVal, color: 'error.main', bg: 'rgba(239,68,68,0.04)' },
            { label: 'Net Salary', value: netVal, color: 'primary.main', bg: alpha(theme.palette.primary.main, 0.06) },
            { label: 'Monthly CTC', value: ctcVal, color: 'secondary.main', bg: 'rgba(156,39,176,0.04)' },
            { label: 'Annual CTC', value: totalCTC, color: 'warning.dark', bg: 'rgba(255,152,0,0.06)' }
          ].map(({ label, value, color, bg }) => (
            <Box key={label} sx={{ p: 1.75, borderRadius: '12px', bgcolor: bg, textAlign: 'center', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', fontSize: '0.68rem' }}>{label}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color, mt: 0.5, fontSize: label === 'Annual CTC' ? '1.1rem' : '1rem' }}>
                ₹{value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      {activeCompsList.length === 0 && !salaryLoading && (
        <Box sx={{ textAlign: 'center', py: 2, color: 'text.secondary' }}>
          <Typography variant="body2">Select a candidate above to load their salary structure, or configure salary components in HR Settings.</Typography>
        </Box>
      )}
    </Stack>
  );
});

SalaryStructureTable.propTypes = {
  salaryEarnings: PropTypes.array,
  salaryDeductions: PropTypes.array,
  salaryContributions: PropTypes.array,
  localSalary: PropTypes.object,
  onSalaryFieldChange: PropTypes.func,
  isReadOnly: PropTypes.bool,
  salaryLoading: PropTypes.bool,
  isPFEnabled: PropTypes.bool,
  isESIEnabled: PropTypes.bool,
  isPTaxEnabled: PropTypes.bool,
  onSalaryToggleChange: PropTypes.func,
  grossVal: PropTypes.number,
  deductionsVal: PropTypes.number,
  contributionsVal: PropTypes.number,
  netVal: PropTypes.number,
  ctcVal: PropTypes.number,
  totalCTC: PropTypes.number,
  onOpenSalaryChangeLog: PropTypes.func,
  onAutoCalculate: PropTypes.func,
  activeCompsList: PropTypes.array
};

export default SalaryStructureTable;
