/**
 * Organization: AUTONOVA
 * Owner: Yuvanesh M
 * Created At: 2026-09-01
 * Description: Reusable Candidate / Employee Autocomplete Dropdown with rich avatar, email, code badges, and polished popper styling.
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Avatar,
  Stack,
  Chip,
  Popper
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { IconMail, IconInfoCircle } from '@tabler/icons-react';
import BOSAutocomplete from './BOSAutocomplete';
import BOSTextField from './BOSTextField';
import { getDisplayString, getPhotoUrl } from './BOSUtils';
import { getFileViewUrl, getUserImageUrl } from 'utils/upload-helper';

export default function BOSCandidateAutocomplete({
  candidates = [],
  value = null,
  onChange,
  label = 'Select Candidate / Employee *',
  placeholder = 'Search candidate / employee...',
  loading = false,
  disabled = false,
  error = false,
  helperText = '',
  required = false,
  size = 'small',
  fullWidth = true,
  minPopperWidth = 420,
  sx = {},
  ...restProps
}) {
  const theme = useTheme();

  // Ensure options include the selected candidate even if outside the current list
  const options = useMemo(() => {
    if (!value || typeof value !== 'object') return candidates || [];
    const exists = (candidates || []).some(
      (c) =>
        (c.id && String(c.id) === String(value.id)) ||
        (c.applicantCode && String(c.applicantCode) === String(value.applicantCode)) ||
        (c.employeeCode && String(c.employeeCode) === String(value.employeeCode))
    );
    return exists ? candidates : [value, ...(candidates || [])];
  }, [candidates, value]);

  const handleChange = (eventOrVal, valParam) => {
    const selected = valParam !== undefined ? valParam : (eventOrVal?.target ? undefined : eventOrVal);
    if (onChange) {
      onChange(selected || null);
    }
  };

  return (
    <BOSAutocomplete
      size={size}
      fullWidth={fullWidth}
      disabled={disabled}
      loading={loading}
      options={options}
      getOptionLabel={(opt) => {
        if (!opt) return '';
        if (typeof opt === 'string') return opt;
        return getDisplayString(opt.candidateName || opt.applicantName || opt.employeeName || opt.name) || '';
      }}
      isOptionEqualToValue={(option, val) => {
        if (!option || !val) return false;
        if (typeof val === 'string' || typeof val === 'number') {
          return (
            String(option.id) === String(val) ||
            String(option.applicantCode) === String(val) ||
            String(option.employeeCode) === String(val) ||
            String(option.candidateName) === String(val)
          );
        }
        return (
          String(option?.id || '') === String(val?.id || '') ||
          (option?.applicantCode && String(option.applicantCode) === String(val?.applicantCode)) ||
          (option?.employeeCode && String(option.employeeCode) === String(val?.employeeCode)) ||
          (option?.candidateName && String(option.candidateName) === String(val?.candidateName))
        );
      }}
      value={value || null}
      onChange={handleChange}
      filterOptions={(opts, state) => {
        const q = (state.inputValue || '').toLowerCase().trim();
        if (!q) return opts;
        return opts.filter((opt) => {
          const name = getDisplayString(opt.candidateName || opt.applicantName || opt.employeeName || opt.name).toLowerCase();
          const emailStr = getDisplayString(opt.personalEmail || opt.email || opt.emailId || opt.officeMail).toLowerCase();
          const codeStr = getDisplayString(opt.applicantCode || opt.employeeCode || opt.empCode || '').toLowerCase();
          const phoneStr = getDisplayString(opt.mobileNo || opt.phone || opt.mobile || '').toLowerCase();
          const deptStr = getDisplayString(opt.departmentName || opt.department || '').toLowerCase();
          const desigStr = getDisplayString(opt.designationName || opt.designation || '').toLowerCase();
          return (
            name.includes(q) ||
            emailStr.includes(q) ||
            codeStr.includes(q) ||
            phoneStr.includes(q) ||
            deptStr.includes(q) ||
            desigStr.includes(q)
          );
        });
      }}
      PopperComponent={(popperProps) => (
        <Popper
          {...popperProps}
          disablePortal={false}
          style={{
            ...popperProps.style,
            zIndex: 99999,
            minWidth: minPopperWidth,
            width: Math.max(popperProps.anchorEl ? popperProps.anchorEl.clientWidth : 0, minPopperWidth)
          }}
          placement="bottom-start"
        />
      )}
      ListboxProps={{
        sx: {
          maxHeight: 340,
          p: 0.75,
          bgcolor: 'background.paper',
          '& .MuiAutocomplete-option': {
            p: 0,
            borderRadius: '8px',
            mb: 0.5
          }
        }
      }}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props;
        const isEmployee =
          option.sourceTag === 'Employee' ||
          option.sourceTag === 'Employee Master' ||
          option.sourceTag === 'EMPLOYEE' ||
          option.sourceType === 'Employee' ||
          Boolean(option.empCode && !String(option.empCode).startsWith('ATS-'));
        const badgeLabel = isEmployee ? 'EMPLOYEE' : 'ATS';
        const name = getDisplayString(option.candidateName || option.applicantName || option.employeeName || option.name) || 'Candidate';
        const email = getDisplayString(option.personalEmail || option.email || option.emailId || option.officeMail);
        const code = getDisplayString(option.applicantCode || option.employeeCode || option.empCode || (option.id ? `ID: ${option.id}` : ''));
        const initials = name
          ? name
              .split(' ')
              .map((n) => n[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
              .toUpperCase()
          : 'C';
        const rawPhoto =
          option.candidatePhoto ||
          option.employeePhotoUpload ||
          option.photoUpload ||
          option.photo ||
          option.profileUpload ||
          option.photoPath ||
          option.profileImage ||
          option.applicantPhoto ||
          option.profilePhoto ||
          (option.personal && (option.personal.photo || option.personal.photoUpload || option.personal.candidatePhoto)) ||
          (option.personalDetail && (option.personalDetail.photo || option.personalDetail.photoUpload || option.personalDetail.candidatePhoto)) ||
          '';
        const photoUrl = rawPhoto ? (getPhotoUrl(rawPhoto) || getUserImageUrl(rawPhoto)) : '';

        return (
          <Box
            component="li"
            key={key || option.id || code || name}
            {...optionProps}
            sx={{
              py: 1.25,
              px: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
              '&:last-child': { borderBottom: 'none' },
              display: 'flex !important',
              flexDirection: 'row !important',
              alignItems: 'center !important',
              width: '100%',
              cursor: 'pointer',
              borderRadius: '8px',
              gap: 1.5,
              transition: 'all 0.15s ease-in-out',
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            {/* Left: Avatar with Profile Photo or Initials */}
            <Avatar
              src={photoUrl || undefined}
              alt={name}
              sx={{
                width: 32,
                height: 32,
                fontSize: '0.78rem',
                fontWeight: 700,
                bgcolor: isEmployee ? 'secondary.light' : 'primary.light',
                color: isEmployee ? 'secondary.dark' : 'primary.dark',
                border: '1px solid',
                borderColor: isEmployee ? 'secondary.200' : 'primary.200',
                flexShrink: 0,
                '& img': { objectFit: 'cover' }
              }}
            >
              {!photoUrl && initials}
            </Avatar>

            {/* Center: Candidate Name & Email */}
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
              <Typography
                variant="subtitle2"
                noWrap
                sx={{
                  fontWeight: 700,
                  color: 'text.primary',
                  fontSize: '0.84rem',
                  letterSpacing: '0.2px',
                  textAlign: 'left',
                  width: '100%'
                }}
              >
                {name}
              </Typography>

              {email ? (
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.25, width: '100%', textAlign: 'left' }}>
                  <IconMail size={13} stroke={1.5} style={{ color: theme.palette.text.secondary, flexShrink: 0 }} />
                  <Typography
                    variant="caption"
                    noWrap
                    sx={{
                      color: 'text.secondary',
                      fontWeight: 500,
                      fontSize: '0.75rem',
                      textAlign: 'left'
                    }}
                  >
                    {email}
                  </Typography>
                </Stack>
              ) : (
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.25, width: '100%', textAlign: 'left' }}>
                  <IconInfoCircle size={13} stroke={1.5} style={{ color: theme.palette.warning.main, flexShrink: 0 }} />
                  <Typography
                    variant="caption"
                    noWrap
                    sx={{
                      color: 'warning.dark',
                      fontStyle: 'italic',
                      fontWeight: 600,
                      fontSize: '0.72rem',
                      textAlign: 'left'
                    }}
                  >
                    No Email ID Available
                  </Typography>
                </Stack>
              )}
            </Box>

            {/* Right: Badge Tag & Applicant/Employee Code */}
            <Stack direction="column" alignItems="flex-end" spacing={0.5} sx={{ flexShrink: 0 }}>
              <Chip
                label={badgeLabel}
                size="small"
                color={isEmployee ? 'secondary' : 'primary'}
                sx={{
                  height: 18,
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  borderRadius: '4px',
                  px: 0.5
                }}
              />
              {code && (
                <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 600 }}>
                  {code}
                </Typography>
              )}
            </Stack>
          </Box>
        );
      }}
      renderInput={(params) => (
        <BOSTextField
          {...params}
          fullWidth
          size={size}
          label={label}
          placeholder={placeholder}
          error={error}
          helperText={helperText}
          required={required}
          sx={{
            ...sx,
            '& .MuiInputBase-root': {
              height: size === 'small' ? 38 : 42,
              fontSize: '0.84rem'
            }
          }}
        />
      )}
      {...restProps}
    />
  );
}

BOSCandidateAutocomplete.propTypes = {
  candidates: PropTypes.array,
  value: PropTypes.oneOfType([PropTypes.object, PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  required: PropTypes.bool,
  size: PropTypes.string,
  fullWidth: PropTypes.bool,
  minPopperWidth: PropTypes.number,
  sx: PropTypes.object
};
