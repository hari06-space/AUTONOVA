import { useState, useEffect, useCallback, useImperativeHandle, forwardRef, useRef } from 'react';
import { Grid, Button, Stack, MenuItem, Typography, useTheme, Box, Divider, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, InputBase, FormControl, FormHelperText, TextField, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete, Switch, FormControlLabel, ClickAwayListener } from '@mui/material';
import { IconPlus, IconDeviceFloppy, IconTrash, IconHeart, IconFileText, IconMapPin, IconCertificate, IconCar, IconActivity, IconGavel, IconCamera, IconDeviceLaptop, IconUsers, IconAmbulance, IconAlertTriangle, IconEPassport, IconShieldCheck, IconBuildingBank, IconSchool, IconReceipt2, IconBriefcase, IconDevices, IconTrendingUp, IconTrendingDown, IconEye, IconRefresh, IconHistory, IconCopy } from '@tabler/icons-react';
import { BOSFormSection, BOSTextField, BOSDatePicker, BOSDataTable, btnSave, btnDelete, BOSFileUpload, errorStyle, BOSAutocomplete } from 'ui-component/bos';
import useBOSValidation from 'hooks/useBOSValidation';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';
import { autoUploadFile, getFileDownloadUrl } from 'utils/upload-helper';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import { formatDateTime } from 'utils/BOSTimeUtils';
import CloseIcon from '@mui/icons-material/Close';
import useRealtimeRefresh from 'hooks/useRealtimeRefresh';
import usePagePermissions from 'hooks/usePagePermissions';
import { formatPhoneForDisplay, validatePhoneNumber } from 'utils/phoneUtils';
import { lookupPostalCode } from 'utils/postalUtils';

const API = API_PATHS.HRM.EMPLOYEES;

const getFileListFromRow = (fileObj) => {
  if (!fileObj || !fileObj.serverFileName) return [];
  const paths = fileObj.serverFileName.split(',');
  return paths.map(path => {
    const trimmedPath = path.trim();
    const nameSegment = trimmedPath.substring(Math.max(trimmedPath.lastIndexOf('/'), trimmedPath.lastIndexOf('\\')) + 1);
    return {
      serverFileName: trimmedPath,
      fileName: nameSegment
    };
  }).filter(f => f.serverFileName);
};

const snack = (dispatch, msg, sev = 'success') => dispatch(openSnackbar({ open: true, message: msg, variant: 'alert', alert: { variant: 'filled' }, severity: sev, close: false }));

const STANDARD_JOB_PROFILE_KEYS = new Set([
  'id',
  'employeeId',
  'wagesType',
  'paymentMode',
  'salaryAccountNumber',
  'accountName',
  'bankAccountType',
  'personalAccountNumber',
  'bankName',
  'ifscCode',
  'branchName',
  'isActive',
  'createdBy',
  'createdDate',
  'updatedBy',
  'updatedDate',
  'dynamicComponents',
  'officeEmail',
  'officialPassword',
  'providentFund',
  'esiAllowed',
  'professionalTax',
  'ltaEligible',
  'lossOfMinutesDeduct',
  'permissionRequest',
  'companyContact1',
  'companyContact2',
  'overTimeAllowed',
  'overTimeFactorial',
  'overTimeRatePerHour'
]);

const GridContainer = ({ children, columns = { xs: 1, sm: 2, md: 3 } }) => {
  const templateColumns = typeof columns === 'object'
    ? { xs: `repeat(${columns.xs || 1}, 1fr)`, sm: `repeat(${columns.sm || 2}, 1fr)`, md: `repeat(${columns.md || 3}, 1fr)` }
    : `repeat(${columns}, 1fr)`;
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: templateColumns, gap: 2.5 }}>
      {children}
    </Box>
  );
};

const R = ({ children, lg }) => {
  let gridColumn = 'span 1';
  if (lg === 6) gridColumn = { xs: 'span 1', sm: 'span 2', md: 'span 2' };
  if (lg === 8) gridColumn = { xs: 'span 1', sm: 'span 2', md: 'span 2' };
  if (lg === 12) gridColumn = { xs: 'span 1', sm: 'span 2', md: 'span 3' };
  return <Box sx={{ gridColumn }}>{children}</Box>;
};

const parseHeight = (val) => {
  if (!val) return { feet: '', inches: '' };
  const str = String(val).trim();
  const parts = str.split("'");
  if (parts.length >= 2) {
    const ft = parts[0].trim();
    const inch = parts[1].replace(/"/g, '').trim();
    return { feet: ft, inches: inch };
  }
  const match = str.match(/^(\d+)$/);
  if (match) {
    return { feet: match[1], inches: '0' };
  }
  return { feet: '', inches: '' };
};

function Section1to1({ title, icon, endpoint, employeeId, fields, validation, onPreview, registerSave, onFormChange }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [form, setForm] = useState({});
  const [loaded, setLoaded] = useState(!employeeId);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    const hasCountryField = fields && fields.some(f => f.name === 'country' || f.name === 'nationality');
    if (hasCountryField) {
      axios.get('/api/admin/countries')
        .then(res => setCountries(res.data || []))
        .catch(console.error);
    }
    const hasStateField = fields && fields.some(f => f.name === 'state');
    if (hasStateField) {
      axios.get('/api/admin/states')
        .then(res => setStates(res.data || []))
        .catch(console.error);
    }
    const hasCityField = fields && fields.some(f => f.name === 'city');
    if (hasCityField) {
      axios.get('/api/admin/city')
        .then(res => setCities(res.data || []))
        .catch(console.error);
    }
  }, []);

  const { errors, validate: validateFields, clearErrors } = useBOSValidation();

  const h = (e) => {
    const { name, value } = e.target;
    setForm((p) => {
      let next = { ...p, [name]: value };
      if (onFormChange) {
        next = onFormChange(name, value, next, setForm);
      }
      return next;
    });

    if (name === 'officeEmail') {
      const val = String(value || '').trim();
      const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (val !== '' && !EMAIL_REGEX.test(val)) {
        errors[name] = 'Invalid Office Email format (e.g. name@domain.com)';
      } else {
        if (errors[name]) clearErrors(name);
      }
    } else {
      if (errors[name]) clearErrors(name);
    }
  };

  const disabled = !employeeId;

  const fetchData = useCallback(() => {
    if (!employeeId) { setLoaded(true); return; }
    axios.get(`${API}/${employeeId}/${endpoint}`)
      .then(({ data }) => {
        if (data && data.id) {
          let cleaned = { ...data };

          if (endpoint === 'job-profile') {
            if (cleaned.basicSalary) cleaned.BASIC = cleaned.basicSalary;
            if (cleaned.da) cleaned.DA = cleaned.da;
            if (cleaned.hra) cleaned.HRA = cleaned.hra;
            if (cleaned.grossSalary) cleaned.GROSS = cleaned.grossSalary;
            if (cleaned.pfEmployee) cleaned.PF_EMP = cleaned.pfEmployee;
            if (cleaned.esiEmployee) cleaned.ESI_EMP = cleaned.esiEmployee;
            if (cleaned.professionalTaxAmount) cleaned.PT = cleaned.professionalTaxAmount;
            if (cleaned.netSalary) cleaned.NET_SALARY = cleaned.netSalary;
            if (cleaned.specialAllowance) cleaned.SPECIAL_ALLOWANCE = cleaned.specialAllowance;

            if (cleaned.dynamicComponents) {
              try {
                const parsed = JSON.parse(cleaned.dynamicComponents);
                Object.assign(cleaned, parsed);
              } catch (e) {
                console.error("Failed to parse dynamicComponents JSON", e);
              }
            }

            // Auto-default paymentMode to BANK if bank details are present but paymentMode is empty
            if ((cleaned.salaryAccountNumber || cleaned.bankName || cleaned.ifscCode) && !cleaned.paymentMode) {
              cleaned.paymentMode = 'BANK';
            } else if (!cleaned.paymentMode) {
              cleaned.paymentMode = 'CASH';
            }
          }

          fields.forEach(f => {
            const val = cleaned[f.name];
            if (f.placeholder && (val === 0 || val === 0.0 || val === '0' || val === '0.0' || val === '0.00')) {
              cleaned[f.name] = '';
            }
          });
          if (onFormChange) {
            cleaned = onFormChange(null, null, cleaned, setForm);
          }
          setForm(cleaned);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [employeeId, endpoint, onFormChange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useRealtimeRefresh(() => {
    fetchData();
  });

  useEffect(() => {
    if (onFormChange && Object.keys(form).length > 0) {
      setForm((p) => {
        const next = onFormChange(null, null, p, setForm);
        let changed = false;
        for (const k in next) {
          if (next[k] !== p[k]) {
            changed = true;
            break;
          }
        }
        return changed ? next : p;
      });
    }
  }, [onFormChange]);
  const save = async (isOverall = false) => {
    if (!employeeId) {
      snack(dispatch, 'Save Main Employee Details First', 'error');
      return;
    }

    // Check if the form has any non-empty data
    const hasAnyData = fields.some(f => {
      if (!f.name) return false;
      const val = form[f.name];
      return val !== undefined && val !== null && String(val).trim() !== '';
    });

    if (!hasAnyData) {
      return;
    }

    // Prepare validation rules dynamically based on fields
    const rules = fields
      .filter(f => f.name && f.required && !(f.hideIf && f.hideIf(form)) && (typeof f.disabled === 'function' ? !f.disabled(form) : !f.disabled))
      .map(f => ({ field: f.name, label: f.label.replace('*', '').trim(), required: true }));

    const displayTitle = title || endpoint || 'Section';

    if (rules.length > 0) {
      if (!validateFields(form, rules)) {
        if (isOverall) throw new Error(`Validation failed for ${displayTitle}`);
        return;
      }
    }

    // Check phone fields validations using the centralized utility
    const phoneFields = fields.filter(f => f.type === 'phone' || f.name?.toLowerCase().includes('phone') || f.name?.toLowerCase().includes('mobile') || f.name === 'contactNo');
    for (const f of phoneFields) {
      const val = form[f.name];
      if (val) {
        const check = validatePhoneNumber(val);
        if (!check.isValid) {
          snack(dispatch, `${f.label.replace('*', '').trim()}: ${check.message}`, 'error');
          if (isOverall) throw new Error(`${f.label.replace('*', '').trim()}: ${check.message}`);
          return;
        }
      }
    }

    if (validation) {
      const valResult = validation(form);
      if (valResult !== true) {
        const errorMsg = typeof valResult === 'string' ? valResult : `Validation failed for ${displayTitle}`;
        snack(dispatch, errorMsg, 'error');
        if (errorMsg.includes('Office Email')) {
          setErrors(prev => ({ ...prev, officeEmail: errorMsg }));
        }
        if (isOverall) throw new Error(errorMsg);
        return;
      }
    }

    let payload = {};
    if (form.id) payload.id = form.id;
    if (form.employeeId) payload.employeeId = form.employeeId;
    fields.forEach(f => {
      if (f.name && form[f.name] !== undefined) {
        payload[f.name] = form[f.name];
      }
    });

    // Clean up empty string properties to null to prevent deserialization errors on the backend (e.g. Jackson trying to parse "" into Long, Double, or Date fields)
    Object.keys(payload).forEach(key => {
      if (payload[key] === '') {
        payload[key] = null;
      }
    });

    if (payload.officeEmail && String(payload.officeEmail).trim() !== '') {
      const emailVal = String(payload.officeEmail).trim();
      const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!EMAIL_REGEX.test(emailVal)) {
        const msg = 'Invalid Office Email format. Please enter a valid email address (e.g. name@domain.com).';
        snack(dispatch, msg, 'error');
        setErrors(prev => ({ ...prev, officeEmail: true }));
        if (isOverall) throw new Error(msg);
        return;
      }
    }

    if (endpoint === 'job-profile') {
      const dynamicComps = {};
      Object.keys(payload).forEach(key => {
        if (!STANDARD_JOB_PROFILE_KEYS.has(key)) {
          dynamicComps[key] = payload[key];
          delete payload[key];
        }
      });
      payload.dynamicComponents = JSON.stringify(dynamicComps);
    }

    try {
      const { data } = await axios.post(`${API}/${employeeId}/${endpoint}`, payload);
      let cleaned = { ...data };
      if (cleaned.dynamicComponents) {
        try {
          const parsed = JSON.parse(cleaned.dynamicComponents);
          Object.assign(cleaned, parsed);
        } catch (e) {
          console.error("Failed to parse dynamicComponents JSON on save response", e);
        }
      }
      setForm(cleaned);
      if (!isOverall) {
        snack(dispatch, `${title} saved successfully!`);
      }
    }
    catch (err) {
      if (isOverall) throw err;
      snack(dispatch, `Failed to save ${title}. Please try again.`, 'error');
    }
  };

  useEffect(() => {
    if (registerSave) {
      return registerSave(title || endpoint, save);
    }
  }, [registerSave, save, title, endpoint]);

  const upload = (field, files) => {
    if (files && files.length > 0) {
      setForm(p => ({ ...p, [field]: files[0].serverFileName }));
    } else {
      setForm(p => ({ ...p, [field]: '' }));
    }
    if (errors[field]) clearErrors(field);
  };

  if (!loaded) return null;
  const content = (
    <GridContainer>
      {fields.map((f, i) => {
        const isHidden = f.hideIf && f.hideIf(form);
        if (isHidden) return null;
        if (f.type === 'subheader') return (
          <Box key={`sub-${i}`} sx={{ gridColumn: { xs: 'span 1', sm: 'span 2', md: 'span 3' }, width: '100%' }}>
            <Box sx={{ mt: i === 0 ? 0 : 4, mb: 1.5, width: '100%' }}>
              <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 4, height: 20, bgcolor: 'primary.main', borderRadius: 1 }} />
                {f.label}
              </Typography>
              <Divider sx={{ mt: 1, borderColor: 'primary.light', borderBottomWidth: 2, opacity: 0.2 }} />
            </Box>
          </Box>
        );
        return (
          <R key={f.name || i} lg={f.lg || 4}>
            {(() => {
              const isFldDisabled = disabled || (typeof f.disabled === 'function' ? f.disabled(form) : f.disabled);
              return (f.name === 'country' || f.name === 'nationality' || f.name === 'state' || f.name === 'city') ? (
                <BOSAutocomplete
                  fullWidth
                  freeSolo={f.freeSolo !== false}
                  value={form[f.name] || null}
                  onChange={(val) => {
                    setForm((p) => {
                      let next = { ...p, [f.name]: val };
                      if (onFormChange) {
                        next = onFormChange(f.name, val, next, setForm);
                      }
                      return next;
                    });
                    if (errors[f.name]) clearErrors(f.name);
                  }}
                  options={
                    f.name === 'state'
                      ? (states || []).map(s => s.stateName || s)
                      : f.name === 'city'
                        ? (cities || []).map(c => c.cityName || c)
                        : (countries || []).map(c => c.country || c.countryName || c)
                  }
                  label={f.label}
                  disabled={isFldDisabled}
                  error={!!errors[f.name]}
                  helperText={errors[f.name]}
                  sx={errorStyle(!!errors[f.name])}
                />
              ) : f.type === 'switch' ? (
                (() => {
                  const rawVal = form[f.name];
                  const isChecked = (() => {
                    if (rawVal === true || rawVal === 1 || rawVal === '1') return true;
                    if (rawVal === false || rawVal === 0 || rawVal === '0') return false;
                    if (['providentFund', 'esiAllowed', 'professionalTax'].includes(f.name)) {
                      return String(rawVal).toUpperCase() === 'YES';
                    }
                    return String(rawVal).toLowerCase() === 'true';
                  })();
                  const toggleVal = () => {
                    if (isFldDisabled) return;
                    const val = isChecked ? 'NO' : (['providentFund', 'esiAllowed', 'professionalTax'].includes(f.name) ? 'YES' : '1');
                    setForm((p) => {
                      let next = { ...p, [f.name]: val };
                      if (onFormChange) {
                        next = onFormChange(f.name, val, next, setForm);
                      }
                      return next;
                    });
                    if (errors[f.name]) clearErrors(f.name);
                  };
                  return (
                    <Box
                      onClick={toggleVal}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 2,
                        borderRadius: '12px',
                        border: '1px solid',
                        cursor: isFldDisabled ? 'default' : 'pointer',
                        bgcolor: isChecked
                          ? (theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.08)' : 'rgba(33, 150, 243, 0.04)')
                          : (theme.palette.mode === 'dark' ? 'background.paper' : '#fafafa'),
                        borderColor: isChecked ? theme.palette.primary.main : theme.palette.divider,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: isChecked
                          ? (theme.palette.mode === 'dark' ? '0 2px 8px rgba(33, 150, 243, 0.15)' : '0 2px 8px rgba(33, 150, 243, 0.08)')
                          : 'none',
                        '&:hover': {
                          boxShadow: isFldDisabled ? 'none' : '0 4px 12px rgba(0,0,0,0.05)',
                          borderColor: isFldDisabled ? theme.palette.divider : theme.palette.primary.main,
                        }
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: '8px',
                            bgcolor: isChecked
                              ? (theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)')
                              : 'action.hover',
                            color: isChecked ? theme.palette.primary.main : 'text.secondary',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {f.name === 'providentFund' && <IconReceipt2 size={20} />}
                          {f.name === 'esiAllowed' && <IconShieldCheck size={20} />}
                          {f.name === 'professionalTax' && <IconTrendingDown size={20} />}
                          {f.name === 'ltaEligible' && <IconFileText size={20} />}
                          {f.name === 'lossOfMinutesDeduct' && <IconActivity size={20} />}
                          {f.name === 'permissionRequest' && <IconGavel size={20} />}
                          {f.name === 'overTimeAllowed' && <IconHistory size={20} />}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.875rem' }}>
                            {f.label}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: isChecked ? 'success.main' : 'text.secondary' }}>
                            {isChecked ? 'Enabled' : 'Disabled'}
                          </Typography>
                          {f.name === 'overTimeAllowed' && isChecked && (
                            <Grid container spacing={2} sx={{ mt: 1.5, width: '100%' }} onClick={(e) => e.stopPropagation()}>
                              <Grid item xs={6}>
                                <TextField
                                  size="small"
                                  label="Overtime Factorial"
                                  value={form.overTimeFactorial || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setForm((p) => {
                                      let next = { ...p, overTimeFactorial: val };
                                      if (onFormChange) {
                                        next = onFormChange('overTimeFactorial', val, next, setForm);
                                      }
                                      return next;
                                    });
                                  }}
                                  type="number"
                                  inputProps={{ step: "0.1", min: "0" }}
                                  fullWidth
                                />
                              </Grid>
                              <Grid item xs={6}>
                                <TextField
                                  size="small"
                                  label="Per Hour Amount"
                                  value={form.overTimeRatePerHour || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setForm((p) => {
                                      let next = { ...p, overTimeRatePerHour: val };
                                      if (onFormChange) {
                                        next = onFormChange('overTimeRatePerHour', val, next, setForm);
                                      }
                                      return next;
                                    });
                                  }}
                                  type="number"
                                  inputProps={{ step: "0.01", min: "0" }}
                                  fullWidth
                                />
                              </Grid>
                            </Grid>
                          )}
                        </Box>
                      </Stack>
                      <Switch
                        checked={isChecked}
                        disabled={isFldDisabled}
                        color="primary"
                        sx={{ pointerEvents: 'none' }}
                      />
                    </Box>
                  );
                })()
              ) : f.select ? (
                <BOSTextField
                  select
                  name={f.name}
                  label={f.label}
                  value={form[f.name] || ''}
                  onChange={h}
                  disabled={isFldDisabled}
                  size={f.size}
                  error={!!errors[f.name]}
                  helperText={errors[f.name]}
                  sx={errorStyle(!!errors[f.name])}
                >
                  {f.options.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </BOSTextField>
              ) : f.type === 'file' ? (
                <BOSFileUpload
                  files={form[f.name] ? [{ fileName: form[f.name].split('/').pop(), serverFileName: form[f.name], isServer: true }] : []}
                  onChange={(files) => upload(f.name, files)}
                  module={f.module || "HRA_PROFILE"}
                  multiple={false}
                  maxFiles={1}
                  compact={true}
                  label={f.label}
                  disabled={isFldDisabled}
                  error={!!errors[f.name]}
                  helperText={errors[f.name]}
                  sx={errorStyle(!!errors[f.name])}
                  scan={f.scan}
                />
              ) : f.type === 'date' ? (
                <BOSDatePicker
                  name={f.name}
                  label={f.label}
                  value={form[f.name] || ''}
                  onChange={h}
                  disabled={isFldDisabled}
                  required={f.required}
                  disablePast={f.disablePast !== undefined ? f.disablePast : true}
                  error={!!errors[f.name]}
                  helperText={errors[f.name]}
                  sx={errorStyle(!!errors[f.name])}
                />
              ) : f.type === 'height' ? (
                (() => {
                  const { feet, inches } = parseHeight(form[f.name]);
                  return (
                    <FormControl error={!!errors[f.name]} fullWidth>
                      <Box sx={{ display: 'flex', gap: 1.5, width: '100%' }}>
                        <TextField
                          select
                          size="small"
                          label="Height (Ft)"
                          value={feet !== '' ? Number(feet) : ''}
                          onChange={(e) => {
                            const newFeet = e.target.value;
                            const nextVal = newFeet !== '' ? `${newFeet}' ${inches || '0'}"` : '';
                            setForm((p) => ({ ...p, [f.name]: nextVal }));
                            if (errors[f.name]) clearErrors(f.name);
                          }}
                          disabled={isFldDisabled}
                          error={!!errors[f.name]}
                          sx={{ flex: 1, ...errorStyle(!!errors[f.name]) }}
                        >

                          {[3, 4, 5, 6, 7, 8].map(v => (
                            <MenuItem key={v} value={v}>{v} ft</MenuItem>
                          ))}
                        </TextField>
                        <TextField
                          select
                          size="small"
                          label="Height (In)"
                          value={inches !== '' ? Number(inches) : ''}
                          onChange={(e) => {
                            const newInches = e.target.value;
                            const nextVal = feet ? `${feet}' ${newInches !== '' ? newInches : '0'}"` : '';
                            setForm((p) => ({ ...p, [f.name]: nextVal }));
                            if (errors[f.name]) clearErrors(f.name);
                          }}
                          disabled={isFldDisabled || !feet}
                          error={!!errors[f.name]}
                          sx={{ flex: 1, ...errorStyle(!!errors[f.name]) }}
                        >

                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(v => (
                            <MenuItem key={v} value={v}>{v} in</MenuItem>
                          ))}
                        </TextField>
                      </Box>
                      {errors[f.name] && (
                        <FormHelperText error sx={{ ml: 1, mt: 0.5 }}>
                          {errors[f.name]}
                        </FormHelperText>
                      )}
                    </FormControl>
                  );
                })()
              ) : (
                <BOSTextField
                  name={f.name}
                  label={f.label}
                  value={form[f.name] || ''}
                  onChange={h}
                  type={f.type || 'text'}
                  maxLength={f.max}
                  disabled={isFldDisabled}
                  multiline={f.multiline}
                  rows={f.rows}
                  required={f.required}
                  size={f.size}
                  placeholder={f.placeholder}
                  error={!!errors[f.name]}
                  helperText={errors[f.name]}
                  sx={errorStyle(!!errors[f.name])}
                  country={form.country || form.nationality || ''}
                />
              );
            })()}
          </R>
        );
      })}
    </GridContainer>
  );

  const footer = (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
      <Button
        variant="contained"
        startIcon={<IconDeviceFloppy size={18} />}
        onClick={() => save(false)}
        sx={btnSave}
      >
        Save {title}
      </Button>
    </Box>
  );

  if (!title) return (
    <Box sx={{ p: 0 }}>
      {content}
    </Box>
  );

  return (
    <BOSFormSection icon={icon || <IconHeart size={20} color={theme.palette.primary.main} />} title={title}>
      {content}
    </BOSFormSection>
  );
}

function Section1toN({ title, icon, endpoint, employeeId, fields, tableCols, transformRow, transformPayload, validation, onFormChange, onPreview, columns }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const perms = usePagePermissions('M2210');
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({});
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTargetRow, setDeleteTargetRow] = useState(null);
  const [customFields, setCustomFields] = useState({});

  const { errors, validate: validateFields, clearErrors } = useBOSValidation();

  const h = (e) => {
    const { name, value } = e.target;
    setForm((p) => {
      let next = { ...p, [name]: value };
      if (onFormChange) {
        next = onFormChange(name, value, next);
      }
      return next;
    });
    if (errors[name]) clearErrors(name);
  };

  const disabled = !employeeId;

  const formatFileName = (name) => {
    if (!name) return '';
    let clean = name.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[_-]/i, '');
    if (clean.length > 20) {
      const extIdx = clean.lastIndexOf('.');
      const ext = extIdx !== -1 ? clean.substring(extIdx) : '';
      const base = extIdx !== -1 ? clean.substring(0, extIdx) : clean;
      if (base.length > 12) {
        return base.substring(0, 8) + '...' + base.substring(base.length - 4) + ext;
      }
    }
    return clean;
  };

  const load = useCallback(() => {
    if (!employeeId) return;
    axios.get(`${API}/${employeeId}/${endpoint}`)
      .then(({ data }) => {
        const resolved = transformRow && Array.isArray(data) ? data.map(transformRow) : (data || []);
        setRows(resolved);
      })
      .catch(() => { });
  }, [employeeId, endpoint, transformRow]);

  useEffect(() => { load(); }, [load]);

  useRealtimeRefresh(() => {
    load();
  });

  const upload = (field, files) => {
    if (files && files.length > 0) {
      const pathsStr = files.map(f => f.serverFileName || f.path || f.filePath).filter(p => p).join(',');
      setForm(p => ({ ...p, [field]: pathsStr }));
    } else {
      setForm(p => ({ ...p, [field]: '' }));
    }
    if (errors[field]) clearErrors(field);
  };

  const add = async () => {
    if (!employeeId) {
      snack(dispatch, 'Save Main Employee Details First', 'error');
      return;
    }

    // Check if any data was actually entered
    const hasData = fields.some(f => {
      if (!f.name) return false;
      const v = form[f.name];
      return v !== null && v !== '' && v !== undefined;
    });
    if (!hasData) {
      snack(dispatch, 'Please fill the record details before adding.', 'warning');
      return;
    }

    const rules = fields
      .filter(f => f.name && (f.required || f.pattern || f.validate))
      .map(f => ({
        field: f.name,
        label: f.label.replace('*', '').trim(),
        required: f.required,
        pattern: f.pattern,
        patternMessage: f.patternMessage,
        validate: f.validate
      }));

    if (rules.length > 0) {
      if (!validateFields(form, rules)) {
        return;
      }
    }

    // Check max files limit
    const fileFields = fields.filter(f => f.type === 'file');
    for (const f of fileFields) {
      const val = form[f.name];
      if (val) {
        const count = val.split(',').filter(x => x.trim()).length;
        const max = f.maxFiles || 1;
        if (count > max) {
          snack(dispatch, `${f.label.replace('*', '').trim()} cannot have more than ${max} files.`, 'error');
          return;
        }
      }
    }

    // Check phone fields validations using the centralized utility
    const phoneFields = fields.filter(f => f.type === 'phone' || f.name?.toLowerCase().includes('phone') || f.name?.toLowerCase().includes('mobile') || f.name === 'contactNo');
    for (const f of phoneFields) {
      const val = form[f.name];
      if (val) {
        const check = validatePhoneNumber(val);
        if (!check.isValid) {
          snack(dispatch, `${f.label.replace('*', '').trim()}: ${check.message}`, 'error');
          return;
        }
      }
    }

    // Check for duplicate document name in existing rows (case-insensitive and trimmed)
    if (form.documentName) {
      const isDuplicate = rows.some(row => {
        return row.documentName && String(row.documentName).trim().toUpperCase() === String(form.documentName).trim().toUpperCase();
      });
      if (isDuplicate) {
        snack(dispatch, `Document "${form.documentName.trim()}" already exists!`, 'error');
        return;
      }
    }

    if (validation && !validation(form)) return;

    try {
      const rawPayload = transformPayload ? transformPayload(form) : form;
      const payload = { ...rawPayload };
      Object.keys(payload).forEach(key => {
        if (payload[key] === '') {
          payload[key] = null;
        }
      });
      await axios.post(`${API}/${employeeId}/${endpoint}`, payload);
      setForm({});
      setCustomFields({});
      clearErrors();
      load();
      snack(dispatch, `${title} record added successfully!`);
    }
    catch { snack(dispatch, 'Failed to save record. Please check required fields.', 'error'); }
  };

  const handleDeleteConfirm = async () => {
    if (!employeeId || !deleteTargetRow) return;
    try {
      await axios.delete(`${API}/${endpoint}/${deleteTargetRow.id}`);
      load();
      snack(dispatch, 'Deleted!');
      setDeleteOpen(false);
      setDeleteTargetRow(null);
    }
    catch { snack(dispatch, 'Failed to delete', 'error'); }
  };

  const handleDeleteClick = (row) => {
    setDeleteTargetRow(row);
    setDeleteOpen(true);
  };

  const leftFields = fields.filter(f => f.column === 'left');
  const rightFields = fields.filter(f => f.column === 'right');
  const standardFields = fields.filter(f => !f.column);

  const renderField = (f) => {
    if (f.type === 'file') {
      const filesList = form[f.name] ? form[f.name].split(',').map(path => {
        const trimmed = path.trim();
        return {
          fileName: trimmed.split('/').pop().split('\\').pop(),
          serverFileName: trimmed,
          isServer: true
        };
      }).filter(file => file.serverFileName) : [];

      if (f.splitLayout) {
        const atLimit = filesList.length >= (f.maxFiles || 1);

        if (atLimit) {
          return (
            <R lg={12}>
              <Box sx={{ p: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
                  Uploaded Documents
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 1.5, mt: 1 }}>
                  {filesList.map((file, fIdx) => {
                    const formattedName = formatFileName(file.fileName);
                    return (
                      <Box
                        key={fIdx}
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 1,
                          p: 0.75,
                          px: 1.25,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'background.paper',
                          width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(20% - 12px)' },
                          minWidth: 150,
                          boxSizing: 'border-box',
                          flexShrink: 0
                        }}
                      >
                        <Box sx={{ width: 28, height: 28, borderRadius: 1, bgcolor: 'primary.lighter', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <IconFileText size={16} color="#2196f3" />
                        </Box>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} noWrap title={file.fileName} sx={{ textOverflow: 'ellipsis', overflow: 'hidden', fontSize: '0.75rem' }}>
                            {formattedName}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={0.5}>
                          {perms.read && (
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                onPreview && onPreview(file.serverFileName, file.fileName);
                              }}
                              sx={{ color: 'primary.main', p: 0.5 }}
                              title="Preview Document"
                            >
                              <IconEye size={16} />
                            </IconButton>
                          )}
                          {!disabled && perms.delete && (
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                const remaining = filesList.filter((_, idx) => idx !== fIdx);
                                const pathsStr = remaining.map(rem => rem.serverFileName).join(',');
                                setForm(p => ({ ...p, [f.name]: pathsStr }));
                              }}
                              sx={{ color: 'error.main', p: 0.5 }}
                              title="Remove Document"
                            >
                              <IconTrash size={16} />
                            </IconButton>
                          )}
                        </Stack>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </R>
          );
        }

        return (
          <GridContainer columns={{ xs: 1, sm: 2, md: 3 }}>
            <R>
              <BOSFileUpload
                files={filesList}
                onChange={(files) => upload(f.name, files)}
                module={f.module || "HRA_PROFILE"}
                multiple={f.multiple || false}
                maxFiles={f.maxFiles || 1}
                compact={f.compact !== undefined ? f.compact : false}
                hideFileList={true}
                verticalDropzones={true}
                label={f.label}
                disabled={disabled}
                error={!!errors[f.name]}
                helperText={errors[f.name]}
                sx={errorStyle(!!errors[f.name])}
                scan={f.scan}
              />
            </R>
            <R lg={8}>
              <Box sx={{ p: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
                  Uploaded Documents
                </Typography>
                {filesList.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic', mt: 1 }}>
                    No documents uploaded yet.
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 1.5, mt: 1 }}>
                    {filesList.map((file, fIdx) => {
                      const formattedName = formatFileName(file.fileName);
                      return (
                        <Box
                          key={fIdx}
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 1,
                            p: 0.75,
                            px: 1.25,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                            width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.3% - 12px)' },
                            minWidth: 150,
                            boxSizing: 'border-box',
                            flexShrink: 0
                          }}
                        >
                          <Box sx={{ width: 28, height: 28, borderRadius: 1, bgcolor: 'primary.lighter', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <IconFileText size={16} color="#2196f3" />
                          </Box>
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600} noWrap title={file.fileName} sx={{ textOverflow: 'ellipsis', overflow: 'hidden', fontSize: '0.75rem' }}>
                              {formattedName}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={0.5}>
                            {perms.read && (
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPreview && onPreview(file.serverFileName, file.fileName);
                                }}
                                sx={{ color: 'primary.main', p: 0.5 }}
                                title="Preview Document"
                              >
                                <IconEye size={16} />
                              </IconButton>
                            )}
                            {!disabled && perms.delete && (
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const remaining = filesList.filter((_, idx) => idx !== fIdx);
                                  const pathsStr = remaining.map(rem => rem.serverFileName).join(',');
                                  setForm(p => ({ ...p, [f.name]: pathsStr }));
                                }}
                                sx={{ color: 'error.main', p: 0.5 }}
                                title="Remove Document"
                              >
                                <IconTrash size={16} />
                              </IconButton>
                            )}
                          </Stack>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
            </R>
          </GridContainer>
        );
      }

      return (
        <BOSFileUpload
          files={filesList}
          onChange={(files) => upload(f.name, files)}
          module={f.module || "HRA_PROFILE"}
          multiple={f.multiple || false}
          maxFiles={f.maxFiles || 1}
          compact={f.compact !== undefined ? f.compact : false}
          hideFileList={f.hideFileList || false}
          label={f.label}
          disabled={disabled}
          error={!!errors[f.name]}
          helperText={errors[f.name]}
          sx={errorStyle(!!errors[f.name])}
          scan={f.scan}
        />
      );
    } else if (f.autocomplete) {
      const isCustomTypable = customFields[f.name];
      if (isCustomTypable) {
        const hasValue = !!form[f.name];
        const isFldError = !!errors[f.name] || !hasValue;
        const helpText = errors[f.name] || (!hasValue ? "Please type the document name" : "");

        return (
          <BOSTextField
            name={f.name}
            label={f.label}
            value={form[f.name] || ''}
            onChange={h}
            disabled={disabled}
            error={isFldError}
            helperText={helpText}
            sx={errorStyle(isFldError)}
            autoFocus
            InputProps={{
              endAdornment: (
                <IconButton
                  size="small"
                  onClick={() => {
                    setCustomFields(p => ({ ...p, [f.name]: false }));
                    setForm(p => ({ ...p, [f.name]: '' }));
                  }}
                  edge="end"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )
            }}
          />
        );
      }
      return (
        <BOSAutocomplete
          fullWidth
          value={form[f.name] || null}
          onChange={(val) => {
            if (f.typableOnOthers && val === 'OTHERS') {
              setCustomFields(p => ({ ...p, [f.name]: true }));
              setForm((p) => {
                let next = { ...p, [f.name]: '' };
                if (onFormChange) {
                  next = onFormChange(f.name, '', next);
                }
                return next;
              });
            } else {
              setForm((p) => {
                let next = { ...p, [f.name]: val };
                if (onFormChange) {
                  next = onFormChange(f.name, val, next);
                }
                return next;
              });
            }
            if (errors[f.name]) clearErrors(f.name);
          }}
          onInputChange={(e, val) => {
            if (f.freeSolo) {
              setForm((p) => {
                let next = { ...p, [f.name]: val };
                if (onFormChange) {
                  next = onFormChange(f.name, val, next);
                }
                return next;
              });
              if (errors[f.name]) clearErrors(f.name);
            }
          }}
          options={f.options || []}
          freeSolo={f.freeSolo || false}
          label={f.label}
          disabled={disabled}
          error={!!errors[f.name]}
          helperText={errors[f.name]}
          sx={errorStyle(!!errors[f.name])}
        />
      );
    } else if (f.select) {
      return (
        <BOSTextField select name={f.name} label={f.label} value={form[f.name] || ''} onChange={h} disabled={disabled}
          error={!!errors[f.name]} helperText={errors[f.name]} sx={errorStyle(!!errors[f.name])}>
          {f.options.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
        </BOSTextField>
      );
    } else if (f.type === 'date') {
      return (
        <BOSDatePicker
          name={f.name}
          label={f.label}
          value={form[f.name] || ''}
          onChange={h}
          disabled={disabled}
          required={f.required}
          views={f.views}
          disablePast={f.disablePast !== undefined ? f.disablePast : true}
          error={!!errors[f.name]} helperText={errors[f.name]} sx={errorStyle(!!errors[f.name])}
        />
      );
    } else {
      return (
        <BOSTextField name={f.name} label={f.label} value={form[f.name] || ''} onChange={h} type={f.type || 'text'} disabled={disabled} placeholder={f.placeholder}
          error={!!errors[f.name]} helperText={errors[f.name]} sx={errorStyle(!!errors[f.name])} />
      );
    }
  };

  const addBtn = (
    <Button
      variant="contained"
      color="primary"
      size="small"
      startIcon={<IconPlus size={16} />}
      onClick={add}
      sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
    >
      Add
    </Button>
  );

  return (
    <BOSFormSection
      icon={icon || <IconFileText size={20} color={theme.palette.primary.main} />}
      title={title}
      action={addBtn}
    >
      <GridContainer columns={columns}>
        {leftFields.length > 0 || rightFields.length > 0 ? (
          <>
            <R lg={4}>
              <Stack spacing={2.5}>
                {leftFields.map(f => (
                  <Box key={f.name}>
                    {renderField(f)}
                  </Box>
                ))}
              </Stack>
            </R>
            <R lg={8}>
              {rightFields.map(f => (
                <Box key={f.name} sx={{ height: '100%' }}>
                  {renderField(f)}
                </Box>
              ))}
            </R>
          </>
        ) : (
          standardFields.map((f) => (
            <R key={f.name} lg={f.lg || 4}>
              {renderField(f)}
            </R>
          ))
        )}
      </GridContainer>

      {fields.filter(f => f.type === 'file' && f.hideFileList).map(f => {
        const val = form[f.name];
        if (!val) return null;
        const filesList = val.split(',').map(path => {
          const trimmed = path.trim();
          return {
            fileName: trimmed.split('/').pop().split('\\').pop(),
            serverFileName: trimmed
          };
        }).filter(file => file.serverFileName);

        if (filesList.length === 0) return null;

        return (
          <Box key={f.name} sx={{ mt: 2, width: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 1.5, width: '100%' }}>
              {filesList.map((file, fIdx) => {
                const formattedName = formatFileName(file.fileName);
                return (
                  <Box
                    key={fIdx}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 0.75,
                      px: 1.25,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(20% - 12px)' },
                      minWidth: 150,
                      boxSizing: 'border-box',
                      flexShrink: 0
                    }}
                  >
                    <Box sx={{ width: 28, height: 28, borderRadius: 1, bgcolor: 'primary.lighter', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <IconFileText size={16} color="#2196f3" />
                    </Box>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap title={file.fileName} sx={{ textOverflow: 'ellipsis', overflow: 'hidden', fontSize: '0.75rem' }}>
                        {formattedName}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5}>
                      {perms.read && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPreview && onPreview(file.serverFileName, file.fileName);
                          }}
                          sx={{ color: 'primary.main', p: 0.5 }}
                          title="Preview Document"
                        >
                          <IconEye size={16} />
                        </IconButton>
                      )}
                      {!disabled && perms.delete && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            const remaining = filesList.filter((_, idx) => idx !== fIdx);
                            const pathsStr = remaining.map(rem => rem.serverFileName).join(',');
                            setForm(p => ({ ...p, [f.name]: pathsStr }));
                          }}
                          sx={{ color: 'error.main', p: 0.5 }}
                          title="Remove Document"
                        >
                          <IconTrash size={16} />
                        </IconButton>
                      )}
                    </Stack>
                  </Box>
                );
              })}
            </Box>
          </Box>
        );
      })}

      {rows.length > 0 && (
        <BOSDataTable
          id={title ? `EmployeeSubSection_${title.replace(/\s+/g, '_')}` : endpoint}
          columns={tableCols}
          rows={rows}
          onDeleteRow={perms.delete ? handleDeleteClick : undefined}
          sx={{ height: 250 }}
        />
      )}

      <ConfirmDeleteDialog
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeleteTargetRow(null); }}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${title}`}
        message={`Are you sure you want to delete this ${title.toLowerCase()} record?`}
        itemName={deleteTargetRow ? (deleteTargetRow.name || deleteTargetRow.assetName || deleteTargetRow.companyName || deleteTargetRow.education || 'Record') : ''}
      />
    </BOSFormSection>
  );
}

// Dynamic pay components helpers

export const evaluateFormula = (formula, context) => {
  if (!formula || !formula.trim()) return 0;

  const tokens = [];
  const input = formula.trim();
  let i = 0;
  const len = input.length;

  while (i < len) {
    const c = input[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }

    if (i + 1 < len) {
      const sub = input.substring(i, i + 2);
      if (sub === '>=' || sub === '<=' || sub === '==' || sub === '!=') {
        tokens.push({ type: 'SYMBOL', value: sub });
        i += 2;
        continue;
      }
    }

    if (c === '+' || c === '-' || c === '*' || c === '/' || c === '(' || c === ')' || c === ',' || c === '>' || c === '<') {
      tokens.push({ type: 'SYMBOL', value: c });
      i++;
      continue;
    }

    if (/[0-9.]/.test(c)) {
      let sb = '';
      while (i < len && /[0-9.]/.test(input[i])) {
        sb += input[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: parseFloat(sb) });
      continue;
    }

    if (/[a-zA-Z_]/.test(c)) {
      let sb = '';
      while (i < len && /[a-zA-Z0-9_]/.test(input[i])) {
        sb += input[i];
        i++;
      }
      tokens.push({ type: 'IDENTIFIER', value: sb });
      continue;
    }

    throw new Error(`Unexpected character ${c} at index ${i}`);
  }

  let pos = 0;
  const peek = () => (pos < tokens.length ? tokens[pos] : null);
  const consume = () => {
    if (pos < tokens.length) return tokens[pos++];
    throw new Error('Unexpected end of formula');
  };
  const matchSymbol = (val) => {
    const t = consume();
    if (t.type !== 'SYMBOL' || t.value !== val) {
      throw new Error(`Expected symbol ${val} but got ${JSON.stringify(t)}`);
    }
  };

  const parseExpression = () => parseComparison();

  const parseComparison = () => {
    let val = parseAdditive();
    const next = peek();
    if (next && next.type === 'SYMBOL' && ['>', '<', '>=', '<=', '==', '!='].includes(next.value)) {
      const op = consume().value;
      const right = parseAdditive();
      switch (op) {
        case '>': return val > right ? 1 : 0;
        case '<': return val < right ? 1 : 0;
        case '>=': return val >= right ? 1 : 0;
        case '<=': return val <= right ? 1 : 0;
        case '==': return Math.abs(val - right) < 0.000001 ? 1 : 0;
        case '!=': return Math.abs(val - right) >= 0.000001 ? 1 : 0;
      }
    }
    return val;
  };

  const parseAdditive = () => {
    let val = parseMultiplicative();
    while (true) {
      const next = peek();
      if (next && next.type === 'SYMBOL' && ['+', '-'].includes(next.value)) {
        const op = consume().value;
        const right = parseMultiplicative();
        if (op === '+') val += right;
        else val -= right;
      } else {
        break;
      }
    }
    return val;
  };

  const parseMultiplicative = () => {
    let val = parseUnary();
    while (true) {
      const next = peek();
      if (next && next.type === 'SYMBOL' && ['*', '/'].includes(next.value)) {
        const op = consume().value;
        const right = parseUnary();
        if (op === '*') val *= right;
        else {
          if (Math.abs(right) < 0.000001) throw new Error('Division by zero');
          val /= right;
        }
      } else {
        break;
      }
    }
    return val;
  };

  const parseUnary = () => {
    const next = peek();
    if (next && next.type === 'SYMBOL' && next.value === '-') {
      consume();
      return -parseUnary();
    } else if (next && next.type === 'SYMBOL' && next.value === '+') {
      consume();
      return parseUnary();
    }
    return parsePrimary();
  };

  const parsePrimary = () => {
    const t = consume();
    if (t.type === 'NUMBER') return t.value;

    if (t.type === 'SYMBOL' && t.value === '(') {
      const val = parseExpression();
      matchSymbol(')');
      return val;
    }

    if (t.type === 'IDENTIFIER') {
      const next = peek();
      if (next && next.type === 'SYMBOL' && next.value === '(') {
        consume(); // consume '('
        const func = t.value.toUpperCase();
        switch (func) {
          case 'IF': {
            const cond = parseExpression();
            matchSymbol(',');
            const trueVal = parseExpression();
            matchSymbol(',');
            const falseVal = parseExpression();
            matchSymbol(')');
            return Math.abs(cond) >= 0.000001 ? trueVal : falseVal;
          }
          case 'MIN': {
            let minVal = parseExpression();
            while (true) {
              const check = peek();
              if (check && check.type === 'SYMBOL' && check.value === ',') {
                consume();
                minVal = Math.min(minVal, parseExpression());
              } else {
                break;
              }
            }
            matchSymbol(')');
            return minVal;
          }
          case 'MAX': {
            let maxVal = parseExpression();
            while (true) {
              const check = peek();
              if (check && check.type === 'SYMBOL' && check.value === ',') {
                consume();
                maxVal = Math.max(maxVal, parseExpression());
              } else {
                break;
              }
            }
            matchSymbol(')');
            return maxVal;
          }
          case 'SUM': {
            let sumVal = parseExpression();
            while (true) {
              const check = peek();
              if (check && check.type === 'SYMBOL' && check.value === ',') {
                consume();
                sumVal += parseExpression();
              } else {
                break;
              }
            }
            matchSymbol(')');
            return sumVal;
          }
          case 'ROUND': {
            const a = parseExpression();
            let scale = 0;
            const check = peek();
            if (check && check.type === 'SYMBOL' && check.value === ',') {
              consume();
              scale = parseExpression();
            }
            matchSymbol(')');
            const factor = Math.pow(10, scale);
            return Math.round(a * factor) / factor;
          }
          case 'CEIL': {
            const a = parseExpression();
            matchSymbol(')');
            return Math.ceil(a);
          }
          case 'FLOOR': {
            const a = parseExpression();
            matchSymbol(')');
            return Math.floor(a);
          }
          case 'ABS': {
            const a = parseExpression();
            matchSymbol(')');
            return Math.abs(a);
          }
          default:
            throw new Error(`Unknown function name: ${func}`);
        }
      } else {
        const varName = t.value.toUpperCase();
        if (varName in context) {
          return context[varName];
        }
        return 0;
      }
    }

    throw new Error(`Unexpected token: ${JSON.stringify(t)}`);
  };

  try {
    return parseExpression();
  } catch (e) {
    console.error('Error evaluating formula:', formula, e);
    return 0;
  }
};

export const reevaluateComponents = (currentForm, activeComps, modifiedField, overrides) => {
  const nextForm = { ...currentForm };

  activeComps.forEach(c => {
    const fieldName = c.componentCode;
    const calcType = c.calculationType;
    const calcVal = parseFloat(c.calculationValue) || 0;
    const formula = c.formulaExpression;

    if (c.isActive === false) {
      nextForm[fieldName] = "0.00";
      return;
    }

    // Toggle-based disablement check using both code and display name
    const compCode = (fieldName || '').toUpperCase();
    const compName = (c.displayName || c.componentName || '').toUpperCase();

    const isPF = compCode.includes('PF') || compName.includes('PF') || compName.includes('PROVIDENT');
    const isESI = compCode.includes('ESI') || compName.includes('ESI');
    const isPT = compCode.includes('PT') || compCode.includes('PROF_TAX') || compCode.includes('PROFESSIONAL_TAX') || compName.includes('PTAX') || compName.includes('PROFESSIONAL TAX') || compName.includes('PROF. TAX');
    const isLTA = compCode.includes('LTA') || compName.includes('LTA') || compName.includes('LEAVE TRAVEL');
    const isLOM = compCode.includes('LOM') || compCode.includes('LOSS_OF_MINUTES') || compName.includes('LOM') || compName.includes('LOSS OF MINUTES') || compName.includes('LABOUR WELFARE');
    const isPerm = compCode.includes('PERMISSION') || compCode.includes('PERM') || compName.includes('PERMISSION');

    const isPFEnabled = nextForm.providentFund === true || String(nextForm.providentFund) === '1' || String(nextForm.providentFund).toUpperCase() === 'YES';
    const isESIEnabled = nextForm.esiAllowed === true || String(nextForm.esiAllowed) === '1' || String(nextForm.esiAllowed).toUpperCase() === 'YES';
    const isPTaxEnabled = nextForm.professionalTax === true || String(nextForm.professionalTax) === '1' || String(nextForm.professionalTax).toUpperCase() === 'YES';
    const isLTAEnabled = nextForm.ltaEligible === true || String(nextForm.ltaEligible) === '1' || String(nextForm.ltaEligible).toLowerCase() === 'true';
    const isLOMEnabled = nextForm.lossOfMinutesDeduct === true || String(nextForm.lossOfMinutesDeduct) === '1' || String(nextForm.lossOfMinutesDeduct).toLowerCase() === 'true';
    const isPermEnabled = nextForm.permissionRequest === true || String(nextForm.permissionRequest) === '1' || String(nextForm.permissionRequest).toLowerCase() === 'true';

    if (isPF && !isPFEnabled) {
      nextForm[fieldName] = "0.00";
      return;
    }
    if (isESI && !isESIEnabled) {
      nextForm[fieldName] = "0.00";
      return;
    }
    if (isPT && !isPTaxEnabled) {
      nextForm[fieldName] = "0.00";
      return;
    }
    if (isLTA && !isLTAEnabled) {
      nextForm[fieldName] = "0.00";
      return;
    }
    if (isLOM && !isLOMEnabled) {
      nextForm[fieldName] = "0.00";
      return;
    }
    if (isPerm && !isPermEnabled) {
      nextForm[fieldName] = "0.00";
      return;
    }

    // If the field is overridden manually and is not the field currently modified to clear it, we preserve the user value
    if (overrides && overrides.has(fieldName) && modifiedField !== 'BASIC' && fieldName !== modifiedField) {
      return;
    }

    const ctx = {};
    activeComps.forEach(other => {
      ctx[other.componentCode.toUpperCase()] = parseFloat(nextForm[other.componentCode]) || 0;
    });

    let value = 0;
    if (calcType === 'FIXED') {
      value = calcVal;
    } else if (calcType === 'PERCENTAGE') {
      let base = 0;
      const baseFormula = formula && formula.trim() ? formula.trim() : 'BASIC';
      if (baseFormula.startsWith('[') || baseFormula.startsWith('{')) {
        try {
          const parsed = JSON.parse(baseFormula);
          const targetComponents = parsed.baseComponent ? parsed.baseComponent : parsed;
          if (Array.isArray(targetComponents)) {
            targetComponents.forEach(item => {
              if (item) {
                base += ctx[String(item).toUpperCase()] || 0;
              }
            });
          } else if (typeof targetComponents === 'string') {
            base += ctx[targetComponents.toUpperCase()] || 0;
          } else if (targetComponents && typeof targetComponents === 'object') {
            Object.keys(targetComponents).forEach(key => {
              if (targetComponents[key]) {
                base += ctx[key.toUpperCase()] || 0;
              }
            });
          }
        } catch (e) {
          console.error("Failed to parse percentage base formula as JSON:", baseFormula, e);
          base = ctx['BASIC'] || 0;
        }
      } else {
        base = evaluateFormula(baseFormula, ctx);
      }
      value = (base * calcVal) / 100;
    } else if (calcType === 'FORMULA') {
      if (formula && formula.trim()) {
        value = evaluateFormula(formula, ctx);
      }
    } else if (calcType === 'MANUAL' || calcType === 'DAILY_RATE') {
      if (nextForm[fieldName] !== undefined && nextForm[fieldName] !== null && nextForm[fieldName] !== '') {
        value = parseFloat(nextForm[fieldName]) || 0;
      } else {
        value = calcVal;
      }
    }

    if (fieldName === modifiedField) {
      // Do nothing, keep exact user typed string to avoid issues typing decimals
    } else {
      nextForm[fieldName] = value.toFixed(2);
    }
  });

  return nextForm;
};

function PayComponentSection({ employeeId, activeCompsList, setActiveCompsList, onFormChange, registerSave, parentForm, activeTab }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [form, setForm] = useState({});
  const [loaded, setLoaded] = useState(!employeeId);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [initialForm, setInitialForm] = useState({});
  const hasInitializedRef = useRef(false);

  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [activeEmployees, setActiveEmployees] = useState([]);
  const [designationLevels, setDesignationLevels] = useState([]);
  const [selectedCopyEmp, setSelectedCopyEmp] = useState(null);
  const [currentEmpDetails, setCurrentEmpDetails] = useState(null);
  const [isJobProfileSaved, setIsJobProfileSaved] = useState(true);

  useEffect(() => {
    hasInitializedRef.current = false;
  }, [employeeId]);

  useEffect(() => {
    if (activeCompsList && activeCompsList.length > 0 && !hasInitializedRef.current) {
      setForm(prev => {
        const next = { ...prev };
        activeCompsList.forEach(c => {
          if (c.amount !== undefined && c.amount !== null) {
            next[c.componentCode] = String(c.amount);
          }
        });
        return next;
      });
      setInitialForm(prev => {
        const next = { ...prev };
        activeCompsList.forEach(c => {
          if (c.amount !== undefined && c.amount !== null) {
            next[c.componentCode] = String(c.amount);
          }
        });
        return next;
      });
      hasInitializedRef.current = true;
    }
  }, [activeCompsList]);

  const handleOpenHistory = async () => {
    if (!employeeId) {
      snack(dispatch, 'Save employee master details first.', 'warning');
      return;
    }
    try {
      const { data } = await axios.get(`${API}/${employeeId}/salary-history`);
      const logs = Array.isArray(data) ? data : [];
      const filteredLogs = logs.filter(log => {
        const match = activeCompsList.find(c => (c.componentCode || '').trim().toUpperCase() === (log.componentCode || '').trim().toUpperCase());
        if (match) {
          return match.showInRegister === true || String(match.showInRegister) === 'true' || match.showInRegister === 1 || String(match.showInRegister) === '1' || match.showInRegister === undefined;
        }
        return true;
      });
      setHistoryData(filteredLogs);
      setHistoryOpen(true);
    } catch (err) {
      console.error("Failed to load salary history logs", err);
      snack(dispatch, 'Failed to fetch salary logs.', 'error');
    }
  };

  const h = (e) => {
    const { name, value } = e.target;
    setForm((p) => {
      let next = { ...p, [name]: value };
      if (onFormChange) {
        next = onFormChange(name, value, next);
      }
      return next;
    });
  };

  const disabled = !employeeId;

  const handleAutoCalculate = async () => {
    try {
      // 1. Fetch employee details
      const { data: emp } = await axios.get(`${API}/${employeeId}`);
      const empLevelId = parentForm?.empLevelId || emp?.empLevelId;

      if (!empLevelId) {
        snack(dispatch, 'Designation Level not configured for this employee.', 'warning');
        return;
      }

      // 2. Fetch designation levels
      const { data: levels } = await axios.get('/api/master/hr/designation-levels');
      const matchedLevel = levels.find(l => String(l.rowId || l.id) === String(empLevelId));

      if (!matchedLevel) {
        snack(dispatch, `Designation Level details not found.`, 'warning');
        return;
      }

      const levelStr = matchedLevel.level || String(matchedLevel.rowId || matchedLevel.id);

      // 3. Build next form state
      const nextForm = { ...form };

      activeCompsList.forEach(c => {
        const code = c.componentCode;
        if (c.calculationType === 'MANUAL') {
          if (code === 'BASIC') {
            nextForm['BASIC'] = String(matchedLevel.basic || 0);
          } else if (code === 'HRA') {
            nextForm['HRA'] = String(matchedLevel.hra || 0);
          } else if (code === 'DA') {
            nextForm['DA'] = String(matchedLevel.da || 0);
          }
        }
      });

      // 4. Run re-evaluation to compute formulas (HRA, DA, etc. if they are formulas)
      const reevaluated = reevaluateComponents(nextForm, activeCompsList, 'BASIC', new Set());

      if (setActiveCompsList) {
        const nextActiveComps = activeCompsList.filter(c => {
          if (c.isActive === false) {
            const val = parseFloat(reevaluated[c.componentCode]) || 0;
            return val !== 0;
          }
          return true;
        });
        setActiveCompsList(nextActiveComps);
      }

      setForm(reevaluated);
      snack(dispatch, `Salary structure auto-calculated successfully based on Level ${levelStr}!`);
    } catch (error) {
      console.error("Error in auto calculation:", error);
      snack(dispatch, `Failed to auto-calculate: ${error.message}`, 'error');
    }
  };

  const handleOpenCopyDialog = async () => {
    try {
      let empDetails = currentEmpDetails;
      if (!empDetails) {
        const { data } = await axios.get(`${API}/${employeeId}`);
        empDetails = data;
        setCurrentEmpDetails(data);
      }

      const { data: emps } = await axios.get('/api/master/hr/employees/filter/active-with-salary');
      const otherEmps = emps.filter(e => String(e.id) !== String(employeeId));
      setActiveEmployees(otherEmps);

      const { data: levels } = await axios.get('/api/master/hr/designation-levels');
      setDesignationLevels(levels);

      setCopyDialogOpen(true);
    } catch (err) {
      console.error("Failed to load details for Copy Salary", err);
      snack(dispatch, "Failed to load employee list.", "error");
    }
  };

  const currentEmpLevelId = parentForm?.empLevelId || currentEmpDetails?.empLevelId;
  const currentEmpTypeId = parentForm?.employeeTypeId || currentEmpDetails?.employeeTypeId;

  const matchedLevel = designationLevels.find(l => String(l.rowId || l.id) === String(currentEmpLevelId));
  const levelName = matchedLevel ? (matchedLevel.level || String(matchedLevel.rowId || matchedLevel.id)) : '';

  const getEmployeeGroup = (option) => {
    const isSameType = String(option.employeeTypeId || '') === String(currentEmpTypeId || '');
    const isSameLevel = String(option.empLevelId || '') === String(currentEmpLevelId || '');

    if (isSameType && isSameLevel) {
      return `Suggested Employees (Level ${levelName || 'Same'})`;
    } else if (isSameType) {
      return 'Other Employees (Same Type)';
    } else {
      return 'Other Employees';
    }
  };

  const sortedEmployees = [...activeEmployees].sort((a, b) => {
    const groupA = getEmployeeGroup(a);
    const groupB = getEmployeeGroup(b);

    const order = {
      [`Suggested Employees (Level ${levelName || 'Same'})`]: 1,
      'Other Employees (Same Type)': 2,
      'Other Employees': 3
    };

    const valA = order[groupA] || 4;
    const valB = order[groupB] || 4;

    if (valA !== valB) return valA - valB;
    return (a.employeeName || '').localeCompare(b.employeeName || '');
  });

  const handleCopySalary = async () => {
    if (!selectedCopyEmp) {
      snack(dispatch, "Please select an employee to copy from.", "warning");
      return;
    }
    try {
      const { data } = await axios.get(`${API}/${selectedCopyEmp.id}/job-profile`);
      if (!data || !data.id) {
        snack(dispatch, "No job profile / salary details configured for the selected employee.", "warning");
        return;
      }

      const nextForm = { ...form };
      if (data.basicSalary !== undefined) nextForm.BASIC = String(data.basicSalary || 0);
      if (data.da !== undefined) nextForm.DA = String(data.da || 0);
      if (data.hra !== undefined) nextForm.HRA = String(data.hra || 0);
      if (data.grossSalary !== undefined) nextForm.GROSS = String(data.grossSalary || 0);
      if (data.pfEmployee !== undefined) nextForm.PF_EMP = String(data.pfEmployee || 0);
      if (data.esiEmployee !== undefined) nextForm.ESI_EMP = String(data.esiEmployee || 0);
      if (data.professionalTaxAmount !== undefined) nextForm.PT = String(data.professionalTaxAmount || 0);
      if (data.netSalary !== undefined) nextForm.NET_SALARY = String(data.netSalary || 0);
      if (data.specialAllowance !== undefined) nextForm.SPECIAL_ALLOWANCE = String(data.specialAllowance || 0);

      if (data.dynamicComponents) {
        try {
          const parsed = JSON.parse(data.dynamicComponents);
          Object.assign(nextForm, parsed);
        } catch (e) {
          console.error("Failed to parse dynamicComponents JSON", e);
        }
      }

      const reevaluated = reevaluateComponents(nextForm, activeCompsList, 'BASIC', new Set());

      if (setActiveCompsList) {
        const nextActiveComps = activeCompsList.filter(c => {
          if (c.isActive === false) {
            const val = parseFloat(reevaluated[c.componentCode]) || 0;
            return val !== 0;
          }
          return true;
        });
        setActiveCompsList(nextActiveComps);
      }

      setForm(reevaluated);
      setCopyDialogOpen(false);
      setSelectedCopyEmp(null);
      snack(dispatch, `Salary structure copied successfully from ${selectedCopyEmp.employeeName}! Please verify and save.`);
    } catch (err) {
      console.error("Error copying salary:", err);
      snack(dispatch, "Failed to copy salary details: " + err.message, "error");
    }
  };

  const onFormChangeRef = useRef(onFormChange);
  useEffect(() => {
    onFormChangeRef.current = onFormChange;
  }, [onFormChange]);

  const fetchJobProfile = useCallback(() => {
    if (!employeeId) { setLoaded(true); return; }
    axios.get(`${API}/${employeeId}/job-profile`)
      .then(({ data }) => {
        if (data && data.id) {
          setIsJobProfileSaved(true);
          let cleaned = { ...data };

          if (cleaned.basicSalary) cleaned.BASIC = cleaned.basicSalary;
          if (cleaned.da) cleaned.DA = cleaned.da;
          if (cleaned.hra) cleaned.HRA = cleaned.hra;
          if (cleaned.grossSalary) cleaned.GROSS = cleaned.grossSalary;
          if (cleaned.pfEmployee) cleaned.PF_EMP = cleaned.pfEmployee;
          if (cleaned.esiEmployee) cleaned.ESI_EMP = cleaned.esiEmployee;
          if (cleaned.professionalTaxAmount) cleaned.PT = cleaned.professionalTaxAmount;
          if (cleaned.netSalary) cleaned.NET_SALARY = cleaned.netSalary;
          if (cleaned.specialAllowance) cleaned.SPECIAL_ALLOWANCE = cleaned.specialAllowance;

          if (cleaned.dynamicComponents) {
            try {
              const parsed = JSON.parse(cleaned.dynamicComponents);
              Object.assign(cleaned, parsed);
            } catch (e) {
              console.error("Failed to parse dynamicComponents JSON", e);
            }
          }

          if (onFormChangeRef.current) {
            cleaned = onFormChangeRef.current(null, null, cleaned);
          }
          setForm(cleaned);
          setInitialForm(cleaned);
        } else {
          setIsJobProfileSaved(false);
          snack(dispatch, 'Job Details / Job Profile must be saved before setting up the Salary Structure.', 'error');
        }
        setLoaded(true);
      })
      .catch(() => {
        setIsJobProfileSaved(false);
        snack(dispatch, 'Job Details / Job Profile must be saved before setting up the Salary Structure.', 'error');
        setLoaded(true);
      });
  }, [employeeId]);

  useEffect(() => {
    fetchJobProfile();
  }, [fetchJobProfile, activeTab]);

  useRealtimeRefresh((force, detail) => {
    fetchJobProfile();
  }, 'EmployeeJobProfile');

  const save = async (isOverall = false) => {
    if (!employeeId) {
      snack(dispatch, 'Save Main Employee Details First', 'error');
      return;
    }
    if (!isJobProfileSaved) {
      snack(dispatch, 'Please save Job Details / Job Profile first before saving the Salary Structure.', 'error');
      return;
    }

    // Validate Bank Details if entered
    if (form.salaryAccountNumber || form.accountName || form.branchName || form.ifscCode) {
      if (!form.salaryAccountNumber) { snack(dispatch, 'Account No is mandatory.', 'error'); return; }
      if (!form.accountName) { snack(dispatch, 'Account Name is mandatory.', 'error'); return; }
      if (!form.branchName) { snack(dispatch, 'Branch Name is mandatory.', 'error'); return; }
      if (!form.ifscCode) { snack(dispatch, 'IFSC Code is mandatory.', 'error'); return; }
    }

    // Check if there are any changes in the salary components or job profile
    let hasChanges = false;
    activeCompsList.forEach(c => {
      const code = c.componentCode;
      const initialVal = initialForm[code] !== undefined && initialForm[code] !== null ? String(initialForm[code]) : '';
      const currentVal = form[code] !== undefined && form[code] !== null ? String(form[code]) : '';
      if (parseFloat(initialVal || 0).toFixed(2) !== parseFloat(currentVal || 0).toFixed(2)) {
        hasChanges = true;
      }
    });

    STANDARD_JOB_PROFILE_KEYS.forEach(key => {
      if (key === 'id' || key === 'employeeId' || key === 'createdBy' || key === 'createdDate' || key === 'updatedBy' || key === 'updatedDate') return;
      const initialVal = initialForm[key] !== undefined && initialForm[key] !== null ? String(initialForm[key]) : '';
      const currentVal = form[key] !== undefined && form[key] !== null ? String(form[key]) : '';
      if (initialVal !== currentVal) {
        hasChanges = true;
      }
    });

    if (!hasChanges) {
      snack(dispatch, 'No changes detected in the salary components or job details.', 'warning');
      return;
    }

    let payload = {};
    if (form.id) payload.id = form.id;
    if (form.employeeId) payload.employeeId = form.employeeId;

    // Copy standard job profile fields
    STANDARD_JOB_PROFILE_KEYS.forEach(key => {
      if (form[key] !== undefined) {
        payload[key] = form[key];
      }
    });

    // Copy salary components
    activeCompsList.forEach(c => {
      if (c.componentCode && form[c.componentCode] !== undefined) {
        payload[c.componentCode] = form[c.componentCode];
      }
    });

    // Clean up empty string properties to null to prevent deserialization errors on the backend
    Object.keys(payload).forEach(key => {
      if (payload[key] === '') {
        payload[key] = null;
      }
    });

    const dynamicComps = {};
    Object.keys(payload).forEach(key => {
      if (!STANDARD_JOB_PROFILE_KEYS.has(key)) {
        dynamicComps[key] = payload[key];
        delete payload[key];
      }
    });
    payload.dynamicComponents = JSON.stringify(dynamicComps);

    try {
      const { data } = await axios.post(`${API}/${employeeId}/job-profile`, payload);
      let cleaned = { ...data };
      if (cleaned.basicSalary) cleaned.BASIC = cleaned.basicSalary;
      if (cleaned.da) cleaned.DA = cleaned.da;
      if (cleaned.hra) cleaned.HRA = cleaned.hra;
      if (cleaned.grossSalary) cleaned.GROSS = cleaned.grossSalary;
      if (cleaned.pfEmployee) cleaned.PF_EMP = cleaned.pfEmployee;
      if (cleaned.esiEmployee) cleaned.ESI_EMP = cleaned.esiEmployee;
      if (cleaned.professionalTaxAmount) cleaned.PT = cleaned.professionalTaxAmount;
      if (cleaned.netSalary) cleaned.NET_SALARY = cleaned.netSalary;
      if (cleaned.specialAllowance) cleaned.SPECIAL_ALLOWANCE = cleaned.specialAllowance;

      if (cleaned.dynamicComponents) {
        try {
          const parsed = JSON.parse(cleaned.dynamicComponents);
          Object.assign(cleaned, parsed);
        } catch (e) {
          console.error("Failed to parse dynamicComponents JSON on save response", e);
        }
      }
      if (onFormChangeRef.current) {
        cleaned = onFormChangeRef.current(null, null, cleaned);
      }
      setForm(cleaned);
      setInitialForm(cleaned);
      if (!isOverall) {
        snack(dispatch, `Pay Components saved successfully!`);
      }
    }
    catch (err) {
      if (isOverall) throw err;
      snack(dispatch, `Failed to save Pay Components. Please try again.`, 'error');
    }
  };

  useEffect(() => {
    if (registerSave) {
      return registerSave("Pay Component", save);
    }
  }, [registerSave, save]);

  if (!loaded) return null;

  const isPFEnabled = form.providentFund === true || String(form.providentFund) === '1' || String(form.providentFund).toUpperCase() === 'YES';
  const isESIEnabled = form.esiAllowed === true || String(form.esiAllowed) === '1' || String(form.esiAllowed).toUpperCase() === 'YES';
  const isPTaxEnabled = form.professionalTax === true || String(form.professionalTax) === '1' || String(form.professionalTax).toUpperCase() === 'YES';
  const isLTAEnabled = form.ltaEligible === true || String(form.ltaEligible) === '1' || String(form.ltaEligible).toLowerCase() === 'true';
  const isLOMEnabled = form.lossOfMinutesDeduct === true || String(form.lossOfMinutesDeduct) === '1' || String(form.lossOfMinutesDeduct).toLowerCase() === 'true';
  const isPermEnabled = form.permissionRequest === true || String(form.permissionRequest) === '1' || String(form.permissionRequest).toLowerCase() === 'true';

  const filterEnabled = (c) => {
    const compCode = (c.componentCode || '').toUpperCase();
    const compName = (c.displayName || c.componentName || '').toUpperCase();

    const isPF = compCode.includes('PF') || compName.includes('PF') || compName.includes('PROVIDENT');
    const isESI = compCode.includes('ESI') || compName.includes('ESI');
    const isPT = compCode.includes('PT') || compCode.includes('PROF_TAX') || compCode.includes('PROFESSIONAL_TAX') || compName.includes('PTAX') || compName.includes('PROFESSIONAL TAX') || compName.includes('PROF. TAX');
    const isLTA = compCode.includes('LTA') || compName.includes('LTA') || compName.includes('LEAVE TRAVEL');
    const isLOM = compCode.includes('LOM') || compCode.includes('LOSS_OF_MINUTES') || compName.includes('LOM') || compName.includes('LOSS OF MINUTES') || compName.includes('LABOUR WELFARE');
    const isPerm = compCode.includes('PERMISSION') || compCode.includes('PERM') || compName.includes('PERMISSION');

    if (isPF && !isPFEnabled) return false;
    if (isESI && !isESIEnabled) return false;
    if (isPT && !isPTaxEnabled) return false;
    if (isLTA && !isLTAEnabled) return false;
    if (isLOM && !isLOMEnabled) return false;
    if (isPerm && !isPermEnabled) return false;
    return true;
  };

  const earnings = activeCompsList.filter(c => c.componentType === 'EARNING' && c.componentCode !== 'GROSS' && c.componentCode !== 'NET_SALARY' && (c.showInRegister === true || String(c.showInRegister) === 'true' || c.showInRegister === 1 || String(c.showInRegister) === '1') && filterEnabled(c));
  const deductions = activeCompsList.filter(c => c.componentType === 'DEDUCTION' && (c.showInRegister === true || String(c.showInRegister) === 'true' || c.showInRegister === 1 || String(c.showInRegister) === '1') && filterEnabled(c));
  const contributions = activeCompsList.filter(c => c.componentType === 'EMPLOYER_CONTRIBUTION' && (c.showInRegister === true || String(c.showInRegister) === 'true' || c.showInRegister === 1 || String(c.showInRegister) === '1') && filterEnabled(c));

  const grossVal = earnings.filter(c => c.calculationType !== 'DAILY_RATE').reduce((sum, c) => sum + (parseFloat(form[c.componentCode]) || 0), 0);
  const deductionsVal = deductions.filter(c => c.calculationType !== 'DAILY_RATE').reduce((sum, c) => sum + (parseFloat(form[c.componentCode]) || 0), 0);
  const contributionsVal = contributions.filter(c => c.calculationType !== 'DAILY_RATE').reduce((sum, c) => sum + (parseFloat(form[c.componentCode]) || 0), 0);
  const netVal = grossVal - deductionsVal;
  const ctcVal = grossVal + deductionsVal + contributionsVal;

  const renderTable = (components, type) => {
    const isEarning = type === 'earning';
    return (
      <TableContainer component={Box} sx={{ bgcolor: 'transparent', border: 'none', boxShadow: 'none' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { borderBottom: `2px solid ${theme.palette.divider}`, bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50' } }}>
              <TableCell sx={{ fontWeight: 800, py: 1.8, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'text.secondary' }}>Component</TableCell>
              <TableCell sx={{ fontWeight: 800, py: 1.8, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'text.secondary', width: 110 }}>Basis</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, py: 1.8, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'text.secondary', width: 160, pr: 2.5 }}>Amount</TableCell>
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
              components.map((c) => {
                const name = c.componentCode;
                const isFldDisabled = disabled || c.calculationType === 'FORMULA' || c.calculationType === 'PERCENTAGE';
                const placeholder = c.calculationType === 'FORMULA' ? `Formula: ${c.formulaExpression}` :
                  c.calculationType === 'PERCENTAGE' ? `Pct: ${c.calculationValue}%` :
                    c.calculationType === 'FIXED' ? `Fixed: ${c.calculationValue}` :
                      c.calculationType === 'DAILY_RATE' ? `Rate: ${c.calculationValue}` :
                        '0.00';

                return (
                  <TableRow
                    key={name}
                    sx={{
                      transition: 'background-color 0.2s',
                      '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)' },
                      '& td': { borderBottom: `1px solid ${theme.palette.divider}` }
                    }}
                  >
                    <TableCell sx={{ py: 1.5 }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          {c.displayName || c.componentName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Tooltip
                        title={
                          c.calculationType === 'MANUAL' ? 'Manual Entry: Enter value manually' :
                            c.calculationType === 'FORMULA' ? `Formula: ${c.formulaExpression}` :
                              c.calculationType === 'PERCENTAGE' ? (() => {
                                const f = c.formulaExpression;
                                if (f && f.trim()) {
                                  if (f.startsWith('[') || f.startsWith('{')) {
                                    try {
                                      const parsed = JSON.parse(f);
                                      let limitText = '';
                                      if (parsed.limitType && parsed.limitType !== 'NONE') {
                                        const lt = parsed.limitType;
                                        const lv = parsed.limitValue;
                                        const formattedLimit = (() => {
                                          if (lv) {
                                            if (lv.startsWith('[') || lv.startsWith('{')) {
                                              try {
                                                const parsedLv = JSON.parse(lv);
                                                if (Array.isArray(parsedLv)) return parsedLv.filter(Boolean).join(' + ');
                                              } catch (e) { }
                                            }
                                            return String(lv).replace(/\+/g, ' + ');
                                          }
                                          return '';
                                        })();
                                        limitText = ` (Limit: ${lt === 'FIXED' ? '₹' : ''}${formattedLimit})`;
                                      }
                                      const targetComponents = parsed.baseComponent ? parsed.baseComponent : parsed;
                                      if (Array.isArray(targetComponents)) {
                                        return `${c.calculationValue}% of ${targetComponents.filter(Boolean).join(' + ')}${limitText}`;
                                      } else if (typeof targetComponents === 'string') {
                                        return `${c.calculationValue}% of ${targetComponents.replace(/\+/g, ' + ')}${limitText}`;
                                      } else if (targetComponents && typeof targetComponents === 'object') {
                                        const keys = Object.keys(targetComponents).filter(k => targetComponents[k]);
                                        return `${c.calculationValue}% of ${keys.join(' + ')}${limitText}`;
                                      }
                                    } catch (e) { }
                                  }
                                  return `${c.calculationValue}% of ${f}`;
                                }
                                return `${c.calculationValue}% of Basic`;
                              })() :
                                c.calculationType === 'FIXED' ? `Fixed: ${c.calculationValue}` :
                                  c.calculationType === 'DAILY_RATE' ? `Based on Attendance: ₹${c.calculationValue} / day` :
                                    (c.calculationType || '').toLowerCase().replace('_', ' ')
                        }
                        arrow
                        placement="top"
                      >
                        <Chip
                          label={c.calculationType === 'DAILY_RATE' ? 'Based on Attendance' : c.calculationType}
                          size="small"
                          sx={{
                            fontWeight: 750,
                            fontSize: '0.65rem',
                            borderRadius: '6px',
                            height: 20,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            bgcolor:
                              c.calculationType === 'MANUAL' ? 'rgba(33, 150, 243, 0.08)' :
                                c.calculationType === 'FORMULA' ? 'rgba(156, 39, 176, 0.08)' :
                                  c.calculationType === 'PERCENTAGE' ? 'rgba(255, 152, 0, 0.08)' :
                                    'rgba(76, 175, 80, 0.08)',
                            color:
                              c.calculationType === 'MANUAL' ? 'info.main' :
                                c.calculationType === 'FORMULA' ? 'secondary.main' :
                                  c.calculationType === 'PERCENTAGE' ? 'warning.main' :
                                    'success.main',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.5, pr: 1.5 }}>
                      <InputBase
                        type="number"
                        name={name}
                        value={form[name] !== undefined && form[name] !== null && form[name] !== '' ? form[name] : (['DAILY_RATE', 'FIXED'].includes(c.calculationType) ? (c.calculationValue || '') : '')}
                        onChange={h}
                        disabled={isFldDisabled}
                        placeholder={placeholder}
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
            {type === 'earning' && (
              <TableRow sx={{
                borderTop: `2px double ${theme.palette.divider}`,
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(90deg, rgba(76, 175, 80, 0.15) 0%, rgba(76, 175, 80, 0.05) 100%)'
                  : 'linear-gradient(90deg, rgba(76, 175, 80, 0.08) 0%, rgba(76, 175, 80, 0.02) 100%)'
              }}>
                <TableCell colSpan={2} sx={{ py: 2, pl: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 805, color: 'success.dark', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Total Gross Salary
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ py: 2, pr: 2.5 }}>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: 'success.main', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                    {grossVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {type === 'deduction' && (
              <TableRow sx={{
                borderTop: `2px double ${theme.palette.divider}`,
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)'
                  : 'linear-gradient(90deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.02) 100%)'
              }}>
                <TableCell colSpan={2} sx={{ py: 2, pl: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 805, color: 'error.dark', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Total Deductions
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ py: 2, pr: 2.5 }}>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: 'error.main', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                    {deductionsVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {type === 'contribution' && (
              <TableRow sx={{
                borderTop: `2px double ${theme.palette.divider}`,
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(90deg, rgba(156, 39, 176, 0.15) 0%, rgba(156, 39, 176, 0.05) 100%)'
                  : 'linear-gradient(90deg, rgba(156, 39, 176, 0.08) 0%, rgba(156, 39, 176, 0.02) 100%)'
              }}>
                <TableCell colSpan={2} sx={{ py: 2, pl: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 805, color: 'secondary.dark', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Total Contributions
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ py: 2, pr: 2.5 }}>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: 'secondary.main', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                    {contributionsVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  if (!isJobProfileSaved) {
    return (
      <BOSFormSection title="Pay Component Details">
        <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, textAlign: 'center' }}>
          <IconAlertTriangle size={48} color={theme.palette.error.main} style={{ marginBottom: 16 }} />
          <Typography variant="h3" sx={{ mb: 1, fontWeight: 700 }}>
            Job Details Not Saved
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 450 }}>
            You must fill and save the <strong>Job Details</strong> tab first before you can set up or view the employee's Salary Structure.
          </Typography>
        </Box>
      </BOSFormSection>
    );
  }

  return (
    <BOSFormSection
      icon={<IconReceipt2 size={20} color={theme.palette.primary.main} />}
      title="Pay Component Details"
      action={
        <Stack direction="row" spacing={1.5} alignItems="center">
          {employeeId && (
            <Tooltip title="Salary Component Change Audit History">
              <IconButton
                color="secondary"
                onClick={handleOpenHistory}
                sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '8px', p: 0.75 }}
              >
                <IconHistory size={18} />
              </IconButton>
            </Tooltip>
          )}
          <Button
            variant="outlined"
            color="primary"
            onClick={handleOpenCopyDialog}
            size="small"
            startIcon={<IconCopy size={16} />}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
          >
            Copy Salary
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAutoCalculate}
            size="small"
            startIcon={<IconRefresh size={16} />}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
          >
            Auto Calculate
          </Button>
        </Stack>
      }
    >
      <Paper sx={{
        p: 3,
        borderRadius: '16px',
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.02)',
        bgcolor: theme.palette.mode === 'dark' ? 'background.default' : '#ffffff'
      }}>
        <Grid container spacing={4} wrap="nowrap" sx={{ overflowX: 'auto', '&::-webkit-scrollbar': { height: '8px' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.1)', borderRadius: '4px' } }}>
          {/* Earnings Column */}
          <Grid item xs={4} sx={{ minWidth: 280, flex: 1 }}>
            <Typography variant="subtitle1" sx={{ color: 'success.main', fontWeight: 800, textTransform: 'uppercase', mb: 2, display: 'flex', alignItems: 'center', gap: 1, letterSpacing: '0.5px' }}>
              <IconTrendingUp size={20} color={theme.palette.success.main} />
              Earnings
            </Typography>
            {renderTable(earnings, 'earning')}
          </Grid>

          <Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />

          {/* Deductions Column */}
          <Grid item xs={4} sx={{ minWidth: 280, flex: 1 }}>
            <Typography variant="subtitle1" sx={{ color: 'error.main', fontWeight: 800, textTransform: 'uppercase', mb: 2, display: 'flex', alignItems: 'center', gap: 1, letterSpacing: '0.5px' }}>
              <IconTrendingDown size={20} color={theme.palette.error.main} />
              Deductions
            </Typography>
            {renderTable(deductions, 'deduction')}
          </Grid>

          <Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />

          {/* Contributions Column */}
          <Grid item xs={4} sx={{ minWidth: 280, flex: 1 }}>
            <Typography variant="subtitle1" sx={{ color: 'secondary.main', fontWeight: 800, textTransform: 'uppercase', mb: 2, display: 'flex', alignItems: 'center', gap: 1, letterSpacing: '0.5px' }}>
              <IconUsers size={20} color={theme.palette.secondary.main} />
              Contributions
            </Typography>
            {renderTable(contributions, 'contribution')}
          </Grid>
        </Grid>
      </Paper>

      {/* Real-time Salary Summary Panel */}
      <Box sx={{
        mt: 3,
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
            ₹{grossVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />

        {/* Deductions */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>
            Total Deductions
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 800, color: 'error.main', mt: 0.5 }}>
            ₹{deductionsVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />

        {/* Net Salary */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>
            Net Salary (Payable)
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main', mt: 0.5 }}>
            ₹{netVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />

        {/* CTC */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>
            CTC (Cost to Company)
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 900, color: 'secondary.main', mt: 0.5 }}>
            ₹{ctcVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          variant="contained"
          startIcon={<IconDeviceFloppy size={18} />}
          onClick={() => save(false)}
          sx={btnSave}
        >
          Save
        </Button>
      </Box>

      <Dialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: 1,
            boxShadow: theme.palette.mode === 'dark' ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.08)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Salary Component Audit History
          <IconButton onClick={() => setHistoryOpen(false)} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2 }}>
          {historyData.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                No salary changes logged yet.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px', border: `1px solid ${theme.palette.divider}` }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Date & Time</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Changed By</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Component</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Old Amount</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>New Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historyData.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(log.createdDate)}</TableCell>
                      <TableCell>{log.createdBy || 'System'}</TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {log.componentCode}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {log.componentName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.actionType}
                          size="small"
                          color={
                            log.actionType === 'INSERT' ? 'success' :
                              log.actionType === 'UPDATE' ? 'warning' :
                                'error'
                          }
                          variant="filled"
                          sx={{ fontWeight: 700, borderRadius: '6px', fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        ₹{(log.oldAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: log.actionType === 'DELETE' ? 'error.main' : 'primary.main' }}>
                        ₹{(log.newAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setHistoryOpen(false)} variant="outlined" sx={{ borderRadius: '8px' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Copy Salary Dialog */}
      <Dialog
        open={copyDialogOpen}
        onClose={() => setCopyDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: 1,
            boxShadow: theme.palette.mode === 'dark' ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.08)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Copy Salary Details
          <IconButton onClick={() => setCopyDialogOpen(false)} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 3 }}>
          <Stack spacing={3}>
            <Typography variant="body2" color="text.secondary">
              Select an active employee to copy their salary details. The copied values will populate in the form. Please verify and save the changes.
            </Typography>
            <Autocomplete
              options={sortedEmployees}
              groupBy={getEmployeeGroup}
              getOptionLabel={(option) => {
                const level = designationLevels.find(l => String(l.rowId || l.id) === String(option.empLevelId));
                const lvlStr = level ? (level.level || String(level.rowId || level.id)) : 'No Level';
                const code = option.oldEmpCode || option.empCode || 'No Code';
                return `${option.employeeName} - ${code} (${lvlStr})`;
              }}
              value={selectedCopyEmp}
              onChange={(event, newValue) => setSelectedCopyEmp(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Select Employee" variant="outlined" placeholder="Search by name or code..." fullWidth />
              )}
              slotProps={{
                paper: {
                  sx: {
                    '& .MuiAutocomplete-groupLabel': {
                      fontWeight: 800,
                      color: theme.palette.primary.main,
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.15)' : 'rgba(33, 150, 243, 0.08)',
                      fontSize: '0.85rem',
                      py: 1,
                      px: 2,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      position: 'static'
                    }
                  }
                }
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setCopyDialogOpen(false)} variant="outlined" sx={{ borderRadius: '8px' }}>
            Cancel
          </Button>
          <Button onClick={handleCopySalary} variant="contained" color="primary" sx={{ borderRadius: '8px' }}>
            Copy Details
          </Button>
        </DialogActions>
      </Dialog>
    </BOSFormSection>
  );
}

const EmployeeSubSections = forwardRef(({ employeeId, activeTab, onPreview, parentForm, onWagesTypeChange }, ref) => {
  const dispatch = useDispatch();
  const perms = usePagePermissions('M2210');
  const [payFields, setPayFields] = useState([]);
  const [activeCompsList, setActiveCompsList] = useState([]);
  const [wagesType, setWagesType] = useState('MONTHLY');
  const [visitedTabs, setVisitedTabs] = useState({ [activeTab]: true });

  // State for multiple document expansion (row-specific by stable DB row id)
  const [expandedDocRow, setExpandedDocRow] = useState(null); // { type: 'education' | 'experience', id: number }

  useEffect(() => {
    setVisitedTabs((prev) => prev[activeTab] ? prev : { ...prev, [activeTab]: true });
  }, [activeTab]);

  const overridesRef = useRef(new Set());

  const handlePayComponentChange = useCallback((name, value, nextForm) => {
    if (!name) return nextForm; // preserve database overrides on load
    if (name === 'BASIC') {
      overridesRef.current.clear();
    } else {
      overridesRef.current.add(name);
    }
    return reevaluateComponents(nextForm, activeCompsList, name, overridesRef.current);
  }, [activeCompsList]);

  const postalTimerRef = useRef(null);

  const onContactFormChange = useCallback((name, value, nextForm, setFormFn) => {
    if (name === 'pincode') {
      const cleanPin = String(value || '').trim();
      if ((!cleanPin || cleanPin.length < 3) && setFormFn) {
        setFormFn(prev => ({ ...prev, city: '', state: '', country: '' }));
      } else if (cleanPin.length >= 3 && setFormFn) {
        if (postalTimerRef.current) clearTimeout(postalTimerRef.current);
        postalTimerRef.current = setTimeout(() => {
          lookupPostalCode(cleanPin, nextForm?.country || '')
            .then(res => {
              if (res && res.success) {
                setFormFn(prev => ({
                  ...prev,
                  city: res.city,
                  state: res.state,
                  country: res.country
                }));
                snack(dispatch, `Location resolved: ${res.city}, ${res.state} (${res.country})`, 'success');
              } else {
                setFormFn(prev => ({
                  ...prev,
                  city: '',
                  state: '',
                  country: ''
                }));
              }
            })
            .catch(err => {
              console.error("Error fetching pincode data:", err);
            });
        }, 350);
      }
    }
    return nextForm;
  }, [dispatch]);

  const onWagesFormChange = useCallback((name, value, nextForm) => {
    if (name === 'wagesType') {
      const newWagesType = nextForm.wagesType || 'MONTHLY';
      if (newWagesType !== wagesType) {
        setWagesType(newWagesType);
        if (onWagesTypeChange) {
          onWagesTypeChange(newWagesType);
        }
      }
    }
    return nextForm;
  }, [onWagesTypeChange, wagesType]);

  const onSalarySettingsFormChange = useCallback((name, value, nextForm) => {
    if (wagesType === 'HOURLY') {
      nextForm.overTimeAllowed = 'NO';
      nextForm.overTimeFactorial = '';
      nextForm.overTimeRatePerHour = '';
    }
    return nextForm;
  }, [wagesType]);

  const loadPayrollComponents = useCallback(() => {
    const url = employeeId ? `/api/master/hr/employees/${employeeId}/payroll-components` : '/api/payroll/components';
    axios.get(url)
      .then(({ data }) => {
        if (Array.isArray(data)) {
          const activeComps = employeeId
            ? data.sort((a, b) => (a.sequenceNo || 0) - (b.sequenceNo || 0))
            : data.filter(c => c.isActive !== false).sort((a, b) => (a.sequenceNo || 0) - (b.sequenceNo || 0));

          setActiveCompsList(activeComps);

          const earningsFields = [];
          const deductionsFields = [];

          activeComps.forEach(c => {
            const name = c.componentCode;
            const fieldObj = {
              name,
              label: c.displayName || c.componentName,
              type: 'number',
              disabled: c.calculationType !== 'MANUAL',
              placeholder: c.calculationType === 'FORMULA' ? `Formula: ${c.formulaExpression}` :
                c.calculationType === 'PERCENTAGE' ? `Pct: ${c.calculationValue}%` :
                  c.calculationType === 'FIXED' ? `Fixed: ${c.calculationValue}` :
                    'Enter value'
            };

            if (c.componentType === 'DEDUCTION') {
              deductionsFields.push(fieldObj);
            } else {
              earningsFields.push(fieldObj);
            }
          });

          const finalFields = [];
          if (earningsFields.length > 0) {
            finalFields.push({ type: 'subheader', label: 'Earnings' });
            finalFields.push(...earningsFields);
          }
          if (deductionsFields.length > 0) {
            finalFields.push({ type: 'subheader', label: 'Deductions' });
            finalFields.push(...deductionsFields);
          }

          if (finalFields.length > 0) {
            setPayFields(finalFields);
          }
        }
      })
      .catch(err => {
        console.error('Failed to fetch payroll components, using default layout.', err);
      });
  }, [employeeId]);

  useEffect(() => {
    loadPayrollComponents();
  }, [loadPayrollComponents]);

  useRealtimeRefresh(() => {
    loadPayrollComponents();
  });

  const saveRegistry = useRef({});
  const registerSave = useCallback((name, saveFn) => {
    saveRegistry.current[name] = saveFn;
    return () => {
      delete saveRegistry.current[name];
    };
  }, []);

  useImperativeHandle(ref, () => ({
    saveAll: async () => {
      let targetKeys = [];
      if (activeTab === 1) {
        targetKeys = ['Personal Details', 'ID Details', 'Statutory Details'];
      } else if (activeTab === 2) {
        targetKeys = ['Address Details'];
      } else if (activeTab === 3) {
        targetKeys = ['Job Details', 'Salary Settings'];
      } else if (activeTab === 4) {
        targetKeys = ['Pay Component'];
      } else if (activeTab === 9) {
        targetKeys = ['Self Assessment'];
      }

      const saveFns = [];
      targetKeys.forEach(key => {
        if (saveRegistry.current[key]) {
          saveFns.push(saveRegistry.current[key]);
        }
      });

      if (saveFns.length === 0) {
        return;
      }

      // Run section saves sequentially to avoid transaction rollback-only / concurrency conflicts on the backend
      for (const fn of saveFns) {
        await fn(true);
      }
    }
  }));
  const theme = useTheme();
  const pc = theme.palette.primary.main;
  const sc = theme.palette.secondary.main;
  const wc = theme.palette.warning.main;

  return (
    <Stack spacing={3}>
      {!employeeId && (
        <Box sx={{ p: 2.5, bgcolor: 'warning.light', borderRadius: 2, border: '1px dashed', borderColor: 'warning.main', mb: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <IconAlertTriangle color={theme.palette.warning.dark} size={28} />
            <Box>
              <Typography variant="h4" color="warning.dark" sx={{ fontWeight: 700 }}>Save Main Employee Details First</Typography>
              <Typography variant="body2" color="warning.dark">Auxiliary sections (Personal, Address, Bank, etc.) will be enabled after you click the "Save" button in the Employee INFO tab.</Typography>
            </Box>
          </Stack>
        </Box>
      )}
      {/* Tab 1: Personal Details, ID Details, Statutory Details, Bank Details, Family Details, Self Assessment */}
      <Box sx={{ display: activeTab === 1 ? 'block' : 'none' }}>
        {visitedTabs[1] && (
          <Stack spacing={3}>
          {/* 5. PERSONAL DETAILS */}
          <Section1to1 registerSave={registerSave} title="Personal Details" icon={<IconHeart size={20} color={pc} />} endpoint="personal" employeeId={employeeId} onPreview={onPreview} fields={[
            { name: 'gender', label: 'Gender', select: true, options: ['MALE', 'FEMALE', 'OTHER'] },
            { name: 'maritalStatus', label: 'Marital Status', select: true, options: ['UNMARRIED', 'MARRIED', 'DIVORCED', 'WIDOWED'] },
            { name: 'marriageDate', label: 'Married Date', type: 'date', disabled: (f) => f.maritalStatus !== 'MARRIED', required: true, disablePast: false },
            { name: 'birthDate', label: 'DOB', type: 'date', disablePast: false },
            { name: 'nationality', label: 'Nationality', max: 100 },
            { name: 'personalEmail', label: 'Email', max: 255 },
            { name: 'bloodGroup', label: 'Blood group', select: true, options: ['O+ve', 'O-ve', 'A+ve', 'A-ve', 'B+ve', 'B-ve', 'AB+ve', 'AB-ve'] },
            { name: 'region', label: 'Region', max: 100 },
            { name: 'shirtSize', label: 'Shirt Size', select: true, options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] },
            { name: 'pantSize', label: 'Pant Size', max: 20 },
            { name: 'shoeSize', label: 'Shoe Size', max: 20 },
            { name: 'weight', label: 'Weight', type: 'number' },
            { name: 'height', label: 'Height', type: 'height' }
          ]} />

          {/* 7. ID DETAILS */}
          <Section1to1
            registerSave={registerSave}
            title="ID Details"
            icon={<IconEPassport size={20} color={pc} />}
            endpoint="personal"
            employeeId={employeeId}
            validation={(form) => {
              if (!form.aadharNumber) {
                snack(dispatch, 'Aadhar No is mandatory.', 'error');
                return false;
              }
              if (!/^\d{12}$/.test(form.aadharNumber)) {
                snack(dispatch, 'Aadhar No must be exactly 12 digits.', 'error');
                return false;
              }
              return true;
            }}
            fields={[
              { name: 'aadharNumber', label: 'Aadhar No *', max: 12, required: true },
              { name: 'drivingLicenseNumber', label: 'Driving License No', max: 50 },
              { name: 'passportNumber', label: 'Passport No', max: 50 },
              { name: 'passportIssueCity', label: 'Place Of Issue', max: 100 },
              { name: 'licenseExpiryDate', label: 'Date Of Expiry', type: 'date', disablePast: false },
              { name: 'loanInstallmentAmount', label: 'Loan Installment Amount', type: 'number' }
            ]} />

          {/* 8. STATUTORY DETAILS */}
          <Section1to1 registerSave={registerSave} title="Statutory Details" icon={<IconShieldCheck size={20} color={pc} />} endpoint="personal" employeeId={employeeId} fields={[
            { name: 'panNumber', label: 'PAN No', max: 20 },
            { name: 'pfNumber', label: 'PF No', max: 100 },
            { name: 'uanNumber', label: 'UAN No', max: 100 },
            { name: 'esicNumber', label: 'ESI No', max: 100 }
          ]} />



          {/* 14. FAMILY DETAILS */}
          <Section1toN title="Family Details" icon={<IconUsers size={20} color={pc} />} endpoint="dependent" employeeId={employeeId}
            transformRow={(row) => {
              if (row.dob) {
                const birthDate = new Date(row.dob);
                if (!isNaN(birthDate.getTime())) {
                  const today = new Date();
                  let age = today.getFullYear() - birthDate.getFullYear();
                  const m = today.getMonth() - birthDate.getMonth();
                  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                  }
                  return { ...row, age: age >= 0 ? age : 0 };
                }
              }
              return row;
            }}
            onFormChange={(name, value, next) => {
              if (name === 'dob') {
                if (value) {
                  const birthDate = new Date(value);
                  if (!isNaN(birthDate.getTime())) {
                    const today = new Date();
                    let age = today.getFullYear() - birthDate.getFullYear();
                    const m = today.getMonth() - birthDate.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                      age--;
                    }
                    next.age = age >= 0 ? age : 0;
                  }
                } else {
                  next.age = '';
                }
              }
              return next;
            }}
            validation={(f) => {
              if (!f.name) {
                snack(dispatch, 'Name is mandatory.', 'error');
                return false;
              }
              if (!f.relationship) {
                snack(dispatch, 'Relationship is mandatory.', 'error');
                return false;
              }
              if (!f.contactNo) {
                snack(dispatch, 'Contact No is mandatory.', 'error');
                return false;
              }
              return true;
            }}
            fields={[
              { name: 'name', label: 'Name *', max: 100 },
              { name: 'gender', label: 'Gender', select: true, options: ['MALE', 'FEMALE', 'TRANS'] },
              { name: 'relationship', label: 'Relationship *', select: true, options: ['FATHER', 'MOTHER', 'SPOUSE', 'CHILD', 'SIBLING', 'GUARDIAN'] },
              { name: 'dob', label: 'DOB', type: 'date', disablePast: false },
              { name: 'age', label: 'Age', type: 'number', disabled: false },
              { name: 'occupation', label: 'Occupation', max: 100 },
              { name: 'bloodGroup', label: 'Blood Group', select: true, options: ['O+ve', 'O-ve', 'A+ve', 'A-ve', 'B+ve', 'B-ve', 'AB+ve', 'AB-ve'] },
              { name: 'contactNo', label: 'Contact No *', type: 'phone', max: 20 }
            ]}
            tableCols={[
              { id: 'name', label: 'Name', minWidth: 150 },
              { id: 'gender', label: 'Gender', minWidth: 100 },
              { id: 'relationship', label: 'Relation', minWidth: 100 },
              { id: 'dob', label: 'DOB', minWidth: 110 },
              { id: 'age', label: 'Age', minWidth: 80 },
              { id: 'occupation', label: 'Occupation', minWidth: 120 },
              { id: 'bloodGroup', label: 'Blood Group', minWidth: 110 },
              { id: 'contactNo', label: 'Contact', minWidth: 140 }
            ]}
          />
        </Stack>
        )}
      </Box>

      {/* Tab 9: Self Assessment */}
      <Box sx={{ display: activeTab === 9 ? 'block' : 'none' }}>
        {visitedTabs[9] && (
          <Stack spacing={3}>
          <Section1to1 registerSave={registerSave} title="Self Assessment" icon={<IconActivity size={20} color={pc} />} endpoint="self-assessment" employeeId={employeeId} fields={[
            { type: 'subheader', label: '1. Personal Details' },
            { name: 'q1_native', label: '1. Native Place', max: 255, lg: 12 },
            { name: 'q4_fatherOccupation', label: "2. Father's Occupation", max: 255, lg: 12 },
            { name: 'q5_motherOccupation', label: "3. Mother's Occupation", max: 255, lg: 12 },
            { name: 'q7_spouseOccupation', label: "4. Spouse's Occupation", max: 255, lg: 12 },
            { name: 'q8_children', label: '5. No. of Children', max: 255, lg: 12 },
            { name: 'q9_hasRelativesInCompany', label: '6. Relatives in Company', select: true, options: ['YES', 'NO'], lg: 12 },
            { name: 'q10_relativesDetails', label: '7. Relatives Details', lg: 12 },
            { name: 'q11_siblingsOccupations', label: '8. Siblings Occupations', lg: 12 },

            { type: 'subheader', label: '2. Preferences & Assets' },
            { name: 'q12_hasTwoWheeler', label: '9. Have Two Wheeler?', select: true, options: ['YES', 'NO'], lg: 12 },
            { name: 'q13_hasAndroidPhone', label: '10. Have Android Mobile?', select: true, options: ['YES', 'NO'], lg: 12 },
            { name: 'q14_knowsCarDriving', label: '11. Know Car Driving?', select: true, options: ['YES', 'NO'], lg: 12 },
            { name: 'q15_willingToTravel', label: '12. Willing to Travel?', select: true, options: ['YES', 'NO'], lg: 12 },
            { name: 'q16_covidVaccination', label: '13. Covid Vaccination Details', select: true, options: ['1st DOSE', '2nd DOSE', 'BOOSTER', 'NOT DONE'], lg: 12 },

            { type: 'subheader', label: '3. Goals & Suggestions' },
            { name: 'q17_positivePoints', label: '14. Positive Points (Strengths)', lg: 12 },
            { name: 'q18_negativePoints', label: '15. Negative Points (Weaknesses)', lg: 12 },
            { name: 'q19_lifeGoals', label: '16. Life Goals (1 & 3 Years)', lg: 12 },
            { name: 'q20_improvementSuggestions', label: '17. Suggestions for Company', lg: 12 },

            { type: 'subheader', label: '4. Experience & Salary Details' },
            { name: 'q21_isExperienced', label: '18. Are you Experienced?', select: true, options: ['YES', 'NO'], lg: 12 },
            { name: 'q22_totalExperience', label: '19. Total Experience (Years/Months)', max: 50, lg: 12 },
            { name: 'q23_coreExperience', label: '20. Core Experience details', max: 50, lg: 12 },
            { name: 'q24_prevNetSalary', label: '21. Previous Net Salary', max: 50, lg: 12 },
            { name: 'q25_prevGrossSalary', label: '22. Previous Gross Salary', max: 50, lg: 12 },
            { name: 'q26_expectedNetSalary', label: '23. Expected Net Salary', max: 50, lg: 12 },
            { name: 'q27_expectedGrossSalary', label: '24. Expected Gross Salary', max: 50, lg: 12 },
            { name: 'q28_pfHigherPension', label: '25. PF Higher Pension Contribution?', select: true, options: ['YES', 'NO'], lg: 12 },
            { name: 'q29_pfDeductionAmount', label: '26. PF Deduction Amount', max: 50, lg: 12 },
            { name: 'q30_alternativeDepartment', label: '27. Alternative Department Choice', max: 100, lg: 12 },

            { type: 'subheader', label: '5. Work Environment & References' },
            { name: 'q31_prevLocation', label: '28. Previous Work Location', max: 255, lg: 12 },
            { name: 'q32_prevShift', label: '29. Previous Shift details', max: 50, lg: 12 },
            { name: 'q33_reasonForLeaving', label: '30. Reason for Leaving', lg: 12 },
            { name: 'q34_noticePeriod', label: '31. Notice Period', max: 50, lg: 12 },
            { name: 'q35_prevDeptPosition', label: '32. Previous Dept & Position', max: 255, lg: 12 },
            { name: 'q36_prevDeptCount', label: '33. Previous Dept Team Count', max: 50, lg: 12 },
            { name: 'q41_manager1Email', label: '35. Manager 1 Email', max: 255, lg: 12 },
            { name: 'q42_manager2Email', label: '36. Manager 2 Email', max: 255, lg: 12 },
            { name: 'q38_handleMistake', label: '37. How do you handle a mistake?', lg: 12 },
            { name: 'q39_handleOpinionDifference', label: '38. How do you handle opinion differences?', lg: 12 },
            { name: 'q40_computerSelfRating', label: '39. Computer Knowledge self-rating', select: true, options: ['EXCELLENT', 'VERY GOOD', 'GOOD', 'AVERAGE', 'POOR'], lg: 12 },
            { name: 'payslipPath', label: 'Payslip Upload', type: 'file', lg: 12, scan: true }
          ]} />
        </Stack>
        )}
      </Box>

      {/* Tab 2: Contact Details */}
      <Box sx={{ display: activeTab === 2 ? 'block' : 'none' }}>
        {visitedTabs[2] && (
          <Section1to1 registerSave={registerSave} title="Address Details" icon={<IconMapPin size={20} color={pc} />} endpoint="contact" employeeId={employeeId} onFormChange={onContactFormChange} fields={[
            { name: 'mobile', label: 'Mobile No *', type: 'phone', max: 20, required: true },
            { name: 'alternateMobile', label: 'Alternate Mobile No', type: 'phone', max: 20 },
            { name: 'address', label: 'Permanent Address (Communication Address) *', max: 500, multiline: true, rows: 2, lg: 12, required: true },
            { name: 'city', label: 'City *', max: 100, required: true },
            { name: 'state', label: 'State *', max: 100, required: true },
            { name: 'country', label: 'Country *', max: 100, required: true },
            { name: 'pincode', label: 'Pincode *', max: 20, required: true }
          ]} />
        )}
      </Box>

      {/* Tab 3: Job Details */}
      <Box sx={{ display: activeTab === 3 ? 'block' : 'none' }}>
        {visitedTabs[3] && (
          <Stack spacing={3}>
          <Section1to1
            registerSave={registerSave}
            title="Job Details"
            icon={<IconBriefcase size={20} color={pc} />}
            endpoint="job-profile"
            employeeId={employeeId}
            onFormChange={onWagesFormChange}
            validation={(form) => {
              if (form.wagesType === 'DAILY') {
                if (!form.dailyRate || !String(form.dailyRate).trim()) {
                  return 'Daily Amount is required for DAILY wages type';
                }
              }
              if (form.wagesType === 'HOURLY') {
                if (!form.hourlyRate || !String(form.hourlyRate).trim()) {
                  return 'Per Hour Rate is required for HOURLY wages type';
                }
              }
              if (form.paymentMode === 'BANK') {
                if (!form.salaryAccountNumber || !String(form.salaryAccountNumber).trim()) {
                  return 'Salary Account No is required for BANK payment mode';
                }
                if (!form.accountName || !String(form.accountName).trim()) {
                  return 'Account Name is required for BANK payment mode';
                }
                if (!form.bankName || !String(form.bankName).trim()) {
                  return 'Bank Name is required for BANK payment mode';
                }
                if (!form.bankAccountType || !String(form.bankAccountType).trim()) {
                  return 'Bank Account Type is required for BANK payment mode';
                }
                if (!form.ifscCode || !String(form.ifscCode).trim()) {
                  return 'IFSC Code is required for BANK payment mode';
                }
                if (!form.branchName || !String(form.branchName).trim()) {
                  return 'Branch Name is required for BANK payment mode';
                }
              }
              if (form.officeEmail && String(form.officeEmail).trim() !== '') {
                const emailVal = String(form.officeEmail).trim();
                const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!EMAIL_REGEX.test(emailVal)) {
                  return 'Invalid Office Email format. Please enter a valid email address (e.g. name@domain.com).';
                }
              }
              return true;
            }}
            fields={[
              { name: 'wagesType', label: 'Wages Type *', select: true, options: ['MONTHLY', 'DAILY', 'HOURLY'], required: true },
              { name: 'dailyRate', label: 'Daily Amount *', type: 'number', required: true, hideIf: (form) => form.wagesType !== 'DAILY' },
              { name: 'hourlyRate', label: 'Per Hour Rate *', type: 'number', required: true, hideIf: (form) => form.wagesType !== 'HOURLY' },
              { name: 'paymentMode', label: 'Payment Mode', select: true, options: ['BANK', 'CASH', 'CHEQUE'] },
              { name: 'personalAccountNumber', label: 'Personal Account No', max: 50, hideIf: (form) => form.paymentMode !== 'BANK' },
              { name: 'salaryAccountNumber', label: 'Salary Account No *', max: 50, required: true, hideIf: (form) => form.paymentMode !== 'BANK' },
              { name: 'accountName', label: 'Account Name *', max: 100, required: true, hideIf: (form) => form.paymentMode !== 'BANK' },
              { name: 'bankName', label: 'Bank Name *', max: 100, required: true, hideIf: (form) => form.paymentMode !== 'BANK' },
              { name: 'bankAccountType', label: 'Bank Account Type *', select: true, options: ['SAVINGS', 'CURRENT'], required: true, hideIf: (form) => form.paymentMode !== 'BANK' },
              { name: 'ifscCode', label: 'IFSC Code *', max: 20, required: true, hideIf: (form) => form.paymentMode !== 'BANK' },
              { name: 'branchName', label: 'Branch Name *', max: 100, required: true, hideIf: (form) => form.paymentMode !== 'BANK' },
              { name: 'officeEmail', label: 'Office Email', max: 100 },
              { name: 'officialPassword', label: 'Official Password', type: 'password', max: 100 },
              { name: 'companyContact1', label: 'Official Contact 1', type: 'phone', max: 20 },
              { name: 'companyContact2', label: 'Official Contact 2', type: 'phone', max: 20 }
            ]}
          />

          <Section1to1
            registerSave={registerSave}
            title="Salary Settings"
            icon={<IconShieldCheck size={20} color={pc} />}
            endpoint="job-profile"
            employeeId={employeeId}
            onFormChange={onSalarySettingsFormChange}
            fields={[
              { name: 'providentFund', label: 'Provident Fund (PF)', type: 'switch' },
              { name: 'esiAllowed', label: 'Employee State Insurance (ESI)', type: 'switch' },
              { name: 'professionalTax', label: 'Professional Tax (PTAX)', type: 'switch' },
              { name: 'ltaEligible', label: 'Leave Travel Allowance (LTA)', type: 'switch' },
              { name: 'lossOfMinutesDeduct', label: 'Loss Of Minutes (LOM)', type: 'switch' },
              { name: 'leaveAllowed', label: 'Leave Request Allowed', type: 'switch' },
              { name: 'odAllowed', label: 'OD Request Allowed', type: 'switch' },
              { name: 'permissionRequest', label: 'Permission Request Allowed', type: 'switch' },
              { name: 'overTimeAllowed', label: 'Overtime Allowed', type: 'switch', disabled: (form) => wagesType === 'HOURLY' }
            ]}
          />
        </Stack>
        )}
      </Box>

      {/* Tab 4: Salary Structure */}
      <Box sx={{ display: activeTab === 4 ? 'block' : 'none' }}>
        {visitedTabs[4] && (
          <PayComponentSection employeeId={employeeId} activeCompsList={activeCompsList} setActiveCompsList={setActiveCompsList} onFormChange={handlePayComponentChange} registerSave={registerSave} parentForm={parentForm} activeTab={activeTab} />
        )}
      </Box>



      {/* Tab 4: Education Details */}
      <Box sx={{ display: activeTab === 5 ? 'block' : 'none' }}>
        {visitedTabs[5] && (
          <Section1toN title="Qualification Details" icon={<IconSchool size={20} color={pc} />} endpoint="education" employeeId={employeeId}
            fields={[
              { name: 'education', label: 'Qualification *', select: true, options: ['10th / SSLC', '12th / HSC', 'DIPLOMA', 'UG', 'PG', 'ITI', 'OTHERS'], required: true },
              { name: 'institutionName', label: 'Institution *', max: 255, required: true },
              { name: 'university', label: 'University *', max: 255, required: true },
              { name: 'type', label: 'Type *', select: true, options: ['FULL TIME', 'PART TIME', 'CORRESPONDENCE'], required: true },
              { name: 'yearOfPassing', label: 'Year Of Passing *', type: 'date', views: ['year'], disablePast: false, required: true, pattern: /^\d{4}$/, patternMessage: "Year of Passing must be a 4-digit year (e.g. 2024)" },
              { name: 'percentageGrade', label: 'Percentage/CGPA *', max: 20, required: true },
              { name: 'certificateFile', label: 'Certificate Upload *', type: 'file', required: true, module: 'HRA_EDUCATION', multiple: true, maxFiles: 5, lg: 12, compact: true, splitLayout: true }
            ]}
            tableCols={[
              { id: 'education', label: 'Education', minWidth: 160 },
              { id: 'institutionName', label: 'Institution Name', minWidth: 200 },
              { id: 'university', label: 'University', minWidth: 150 },
              { id: 'type', label: 'Type', minWidth: 120 },
              { id: 'yearOfPassing', label: 'Year of Passing', minWidth: 120 },
              { id: 'percentageGrade', label: '% / Grade', minWidth: 100 },
              {
                id: 'certificateFile',
                label: 'Documents',
                minWidth: 280,
                renderCell: (params) => {
                  const val = params?.value;
                  const row = params?.row;
                  const filesList = getFileListFromRow({ serverFileName: val });
                  if (filesList.length === 0) {
                    return (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        -
                      </Typography>
                    );
                  }
                  const isExpanded = expandedDocRow?.type === 'education' && expandedDocRow?.id === row.id;
                  const visibleFiles = isExpanded ? filesList : filesList.slice(0, 2);
                  const hasMore = filesList.length > 2;
                  return (
                    <ClickAwayListener onClickAway={() => {
                      if (isExpanded) {
                        setExpandedDocRow(null);
                      }
                    }}>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.75,
                          maxHeight: isExpanded ? 180 : 'auto',
                          overflowY: isExpanded ? 'auto' : 'visible',
                          pr: 0.5,
                          width: 250
                        }}
                      >
                        {visibleFiles.map((file, fIdx) => (
                          <Box
                            key={fIdx}
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 1.5,
                              p: 0.75,
                              borderRadius: 1.5,
                              border: '1px solid',
                              borderColor: 'divider',
                              bgcolor: 'background.paper',
                              width: 250,
                              boxSizing: 'border-box'
                            }}
                          >
                            <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: 'primary.lighter', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <IconFileText size={18} color="#2196f3" />
                            </Box>
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={600} noWrap title={file.fileName} sx={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                {file.fileName}
                              </Typography>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Chip label="Saved" size="small" color="success" variant="outlined" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 700 }} />
                              </Stack>
                            </Box>
                            {perms.read && (
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPreview && onPreview(file.serverFileName, file.fileName);
                                }}
                                sx={{ color: 'primary.main', bgcolor: 'rgba(33, 150, 243, 0.08)', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}
                                title="Preview Document"
                              >
                                <IconEye size={16} />
                              </IconButton>
                            )}
                          </Box>
                        ))}
                        {hasMore && !isExpanded && (
                          <Button
                            variant="text"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedDocRow({ type: 'education', id: row.id });
                            }}
                            sx={{
                              alignSelf: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              textTransform: 'none',
                              py: 0.25,
                              color: 'primary.main',
                              '&:hover': { bgcolor: 'rgba(33, 150, 243, 0.04)' }
                            }}
                          >
                            View more +
                          </Button>
                        )}
                      </Box>
                    </ClickAwayListener>
                  );
                }
              }
            ]}
          />
        )}
      </Box>

      {/* Tab 5: Experience Details */}
      <Box sx={{ display: activeTab === 6 ? 'block' : 'none' }}>
        {visitedTabs[6] && (
          <Stack spacing={3}>
          {/* 13. WORK EXPERIENCE */}
          <Section1toN title="Work Experience" icon={<IconBriefcase size={20} color={pc} />} endpoint="experience" employeeId={employeeId}
            transformRow={(row) => ({ ...row, designation: row.location })}
            transformPayload={(f) => ({ ...f, location: f.designation })}
            fields={[
              { name: 'companyName', label: 'Company Name *', max: 255, required: true },
              { name: 'designation', label: 'Designation *', max: 100, required: true },
              { name: 'fromDate', label: 'From Date *', type: 'date', disablePast: false, required: true },
              { name: 'toDate', label: 'To Date *', type: 'date', disablePast: false, required: true },
              { name: 'totalExperienceMonths', label: 'Experience (Months) *', type: 'number', required: true },
              { name: 'lastSalary', label: 'Salary *', type: 'number', required: true },
              { name: 'leavingReason', label: 'Reason For Leaving *', max: 255, required: true },
              { name: 'documents', label: 'Experience Document *', type: 'file', required: true, module: 'HRA_EXPERIENCE', multiple: true, maxFiles: 5, lg: 12, compact: true, splitLayout: true }
            ]}
            tableCols={[
              { id: 'companyName', label: 'Company Name', minWidth: 200 },
              { id: 'designation', label: 'Designation', minWidth: 150 },
              { id: 'fromDate', label: 'From Date', minWidth: 120 },
              { id: 'toDate', label: 'To Date', minWidth: 120 },
              { id: 'totalExperienceMonths', label: 'Experience (Months)', minWidth: 150 },
              { id: 'lastSalary', label: 'Salary', minWidth: 100 },
              { id: 'leavingReason', label: 'Reason For Leaving', minWidth: 180 },
              {
                id: 'documents',
                label: 'Documents',
                minWidth: 280,
                renderCell: (params) => {
                  const val = params?.value;
                  const row = params?.row;
                  const filesList = getFileListFromRow({ serverFileName: val });
                  if (filesList.length === 0) {
                    return (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        -
                      </Typography>
                    );
                  }
                  const isExpanded = expandedDocRow?.type === 'experience' && expandedDocRow?.id === row.id;
                  const visibleFiles = isExpanded ? filesList : filesList.slice(0, 2);
                  const hasMore = filesList.length > 2;
                  return (
                    <ClickAwayListener onClickAway={() => {
                      if (isExpanded) {
                        setExpandedDocRow(null);
                      }
                    }}>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.75,
                          maxHeight: isExpanded ? 180 : 'auto',
                          overflowY: isExpanded ? 'auto' : 'visible',
                          pr: 0.5,
                          width: 250
                        }}
                      >
                        {visibleFiles.map((file, fIdx) => (
                          <Box
                            key={fIdx}
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 1.5,
                              p: 0.75,
                              borderRadius: 1.5,
                              border: '1px solid',
                              borderColor: 'divider',
                              bgcolor: 'background.paper',
                              width: 250,
                              boxSizing: 'border-box'
                            }}
                          >
                            <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: 'primary.lighter', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <IconFileText size={18} color="#2196f3" />
                            </Box>
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={600} noWrap title={file.fileName} sx={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                {file.fileName}
                              </Typography>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Chip label="Saved" size="small" color="success" variant="outlined" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 700 }} />
                              </Stack>
                            </Box>
                            {perms.read && (
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPreview && onPreview(file.serverFileName, file.fileName);
                                }}
                                sx={{ color: 'primary.main', bgcolor: 'rgba(33, 150, 243, 0.08)', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}
                                title="Preview Document"
                              >
                                <IconEye size={16} />
                              </IconButton>
                            )}
                          </Box>
                        ))}
                        {hasMore && !isExpanded && (
                          <Button
                            variant="text"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedDocRow({ type: 'experience', id: row.id });
                            }}
                            sx={{
                              alignSelf: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              textTransform: 'none',
                              py: 0.25,
                              color: 'primary.main',
                              '&:hover': { bgcolor: 'rgba(33, 150, 243, 0.04)' }
                            }}
                          >
                            View more +
                          </Button>
                        )}
                      </Box>
                    </ClickAwayListener>
                  );
                }
              }
            ]}
          />
        </Stack>
        )}
      </Box>

      {/* Tab 7: KYC Details */}
      <Box sx={{ display: activeTab === 7 ? 'block' : 'none' }}>
        {visitedTabs[7] && (
          <Stack spacing={3}>
          <Section1toN title="KYC Details" icon={<IconShieldCheck size={20} color={pc} />} endpoint="kyc-document" employeeId={employeeId} onPreview={onPreview}
            columns={{ xs: 1, sm: 4, md: 4 }}
            transformPayload={(form) => {
              if (form.attachment && !form.fileName) {
                const trimmed = form.attachment.trim();
                const name = trimmed.substring(Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\')) + 1);
                form.fileName = name;
              }
              return form;
            }}
            fields={[
              { name: 'documentName', label: 'Document Name *', autocomplete: true, freeSolo: false, typableOnOthers: true, options: ['AADHAR CARD', 'PAN CARD', 'VOTER ID', 'PASSPORT', 'DRIVING LICENCE', 'OTHERS'], required: true, lg: 3 },
              { name: 'documentNumber', label: 'Document Number / ID *', max: 100, required: true, lg: 3 },
              { name: 'attachment', label: 'Document Upload *', type: 'file', required: true, module: 'HR_EMPLOYEE_KYC', multiple: true, maxFiles: 5, lg: 6, compact: true, hideFileList: true }
            ]}
            tableCols={[
              { id: 'documentName', label: 'Document Name', minWidth: 160 },
              { id: 'documentNumber', label: 'Document Number / ID', minWidth: 200 },
              {
                id: 'attachment',
                label: 'Document',
                minWidth: 280,
                renderCell: (params) => {
                  const val = params?.value;
                  const row = params?.row;
                  const filesList = getFileListFromRow({ serverFileName: val });
                  if (filesList.length === 0) {
                    return (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        -
                      </Typography>
                    );
                  }
                  const isExpanded = expandedDocRow?.type === 'kyc' && expandedDocRow?.id === row.id;
                  const visibleFiles = isExpanded ? filesList : filesList.slice(0, 2);
                  const hasMore = filesList.length > 2;
                  return (
                    <ClickAwayListener onClickAway={() => {
                      if (isExpanded) {
                        setExpandedDocRow(null);
                      }
                    }}>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.75,
                          maxHeight: isExpanded ? 180 : 'auto',
                          overflowY: isExpanded ? 'auto' : 'visible',
                          pr: 0.5,
                          width: 250
                        }}
                      >
                        {visibleFiles.map((file, fIdx) => (
                          <Box
                            key={fIdx}
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 1.5,
                              p: 0.75,
                              borderRadius: 1.5,
                              border: '1px solid',
                              borderColor: 'divider',
                              bgcolor: 'background.paper',
                              width: 250,
                              boxSizing: 'border-box'
                            }}
                          >
                            <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: 'primary.lighter', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <IconFileText size={18} color="#2196f3" />
                            </Box>
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={600} noWrap title={file.fileName} sx={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                {file.fileName}
                              </Typography>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Chip label="Saved" size="small" color="success" variant="outlined" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 700 }} />
                              </Stack>
                            </Box>
                            {perms.read && (
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPreview && onPreview(file.serverFileName, file.fileName);
                                }}
                                sx={{ color: 'primary.main', bgcolor: 'rgba(33, 150, 243, 0.08)', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}
                                title="Preview Document"
                              >
                                <IconEye size={16} />
                              </IconButton>
                            )}
                          </Box>
                        ))}
                        {hasMore && !isExpanded && (
                          <Button
                            variant="text"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedDocRow({ type: 'kyc', id: row.id });
                            }}
                            sx={{
                              alignSelf: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              textTransform: 'none',
                              py: 0.25,
                              color: 'primary.main',
                              '&:hover': { bgcolor: 'rgba(33, 150, 243, 0.04)' }
                            }}
                          >
                            View more +
                          </Button>
                        )}
                      </Box>
                    </ClickAwayListener>
                  );
                }
              }
            ]}
          />
        </Stack>
        )}
      </Box>

      {/* Tab 10: Office Assets */}
      <Box sx={{ display: activeTab === 10 ? 'block' : 'none' }}>
        {visitedTabs[10] && (
          <Stack spacing={3}>
          <Section1toN title="Office Assets" icon={<IconDevices size={20} color={pc} />} endpoint="asset" employeeId={employeeId}
            fields={[
              { name: 'assetName', label: 'Asset Name *', max: 100, required: true },
              { name: 'issueDate', label: 'Asset Issue Date *', type: 'date', disablePast: false, required: true },
              { name: 'condition', label: 'Condition of Asset *', select: true, options: ['NEW', 'GOOD', 'USED', 'DAMAGED'], required: true },
              { name: 'qty', label: 'QTY *', type: 'number', required: true },
              { name: 'serialNo', label: 'Serial No *', max: 100, required: true },
              { name: 'assetValue', label: 'Asset Value *', type: 'number', required: true }
            ]}
            tableCols={[
              { id: 'assetName', label: 'Asset Name', minWidth: 150 },
              { id: 'issueDate', label: 'Asset Issue Date', minWidth: 100 },
              { id: 'serialNo', label: 'Serial No', minWidth: 150 },
              { id: 'assetValue', label: 'Asset Value', minWidth: 120 }
            ]}
          />
        </Stack>
        )}
      </Box>

    </Stack>
  );
});

export default EmployeeSubSections;