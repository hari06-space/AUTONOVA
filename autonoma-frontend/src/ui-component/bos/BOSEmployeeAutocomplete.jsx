import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Avatar, Typography, Box, Checkbox, Chip, Tooltip } from '@mui/material';
import BOSAutocomplete from './BOSAutocomplete';
import { getPhotoUrl } from './BOSUtils';
import useLookups from 'hooks/useLookups';

/**
 * Standardized BOS Employee Autocomplete Component
 * Automatically displays employee photo avatars, name, and employee code across the application.
 */
const BOSEmployeeAutocomplete = ({
  options: externalOptions,
  value,
  onChange,
  filterPermissionRequest = false,
  filterActiveOnly = true,
  label = 'Employee Name',
  placeholder = 'Search Employee...',
  size = 'small',
  disabled = false,
  error = false,
  helperText = '',
  required = false,
  sx = {},
  ...restProps
}) => {
  const { payrollEmployees: lookupEmployees = [], employees: generalEmployees = [] } = useLookups(
    externalOptions ? [] : ['PAYROLL_EMPLOYEES', 'EMPLOYEES']
  );

  const employeeOptions = useMemo(() => {
    const rawOptions = externalOptions || (lookupEmployees.length ? lookupEmployees : generalEmployees);
    return (rawOptions || []).filter((emp) => {
      if (!emp) return false;
      const fw = String(emp.fromWhere || emp.FROMWHERE || '').trim().toUpperCase();
      if (fw === 'ATS' && !emp.empCode && !emp.oldEmpCode && !emp.newEmpCode) return false;
      if (emp.exitDate || emp.exit_date) return false;
      if (filterActiveOnly) {
        if (emp.isActive === false || emp.active === false) return false;
        const st = String(emp.status || emp.employeeStatus || '').trim().toUpperCase();
        if (['INACTIVE', 'IN-ACTIVE', 'LEFT', 'RESIGNED', 'TERMINATED', 'RELIEVED'].includes(st)) return false;
      }
      if (filterPermissionRequest && String(emp.permissionRequest).toUpperCase() === 'NO') return false;
      return true;
    });
  }, [externalOptions, lookupEmployees, generalEmployees, filterPermissionRequest, filterActiveOnly]);

  const handleChange = (eventOrVal, valParam) => {
    const selected = valParam !== undefined ? valParam : eventOrVal;
    if (onChange) {
      onChange(selected);
    }
  };

  return (
    <BOSAutocomplete
      size={size}
      label={label}
      options={employeeOptions}
      getOptionLabel={(opt) => {
        if (!opt) return '';
        if (typeof opt === 'string') return opt;
        const code = opt.oldEmpCode || opt.empCode || opt.employeeCode || '';
        const name = opt.employeeName || opt.firstName || '';
        if (name) {
          return `${name}${code ? ` (${code})` : ''}`;
        }
        if (opt.label) return opt.label;
        if (opt.value) return String(opt.value);
        return String(opt);
      }}
      value={value}
      onChange={handleChange}
      isOptionEqualToValue={(opt, val) => {
        if (!opt || !val) return false;
        const optId = typeof opt === 'object' && opt !== null ? (opt.id ?? opt.ID ?? opt.employeeId ?? opt.value ?? opt.empCode) : opt;
        const valId = typeof val === 'object' && val !== null ? (val.id ?? val.ID ?? val.employeeId ?? val.value ?? val.empCode) : val;

        if (optId !== null && optId !== undefined && valId !== null && valId !== undefined) {
          if (String(optId).trim() === String(valId).trim()) return true;
        }

        if (typeof val === 'string') {
          const code = opt.oldEmpCode || opt.empCode || opt.employeeCode || '';
          const name = opt.employeeName || opt.firstName || '';
          const combo1 = `${code} - ${name}`;
          const combo2 = `${name} (${code})`;
          return val === code || val === name || val === combo1 || val === combo2 || (code && val.includes(code));
        }
        return false;
      }}
      placeholder={placeholder}
      disabled={disabled}
      error={error}
      helperText={helperText}
      required={required}
      sx={sx}
      renderOption={(props, option, state) => {
        const { key, ...otherProps } = props;
        const selected = state?.selected ?? false;

        const isSelectAll = option && (option === 'Select All' || option.isSelectAll);
        if (isSelectAll) {
          return (
            <li key={key || 'select-all'} {...otherProps} style={{ fontWeight: 600, padding: '6px 12px' }}>
              <Checkbox checked={selected} style={{ marginRight: 8, padding: 2, pointerEvents: 'none' }} />
              <span>{typeof option === 'object' ? option.label : 'Select All'}</span>
            </li>
          );
        }

        if (typeof option === 'string') {
          return (
            <li key={key || option} {...otherProps} style={{ display: 'flex', alignItems: 'center', fontSize: '12px', padding: '6px 12px' }}>
              {restProps.multiple && <Checkbox checked={selected} style={{ marginRight: 6, padding: 2, pointerEvents: 'none' }} />}
              <Tooltip
                placement="right"
                arrow
                enterDelay={100}
                componentsProps={{
                  tooltip: {
                    sx: {
                      bgcolor: 'background.paper',
                      color: 'text.primary',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                      p: 1,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider'
                    }
                  },
                  arrow: { sx: { color: 'background.paper' } }
                }}
                title={
                  <Box sx={{ p: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                      {option.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '12px', mt: 0.5 }}>
                      {option}
                    </Typography>
                  </Box>
                }
              >
                <Avatar
                  sx={{
                    width: 22,
                    height: 22,
                    mr: 1.2,
                    fontSize: '0.7rem',
                    bgcolor: 'primary.main',
                    flexShrink: 0,
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.3)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }
                  }}
                >
                  {option.charAt(0).toUpperCase()}
                </Avatar>
              </Tooltip>
              <Typography variant="body2" sx={{ fontSize: '12.5px', fontWeight: 600, color: 'text.primary' }}>
                {option}
              </Typography>
            </li>
          );
        }

        const name = option.employeeName || option.name || option.label || (typeof option.value === 'string' ? option.value : '');
        const code = option.oldEmpCode || option.empCode || option.employeeCode || '';
        const rawDept = option.departmentName || option.department || '';
        const dept = typeof rawDept === 'object' ? (rawDept?.departmentName || rawDept?.name || rawDept?.label || '') : String(rawDept || '');
        const photo = option.employeePhotoUpload || option.photoUpload || option.photo;
        const avatarLetter = name ? name.charAt(0).toUpperCase() : 'E';

        return (
          <li
            key={key || option.id || option.employeeId || option.value || name}
            {...otherProps}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', padding: '6px 12px' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0 }}>
              {restProps.multiple && <Checkbox checked={selected} style={{ marginRight: 2, padding: 2, pointerEvents: 'none' }} />}
              <Tooltip
                placement="right"
                arrow
                enterDelay={100}
                componentsProps={{
                  tooltip: {
                    sx: {
                      bgcolor: 'background.paper',
                      color: 'text.primary',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                      p: 1,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider'
                    }
                  },
                  arrow: { sx: { color: 'background.paper' } }
                }}
                title={
                  <Box sx={{ p: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <Avatar
                      src={photo ? getPhotoUrl(photo) : undefined}
                      sx={{
                        width: 96,
                        height: 96,
                        fontSize: '2.2rem',
                        bgcolor: 'primary.main',
                        border: '2px solid #e2e8f0',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.18)'
                      }}
                    >
                      {avatarLetter}
                    </Avatar>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '12px', mt: 0.5 }}>
                      {name}
                    </Typography>
                    {dept && (
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '10.5px' }}>
                        {dept}
                      </Typography>
                    )}
                    {code && (
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', fontSize: '10px' }}>
                        {code}
                      </Typography>
                    )}
                  </Box>
                }
              >
                <Avatar
                  src={photo ? getPhotoUrl(photo) : undefined}
                  sx={{
                    width: 24,
                    height: 24,
                    fontSize: '0.75rem',
                    bgcolor: 'primary.main',
                    border: '1px solid #e2e8f0',
                    flexShrink: 0,
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.3)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }
                  }}
                >
                  {avatarLetter}
                </Avatar>
              </Tooltip>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontSize: '12.5px', fontWeight: 600, color: 'text.primary', lineHeight: 1.2 }}>
                  {name}
                </Typography>
                {dept && (
                  <Typography variant="caption" sx={{ fontSize: '10.5px', color: 'text.secondary', display: 'block', mt: 0.2 }}>
                    {dept}
                  </Typography>
                )}
              </Box>
            </Box>

            {code && (
              <Chip
                label={code}
                size="small"
                variant="outlined"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  height: 20,
                  bgcolor: 'action.hover',
                  borderColor: 'divider',
                  ml: 1
                }}
              />
            )}
          </li>
        );
      }}
      {...restProps}
    />
  );
};

BOSEmployeeAutocomplete.propTypes = {
  options: PropTypes.array,
  value: PropTypes.any,
  onChange: PropTypes.func,
  filterPermissionRequest: PropTypes.bool,
  filterActiveOnly: PropTypes.bool,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  size: PropTypes.string,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  helperText: PropTypes.node,
  required: PropTypes.bool,
  sx: PropTypes.object
};

export default BOSEmployeeAutocomplete;
