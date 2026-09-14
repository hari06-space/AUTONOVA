import { useState, useEffect } from 'react';
import {
  Box, TextField, Button, MenuItem, FormControlLabel, Switch, Stack,
  InputAdornment, useTheme
} from '@mui/material';
import { IconDeviceFloppy, IconReport, IconCalendarTime, IconShieldCheck, IconClock } from '@tabler/icons-react';
import { BOSFormSection } from 'ui-component/bos';
import axios from 'utils/axios';
import CustomClockPicker from './CustomClockPicker';

const FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY', 'CUSTOM'];
const HOLIDAY_STRATEGIES = ['NEXT', 'PREVIOUS', 'SKIP'];
const REPEAT_UNITS = ['DAYS', 'WEEKS', 'MONTHS'];
const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const MONTHS = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];
const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));

// Convert "10:00 AM" or "10:00 PM" to "10:00" or "22:00"
const convertTo24Hour = (time12h) => {
  if (!time12h) return '09:00';
  const parts = time12h.split(' ');
  const time = parts[0];
  const modifier = parts[1] || 'AM';
  let [hours, minutes] = time.split(':');
  if (hours === '12') {
    hours = '00';
  }
  if (modifier === 'PM') {
    hours = parseInt(hours, 10) + 12;
  }
  return `${String(hours).padStart(2, '0')}:${minutes}`;
};

// Convert "10:00" or "22:00" to "10:00 AM" or "10:00 PM"
const convertTo12Hour = (time24h) => {
  if (!time24h) return '09:00 AM';
  let [hours, minutes] = time24h.split(':');
  let h = parseInt(hours, 10);
  const modifier = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12; // the hour '0' should be '12'
  return `${String(h).padStart(2, '0')}:${minutes} ${modifier}`;
};

export default function AuditConfigEditor({ config, onSave, onCancel, formId = 'audit-config-form', hideActions = false }) {
  const theme = useTheme();
  
  const [startTimeAnchorEl, setStartTimeAnchorEl] = useState(null);
  const [endTimeAnchorEl, setEndTimeAnchorEl] = useState(null);

  const [formData, setFormData] = useState({
    configCode: '',
    configName: '',
    auditTypeId: '',
    departmentId: '',
    auditAreaId: '',
    frequency: 'DAILY',
    repeatEveryValue: 1,
    repeatEveryUnit: 'DAYS',
    weekDays: '',
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    status: true,
    criteriaMinCount: 1,
    holidayStrategy: 'NEXT',
    leaveValidation: true,
    duplicateCheck: true
  });

  const [auditTypes, setAuditTypes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [auditAreas, setAuditAreas] = useState([]);

  useEffect(() => {
    if (config) {
      setFormData({
        ...config,
        leaveValidation: true,
        duplicateCheck: true,
        auditTypeId: config.auditTypeId || '',
        departmentId: config.departmentId || '',
        auditAreaId: config.auditAreaId || ''
      });
    }
  }, [config]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [atRes, deptRes, areaRes] = await Promise.all([
          axios.get('/api/master/qms/audit-type'),
          axios.get('/api/master/hr/departments'),
          axios.get('/api/master/qms/audit-area')
        ]);
        setAuditTypes(atRes.data || []);
        setDepartments(deptRes.data || []);
        setAuditAreas(areaRes.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'frequency') {
      let defaultWeekDays = '';
      if (value === 'WEEKLY') defaultWeekDays = 'MONDAY';
      else if (['MONTHLY', 'QUARTERLY', 'HALF_YEARLY'].includes(value)) defaultWeekDays = '1';
      else if (value === 'YEARLY') defaultWeekDays = 'JANUARY 1';

      setFormData((prev) => ({
        ...prev,
        frequency: value,
        weekDays: defaultWeekDays
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const getYearlyParts = () => {
    if (!formData.weekDays) return { month: 'JANUARY', day: '1' };
    const parts = String(formData.weekDays).trim().split(/\s+/);
    if (parts.length >= 2) {
      return { month: parts[0], day: parts[1] };
    }
    return { month: 'JANUARY', day: parts[0] || '1' };
  };

  const handleYearlyChange = (field, val) => {
    const current = getYearlyParts();
    const newMonth = field === 'month' ? val : current.month;
    const newDay = field === 'day' ? val : current.day;
    setFormData((prev) => ({ ...prev, weekDays: `${newMonth} ${newDay}` }));
  };

  const handleToggle = (name) => {
    setFormData((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    onSave(formData);
  };

  return (
    <Box sx={{ py: 0.5 }}>
      <form id={formId} onSubmit={handleSubmit}>
        <Stack spacing={2}>
          
          {/* Section 1: Scope & Audit Details */}
          <BOSFormSection title="Audit Details & Scope" icon={IconReport} defaultOpen={true}>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {/* Row 1: Code and Name */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  required
                  fullWidth
                  size="small"
                  label="Config Code"
                  name="configCode"
                  value={formData.configCode}
                  onChange={handleChange}
                  disabled={!!config}
                  slotProps={{ input: { sx: { borderRadius: '8px' } } }}
                />
                <TextField
                  required
                  fullWidth
                  size="small"
                  label="Config Name"
                  name="configName"
                  value={formData.configName}
                  onChange={handleChange}
                  slotProps={{ input: { sx: { borderRadius: '8px' } } }}
                />
              </Stack>

              {/* Row 2: Select dropdowns */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  select
                  required
                  fullWidth
                  size="small"
                  label="Audit Type"
                  name="auditTypeId"
                  value={formData.auditTypeId}
                  onChange={handleChange}
                  slotProps={{ input: { sx: { borderRadius: '8px' } } }}
                >
                  {auditTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>{type.auditType}</MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  required
                  fullWidth
                  size="small"
                  label="Audited Department"
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleChange}
                  slotProps={{ input: { sx: { borderRadius: '8px' } } }}
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>{dept.departmentName}</MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  required
                  fullWidth
                  size="small"
                  label="Audit Area"
                  name="auditAreaId"
                  value={formData.auditAreaId}
                  onChange={handleChange}
                  slotProps={{ input: { sx: { borderRadius: '8px' } } }}
                >
                  {auditAreas.map((area) => (
                    <MenuItem key={area.id} value={area.id}>{area.description}</MenuItem>
                  ))}
                </TextField>
              </Stack>
            </Stack>
          </BOSFormSection>

          {/* Section 2: Scheduling & Recurrence */}
          <BOSFormSection title="Scheduling & Constraints" icon={IconCalendarTime} defaultOpen={true}>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {/* Row 1: Frequency & Custom/Dynamic Day settings */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Frequency"
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleChange}
                  slotProps={{ input: { sx: { borderRadius: '8px' } } }}
                >
                  {FREQUENCIES.map((freq) => (
                    <MenuItem key={freq} value={freq}>{freq}</MenuItem>
                  ))}
                </TextField>

                {formData.frequency === 'CUSTOM' && (
                  <>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Repeat Every"
                      name="repeatEveryValue"
                      value={formData.repeatEveryValue}
                      onChange={handleChange}
                      slotProps={{ input: { sx: { borderRadius: '8px' } } }}
                    />
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Unit"
                      name="repeatEveryUnit"
                      value={formData.repeatEveryUnit}
                      onChange={handleChange}
                      slotProps={{ input: { sx: { borderRadius: '8px' } } }}
                    >
                      {REPEAT_UNITS.map((unit) => (
                        <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                      ))}
                    </TextField>
                  </>
                )}

                {formData.frequency === 'WEEKLY' && (
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Weekday"
                    name="weekDays"
                    value={formData.weekDays || 'MONDAY'}
                    onChange={handleChange}
                    slotProps={{ input: { sx: { borderRadius: '8px' } } }}
                  >
                    {WEEKDAYS.map((day) => (
                      <MenuItem key={day} value={day}>{day}</MenuItem>
                    ))}
                  </TextField>
                )}

                {['MONTHLY', 'QUARTERLY', 'HALF_YEARLY'].includes(formData.frequency) && (
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Day of Month"
                    name="weekDays"
                    value={formData.weekDays || '1'}
                    onChange={handleChange}
                    disabled={true}
                    slotProps={{ input: { sx: { borderRadius: '8px' } } }}
                  >
                    {MONTH_DAYS.map((d) => (
                      <MenuItem key={d} value={d}>Day {d}</MenuItem>
                    ))}
                  </TextField>
                )}

                {formData.frequency === 'YEARLY' && (
                  <>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Month of Year"
                      value={getYearlyParts().month}
                      onChange={(e) => handleYearlyChange('month', e.target.value)}
                      disabled={true}
                      slotProps={{ input: { sx: { borderRadius: '8px' } } }}
                    >
                      {MONTHS.map((m) => (
                        <MenuItem key={m} value={m}>{m}</MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Day of Month"
                      value={getYearlyParts().day}
                      onChange={(e) => handleYearlyChange('day', e.target.value)}
                      disabled={true}
                      slotProps={{ input: { sx: { borderRadius: '8px' } } }}
                    >
                      {MONTH_DAYS.map((d) => (
                        <MenuItem key={d} value={d}>Day {d}</MenuItem>
                      ))}
                    </TextField>
                  </>
                )}
              </Stack>

              {/* Row 2: Timing & Rules */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  required
                  fullWidth
                  size="small"
                  label="Start Time"
                  value={formData.startTime}
                  disabled={true}
                  slotProps={{
                    input: {
                      readOnly: true,
                      sx: { borderRadius: '8px' },
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconClock size={18} color={theme.palette.primary.main} />
                        </InputAdornment>
                      )
                    }
                  }}
                />

                <TextField
                  required
                  fullWidth
                  size="small"
                  label="End Time"
                  value={formData.endTime}
                  disabled={true}
                  slotProps={{
                    input: {
                      readOnly: true,
                      sx: { borderRadius: '8px' },
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconClock size={18} color={theme.palette.primary.main} />
                        </InputAdornment>
                      )
                    }
                  }}
                />

                <TextField
                  type="number"
                  fullWidth
                  size="small"
                  label="Criteria Min Count"
                  name="criteriaMinCount"
                  value={formData.criteriaMinCount}
                  onChange={handleChange}
                  disabled={true}
                  slotProps={{ input: { sx: { borderRadius: '8px' } } }}
                />

                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Holiday Strategy"
                  name="holidayStrategy"
                  value={formData.holidayStrategy}
                  onChange={handleChange}
                  disabled={true}
                  slotProps={{ input: { sx: { borderRadius: '8px' } } }}
                >
                  {HOLIDAY_STRATEGIES.map((strategy) => (
                    <MenuItem key={strategy} value={strategy}>{strategy}</MenuItem>
                  ))}
                </TextField>
              </Stack>
            </Stack>
          </BOSFormSection>

          {/* Section 3: Status & Validations */}
          <BOSFormSection title="Validations & Status" icon={IconShieldCheck} defaultOpen={true}>
            <Stack direction="row" spacing={4} sx={{ pt: 0.5 }}>
              <FormControlLabel
                control={<Switch checked={formData.status} onChange={() => handleToggle('status')} color="primary" />}
                label="Is Active"
              />
            </Stack>
          </BOSFormSection>

          {/* Action Buttons (shown only if hideActions is false) */}
          {!hideActions && (
            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 1 }}>
              <Button variant="outlined" color="primary" onClick={onCancel} data-shortcut="close" sx={{ px: 4, py: 1, borderRadius: '8px' }}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" color="secondary" data-shortcut="save" startIcon={<IconDeviceFloppy />} sx={{ px: 4, py: 1, borderRadius: '8px' }}>
                Save Config
              </Button>
            </Stack>
          )}
        </Stack>
      </form>
    </Box>
  );
}
