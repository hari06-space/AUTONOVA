import { useState, useEffect } from 'react';
import {
  Grid, Box, Button, Typography, Stack, MenuItem,
  Card, Checkbox, FormControlLabel, Switch, Chip, TextField, useTheme, InputAdornment, IconButton, Tooltip, Avatar, Popover
} from '@mui/material';
import {
  IconCheck, IconChevronRight, IconChevronLeft, IconPlaylistAdd,
  IconPlayerPlay, IconEye, IconSettings, IconDeviceFloppy,
  IconSearch, IconUser, IconMail, IconCalendar, IconClock, IconFileText,
  IconTrash, IconPalette, IconLayoutDashboard, IconInfoCircle
} from '@tabler/icons-react';
import { btnSave, btnCancel, btnNew } from 'ui-component/bos';
import axios from 'utils/axios';
import CustomClockPicker from './CustomClockPicker';

const WIZARD_STEPS = [
  '1. Source Module',
  '2. Columns Map',
  '3. Filter Rules',
  '4. Recipients',
  '5. Schedule Cycle',
  '6. Output Channels',
  '7. Layout Styles',
  '8. Dynamic Body',
  '9. Run Previews',
  '10. Save & Trigger'
];

const PRESET_COLORS = [
  { name: 'Navy Blue', value: '#1a223f' },
  { name: 'Indigo Violet', value: '#5e35b1' },
  { name: 'Teal Green', value: '#009688' },
  { name: 'Forest Green', value: '#2e7d32' },
  { name: 'Sunset Orange', value: '#e65100' },
  { name: 'Rose Crimson', value: '#c2185b' },
  { name: 'Dark Charcoal', value: '#2d3748' }
];

export default function ConfigEditor({ config, onSave, onCancel }) {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [metadata, setMetadata] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewRows, setPreviewRows] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [fieldSearch, setFieldSearch] = useState('');
  const [clockAnchorEl, setClockAnchorEl] = useState(null);
  const [colorAnchorEl, setColorAnchorEl] = useState(null);
  const [activeInputRef, setActiveInputRef] = useState('body');

  // Form State
  const [configName, setConfigName] = useState(config?.configName || '');
  const [category, setCategory] = useState(config?.category || 'HR');
  const [description, setDescription] = useState(config?.description || '');
  const [sourceName, setSourceName] = useState(config?.sourceName || '');
  const [isActive, setIsActive] = useState(config?.isActive !== false);

  // Dynamic parameters parsed from JSON
  const [selectedFields, setSelectedFields] = useState([]);
  const [filters, setFilters] = useState([]);
  const [recipients, setRecipients] = useState({ to: '', toDynamic: '', cc: '', ccDynamic: '', bcc: '' });
  const [schedule, setSchedule] = useState({ triggerType: 'DAILY', time: '09:00', repeatInterval: 30, cronExpression: '' });
  const [output, setOutput] = useState({ formats: ['EMAIL'], subject: '', body: '', footer: '', templateId: '' });
  const [layout, setLayout] = useState({ showHeader: true, showTotals: false, themeColor: '#1a223f' });

  // Initialize
  useEffect(() => {
    const init = async () => {
      try {
        const [metaRes, tempRes] = await Promise.all([
          axios.get('/api/automation-configs/metadata'),
          axios.get('/api/automation-templates')
        ]);
        setMetadata(metaRes.data);
        setTemplates(tempRes.data);

        if (config) {
          if (config.selectedFields) setSelectedFields(JSON.parse(config.selectedFields));
          if (config.filterJson) setFilters(JSON.parse(config.filterJson));
          if (config.recipientJson) setRecipients(JSON.parse(config.recipientJson));
          if (config.schedulerJson) setSchedule(JSON.parse(config.schedulerJson));
          if (config.outputJson) setOutput(JSON.parse(config.outputJson));
          if (config.layoutJson) setLayout(JSON.parse(config.layoutJson));
        }
      } catch (e) {
        console.error('Failed to load metadata/templates:', e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [config]);

  const activeEntity = metadata.find(m => m.entityName === sourceName);

  const handleEntityChange = (name) => {
    setSourceName(name);
    const ent = metadata.find(m => m.entityName === name);
    if (ent) {
      // Map all discovered columns as active by default
      const defaultFields = ent.fields.map(f => ({
        fieldName: f.fieldName,
        customHeader: f.fieldName,
        isActive: true
      }));
      setSelectedFields(defaultFields);
    } else {
      setSelectedFields([]);
    }
    setFilters([]);
  };

  const handleFieldToggle = (fieldName) => {
    setSelectedFields(selectedFields.map(f =>
      f.fieldName === fieldName ? { ...f, isActive: !f.isActive } : f
    ));
  };

  const handleHeaderRename = (fieldName, val) => {
    setSelectedFields(selectedFields.map(f =>
      f.fieldName === fieldName ? { ...f, customHeader: val } : f
    ));
  };

  const handleAddFilter = () => {
    setFilters([...filters, { field: activeEntity?.fields[0]?.fieldName || '', op: 'EQUAL', value: '' }]);
  };

  const handleUpdateFilter = (idx, prop, val) => {
    setFilters(filters.map((f, i) => i === idx ? { ...f, [prop]: val } : f));
  };

  const handleRemoveFilter = (idx) => {
    setFilters(filters.filter((_, i) => i !== idx));
  };

  const fetchQueryPreview = async () => {
    if (!sourceName || selectedFields.filter(f => f.isActive).length === 0) return;
    setPreviewLoading(true);
    try {
      const activeFields = selectedFields.filter(f => f.isActive);
      const res = await axios.post('/api/automation-configs/preview-data', {
        entityName: sourceName,
        selectedFields: JSON.stringify(activeFields),
        filterJson: JSON.stringify(filters)
      });
      setPreviewRows(res.data);
    } catch (e) {
      console.error('Preview query failed:', e);
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (activeStep === 8 && sourceName) {
      fetchQueryPreview();
    }
  }, [activeStep]);

  const handleInsertPlaceholder = (placeholder) => {
    let inputEl = null;
    let currentValue = '';
    let updateFn = null;

    if (activeInputRef === 'subject') {
      inputEl = document.getElementById('email-subject-input');
      currentValue = output.subject || '';
      updateFn = (val) => setOutput(prev => ({ ...prev, subject: val }));
    } else if (activeInputRef === 'footer') {
      inputEl = document.getElementById('email-footer-input');
      currentValue = output.footer || '';
      updateFn = (val) => setOutput(prev => ({ ...prev, footer: val }));
    } else {
      inputEl = document.getElementById('email-body-input');
      currentValue = output.body || '';
      updateFn = (val) => setOutput(prev => ({ ...prev, body: val }));
    }

    if (inputEl) {
      const start = inputEl.selectionStart ?? currentValue.length;
      const end = inputEl.selectionEnd ?? currentValue.length;
      const newValue = currentValue.substring(0, start) + placeholder + currentValue.substring(end);
      
      updateFn(newValue);

      // Focus back and place cursor after the inserted text
      setTimeout(() => {
        inputEl.focus();
        const newCursorPos = start + placeholder.length;
        inputEl.setSelectionRange(newCursorPos, newCursorPos);
      }, 50);
    } else {
      // Fallback: append
      if (activeInputRef === 'subject') {
        setOutput(prev => ({ ...prev, subject: (prev.subject || '') + placeholder }));
      } else if (activeInputRef === 'footer') {
        setOutput(prev => ({ ...prev, footer: (prev.footer || '') + placeholder }));
      } else {
        setOutput(prev => ({ ...prev, body: (prev.body || '') + placeholder }));
      }
    }
  };

  const handleSave = () => {
    const payload = {
      ...config,
      configName,
      category,
      description,
      isActive,
      triggerType: schedule.triggerType,
      sourceType: 'ENTITY',
      sourceName,
      selectedFields: JSON.stringify(selectedFields.filter(f => f.isActive)),
      filterJson: JSON.stringify(filters),
      recipientJson: JSON.stringify(recipients),
      schedulerJson: JSON.stringify({ ...schedule, triggerType: schedule.triggerType }),
      outputJson: JSON.stringify(output),
      layoutJson: JSON.stringify(layout)
    };
    onSave(payload);
  };

  const nextStep = () => setActiveStep(prev => Math.min(prev + 1, WIZARD_STEPS.length - 1));
  const prevStep = () => setActiveStep(prev => Math.max(prev - 1, 0));

  if (loading) {
    return <Typography sx={{ p: 4 }} align="center">Loading Discovery Engine metadata...</Typography>;
  }

  // Filter column fields list by search key
  const filteredFields = selectedFields.filter(f =>
    f.fieldName.toLowerCase().includes(fieldSearch.toLowerCase())
  );

  return (
    <Card sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 4, boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
      <Stack spacing={4}>

        {/* Sleek Custom Horizontal Stepper Header */}
        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 3 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {WIZARD_STEPS.map((label, idx) => {
              const isActive = activeStep === idx;
              const isCompleted = activeStep > idx;
              return (
                <Box
                  key={label}
                  onClick={() => setActiveStep(idx)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.2,
                    px: 2.2,
                    py: 1,
                    borderRadius: '30px',
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: isActive ? 'primary.main' : isCompleted ? 'success.light' : 'divider',
                    bgcolor: isActive ? 'primary.light' : isCompleted ? 'success.lighter' : 'background.paper',
                    boxShadow: isActive ? `0 2px 8px ${theme.palette.primary.light}80` : 'none',
                    transition: 'all 0.25s ease-in-out',
                    '&:hover': {
                      bgcolor: isActive ? 'primary.light' : 'action.hover',
                      transform: 'translateY(-1.5px)'
                    }
                  }}
                >
                  <Avatar
                    sx={{
                      width: 22,
                      height: 22,
                      fontSize: '11px',
                      fontWeight: 'bold',
                      bgcolor: isActive ? 'primary.main' : isCompleted ? 'success.main' : 'grey.300',
                      color: isActive || isCompleted ? '#fff' : 'text.secondary',
                      transition: 'all 0.25s'
                    }}
                  >
                    {isCompleted ? <IconCheck size={13} /> : idx + 1}
                  </Avatar>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'primary.dark' : isCompleted ? 'success.dark' : 'text.secondary',
                      fontSize: '13px'
                    }}
                  >
                    {label.split('. ')[1]}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Wizard Canvas Panels */}
        <Box sx={{ minHeight: '45vh', p: 1 }}>

          {/* Step 1: Select Source */}
          {activeStep === 0 && (
            <Stack spacing={3}>
              <Box sx={{ borderLeft: '4px solid', borderColor: 'primary.main', pl: 1.5 }}>
                <Typography variant="h4" fontWeight={800}>Step 1: Select Module & Entity Source</Typography>
                <Typography variant="caption" color="textSecondary">Define configuration name, category and ERP target datasource</Typography>
              </Box>

              <Grid container spacing={3.5}>
                {/* Left Card: Basic Information */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 3, height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
                    <Stack spacing={3}>
                      <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconLayoutDashboard size={18} color={theme.palette.primary.main} /> Basic Information
                      </Typography>
                      <TextField
                        fullWidth
                        label="Configuration Name"
                        value={configName}
                        onChange={e => setConfigName(e.target.value)}
                        required
                        variant="outlined"
                        slotProps={{ input: { sx: { borderRadius: '10px' } } }}
                      />
                      <TextField
                        select
                        fullWidth
                        label="Category"
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        variant="outlined"
                        slotProps={{ input: { sx: { borderRadius: '10px' } } }}
                      >
                        {['HR', 'Payroll', 'Attendance', 'Inventory', 'Purchase', 'Sales', 'Finance', 'Custom'].map(cat => (
                          <MenuItem key={cat} value={cat.toUpperCase()}>{cat}</MenuItem>
                        ))}
                      </TextField>
                    </Stack>
                  </Card>
                </Grid>

                {/* Right Card: Datasource & Status */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 3, height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
                    <Stack spacing={3}>
                      <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconSettings size={18} color={theme.palette.primary.main} /> Source Configuration
                      </Typography>

                      <TextField
                        select
                        fullWidth
                        label="Source Entity (Database Table)"
                        value={sourceName}
                        onChange={e => handleEntityChange(e.target.value)}
                        variant="outlined"
                        slotProps={{ input: { sx: { borderRadius: '10px' } } }}
                      >
                        {metadata.map(meta => (
                          <MenuItem key={meta.entityName} value={meta.entityName}>
                            {meta.entityName} ({meta.tableName})
                          </MenuItem>
                        ))}
                      </TextField>

                      {/* Premium Switch Status Card */}
                      <Card sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: isActive ? 'success.light' : 'divider',
                        bgcolor: isActive ? 'success.lighter' : 'background.paper',
                        borderRadius: '10px',
                        transition: 'all 0.3s'
                      }}>
                        <FormControlLabel
                          control={<Switch checked={isActive} onChange={e => setIsActive(e.target.checked)} color="success" />}
                          label={
                            <Box sx={{ ml: 1 }}>
                              <Typography variant="subtitle2" fontWeight={800} color={isActive ? 'success.dark' : 'text.primary'}>
                                Scheduler: {isActive ? 'ACTIVE & LIVE' : 'PAUSED'}
                              </Typography>
                              <Typography variant="caption" color="textSecondary" display="block">
                                {isActive ? 'Running automatically per schedule.' : 'Temporarily suspended.'}
                              </Typography>
                            </Box>
                          }
                        />
                      </Card>
                    </Stack>
                  </Card>
                </Grid>

                {/* Bottom Row Description */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description / Purpose of automation"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    multiline
                    rows={2.5}
                    variant="outlined"
                    slotProps={{ input: { sx: { borderRadius: '10px' } } }}
                  />
                </Grid>
              </Grid>
            </Stack>
          )}

          {/* Step 2: Dynamic Field Selection */}
          {activeStep === 1 && (
            <Stack spacing={3}>
              <Box sx={{ borderLeft: '4px solid', borderColor: 'primary.main', pl: 1.5 }}>
                <Typography variant="h4" fontWeight={800}>Step 2: Dynamic Column Mapping</Typography>
                <Typography variant="caption" color="textSecondary">Toggle output columns and optionally rename their headers</Typography>
              </Box>

              {!sourceName ? (
                <Typography color="error" variant="subtitle1" fontWeight={700} align="center" sx={{ p: 4 }}>Select a Source Entity in Step 1 first.</Typography>
              ) : (
                <Stack spacing={2.5}>
                  {/* Search Bar for Columns */}
                  <TextField
                    size="small"
                    placeholder="Search discovered entity columns..."
                    value={fieldSearch}
                    onChange={e => setFieldSearch(e.target.value)}
                    sx={{ maxWidth: 400 }}
                    slotProps={{
                      input: {
                        sx: { borderRadius: '10px' },
                        startAdornment: (
                          <InputAdornment position="start">
                            <IconSearch size={16} />
                          </InputAdornment>
                        )
                      }
                    }}
                  />

                  <Grid container spacing={2}>
                    {filteredFields.map(field => {
                      const isFieldActive = field.isActive;
                      return (
                        <Grid item xs={12} md={6} key={field.fieldName}>
                          <Card sx={{
                            p: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            border: '1px solid',
                            borderColor: isFieldActive ? 'primary.light' : 'divider',
                            bgcolor: isFieldActive ? 'background.paper' : 'grey.50',
                            borderRadius: '10px',
                            transition: 'all 0.2s'
                          }}>
                            <FormControlLabel
                              control={<Checkbox checked={isFieldActive} onChange={() => handleFieldToggle(field.fieldName)} color="primary" />}
                              label={
                                <Typography variant="subtitle2" fontWeight={700} color={isFieldActive ? 'text.primary' : 'text.secondary'}>
                                  {field.fieldName}
                                </Typography>
                              }
                            />
                            <TextField
                              size="small"
                              label="Rename Header"
                              value={field.customHeader || ''}
                              onChange={e => handleHeaderRename(field.fieldName, e.target.value)}
                              disabled={!isFieldActive}
                              slotProps={{ input: { sx: { borderRadius: '6px', fontSize: '12px' } } }}
                              sx={{ width: 180 }}
                            />
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Stack>
              )}
            </Stack>
          )}

          {/* Step 3: Filter Builder */}
          {activeStep === 2 && (
            <Stack spacing={3}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ borderLeft: '4px solid', borderColor: 'primary.main', pl: 1.5 }}>
                <Box>
                  <Typography variant="h4" fontWeight={800}>Step 3: Dynamic Filters Expression</Typography>
                  <Typography variant="caption" color="textSecondary">Limit records using dynamic comparison rules</Typography>
                </Box>
                <Button variant="outlined" startIcon={<IconPlaylistAdd size={18} />} onClick={handleAddFilter} disabled={!sourceName} sx={{ borderRadius: '20px' }}>
                  Add Condition
                </Button>
              </Stack>

              {!sourceName ? (
                <Typography color="error" variant="subtitle1" fontWeight={700} align="center" sx={{ p: 4 }}>Select a Source Entity in Step 1 first.</Typography>
              ) : (
                <Stack spacing={2.5}>
                  {filters.map((filter, idx) => (
                    <Card key={idx} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: '12px', bgcolor: 'background.paper' }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={4}>
                          <TextField
                            select
                            fullWidth
                            size="small"
                            label="Field"
                            value={filter.field}
                            onChange={e => handleUpdateFilter(idx, 'field', e.target.value)}
                            slotProps={{ input: { sx: { borderRadius: '8px' } } }}
                          >
                            {activeEntity?.fields.map(f => (
                              <MenuItem key={f.fieldName} value={f.fieldName}>{f.fieldName}</MenuItem>
                            ))}
                          </TextField>
                        </Grid>

                        <Grid item xs={12} sm={3}>
                          <TextField
                            select
                            fullWidth
                            size="small"
                            label="Operator"
                            value={filter.op}
                            onChange={e => handleUpdateFilter(idx, 'op', e.target.value)}
                            slotProps={{ input: { sx: { borderRadius: '8px' } } }}
                          >
                            <MenuItem value="EQUAL">Equal (=)</MenuItem>
                            <MenuItem value="NOT_EQUAL">Not Equal (!=)</MenuItem>
                            <MenuItem value="GREATER_THAN">Greater Than (&gt;)</MenuItem>
                            <MenuItem value="LESS_THAN">Less Than (&lt;)</MenuItem>
                            <MenuItem value="CONTAINS">Contains (Like %x%)</MenuItem>
                            <MenuItem value="STARTS_WITH">Starts With (Like x%)</MenuItem>
                            <MenuItem value="ENDS_WITH">Ends With (Like %x)</MenuItem>
                            <MenuItem value="IS_NULL">Is Null</MenuItem>
                            <MenuItem value="IS_NOT_NULL">Is Not Null</MenuItem>
                          </TextField>
                        </Grid>

                        <Grid item xs={12} sm={4}>
                          {!['IS_NULL', 'IS_NOT_NULL'].includes(filter.op) && (
                            <TextField
                              fullWidth
                              size="small"
                              label="Comparison Value"
                              value={filter.value || ''}
                              onChange={e => handleUpdateFilter(idx, 'value', e.target.value)}
                              slotProps={{ input: { sx: { borderRadius: '8px' } } }}
                            />
                          )}
                        </Grid>

                        <Grid item xs={12} sm={1} align="center">
                          <IconButton color="error" onClick={() => handleRemoveFilter(idx)}>
                            <IconTrash size={20} />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </Card>
                  ))}
                  {filters.length === 0 && (
                    <Typography color="textSecondary" align="center" sx={{ p: 6, border: '2px dashed', borderColor: 'divider', borderRadius: 3, bgcolor: 'grey.50' }}>
                      No filter conditions defined. All entity records will be fetched.
                    </Typography>
                  )}
                </Stack>
              )}
            </Stack>
          )}

          {/* Step 4: Recipients Builder */}
          {activeStep === 3 && (
            <Stack spacing={3}>
              <Box sx={{ borderLeft: '4px solid', borderColor: 'primary.main', pl: 1.5 }}>
                <Typography variant="h4" fontWeight={800}>Step 4: Configure Recipients</Typography>
                <Typography variant="caption" color="textSecondary">Choose dynamic workflow responders or target static mail address</Typography>
              </Box>

              <Grid container spacing={3.5}>
                {/* Left Card: Static list */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 3, height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Stack spacing={3}>
                      <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconMail size={18} color={theme.palette.primary.main} /> Static Recipients
                      </Typography>
                      <TextField
                        fullWidth
                        label="TO Recipient Emails"
                        value={recipients.to}
                        onChange={e => setRecipients({ ...recipients, to: e.target.value })}
                        placeholder="e.g. employee@autonova.com, supervisor@autonova.com"
                        helperText="Comma separated values"
                        slotProps={{ input: { sx: { borderRadius: '10px' } } }}
                      />
                      <TextField
                        fullWidth
                        label="CC Recipient Emails"
                        value={recipients.cc}
                        onChange={e => setRecipients({ ...recipients, cc: e.target.value })}
                        placeholder="e.g. copy@autonova.com"
                        slotProps={{ input: { sx: { borderRadius: '10px' } } }}
                      />
                    </Stack>
                  </Card>
                </Grid>

                {/* Right Card: Dynamic settings */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 3, height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Stack spacing={3}>
                      <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconUser size={18} color={theme.palette.primary.main} /> Dynamic Binding Mappings
                      </Typography>
                      <TextField
                        select
                        fullWidth
                        label="Dynamic Row TO Type"
                        value={recipients.toDynamic}
                        onChange={e => setRecipients({ ...recipients, toDynamic: e.target.value })}
                        slotProps={{ input: { sx: { borderRadius: '10px' } } }}
                      >
                        <MenuItem value="">[ Static list only ]</MenuItem>
                        <MenuItem value="EMPLOYEE_EMAIL">Employee Email (from Master record)</MenuItem>
                        <MenuItem value="REPORTING_MANAGER">Employee's Reporting Manager</MenuItem>
                        <MenuItem value="DEPARTMENT_HEAD">Department Head</MenuItem>
                        <MenuItem value="HR_EMAIL">HR Manager</MenuItem>
                      </TextField>
                      <TextField
                        select
                        fullWidth
                        label="Dynamic Row CC Type"
                        value={recipients.ccDynamic}
                        onChange={e => setRecipients({ ...recipients, ccDynamic: e.target.value })}
                        slotProps={{ input: { sx: { borderRadius: '10px' } } }}
                      >
                        <MenuItem value="">[ Static list only ]</MenuItem>
                        <MenuItem value="REPORTING_MANAGER">Reporting Manager</MenuItem>
                        <MenuItem value="HR_EMAIL">HR Manager</MenuItem>
                      </TextField>
                    </Stack>
                  </Card>
                </Grid>
              </Grid>
            </Stack>
          )}

          {/* Step 5: Scheduler Configuration */}
          {activeStep === 4 && (
            <Stack spacing={3}>
              <Box sx={{ borderLeft: '4px solid', borderColor: 'primary.main', pl: 1.5 }}>
                <Typography variant="h4" fontWeight={800}>Step 5: Scheduler Trigger Settings</Typography>
                <Typography variant="caption" color="textSecondary">Configure automatic timing schedule using Quartz runner</Typography>
              </Box>

              <Card sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      select
                      fullWidth
                      label="Trigger Frequency Type"
                      value={schedule.triggerType}
                      onChange={e => setSchedule({ ...schedule, triggerType: e.target.value })}
                      slotProps={{ input: { sx: { borderRadius: '10px' } } }}
                    >
                      <MenuItem value="DAILY">Daily run</MenuItem>
                      <MenuItem value="WEEKLY">Weekly run</MenuItem>
                      <MenuItem value="MONTHLY">Monthly run</MenuItem>
                      <MenuItem value="CRON">Custom Cron Expression</MenuItem>
                      <MenuItem value="INTERVAL">Repeat every X minutes</MenuItem>
                    </TextField>
                  </Grid>

                  {['DAILY', 'WEEKLY', 'MONTHLY'].includes(schedule.triggerType) && (
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Execution Time"
                        value={schedule.time || '09:00'}
                        onClick={(e) => setClockAnchorEl(e.currentTarget)}
                        slotProps={{
                          input: {
                            readOnly: true,
                            sx: { borderRadius: '10px', cursor: 'pointer' },
                            endAdornment: (
                              <InputAdornment position="end" sx={{ cursor: 'pointer' }}>
                                <IconClock size={18} color={theme.palette.primary.main} />
                              </InputAdornment>
                            )
                          }
                        }}
                        sx={{ '& input': { cursor: 'pointer' } }}
                      />
                      <CustomClockPicker
                        open={Boolean(clockAnchorEl)}
                        anchorEl={clockAnchorEl}
                        onClose={() => setClockAnchorEl(null)}
                        value={schedule.time || '09:00'}
                        onChange={(newTime) => setSchedule({ ...schedule, time: newTime })}
                      />
                    </Grid>
                  )}

                  {schedule.triggerType === 'CRON' && (
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Cron Expression"
                        value={schedule.cronExpression}
                        onChange={e => setSchedule({ ...schedule, cronExpression: e.target.value })}
                        placeholder="0 0 9 * * ?"
                        helperText="Standard 6 field format: Seconds Minutes Hours DayOfMonth Month DayOfWeek"
                        slotProps={{ input: { sx: { borderRadius: '10px' } } }}
                      />
                    </Grid>
                  )}

                  {schedule.triggerType === 'INTERVAL' && (
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Repeat Interval (Minutes)"
                        value={schedule.repeatInterval}
                        onChange={e => setSchedule({ ...schedule, repeatInterval: Number(e.target.value) })}
                        slotProps={{ input: { sx: { borderRadius: '10px' } } }}
                      />
                    </Grid>
                  )}

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Time Zone"
                      value="Asia/Kolkata"
                      disabled
                      slotProps={{ input: { sx: { borderRadius: '10px' } } }}
                    />
                  </Grid>
                </Grid>
              </Card>
            </Stack>
          )}

          {/* Step 6: Output Format */}
          {activeStep === 5 && (
            <Stack spacing={3}>
              <Box sx={{ borderLeft: '4px solid', borderColor: 'primary.main', pl: 1.5 }}>
                <Typography variant="h4" fontWeight={800}>Step 6: Choose Output Layout Channels</Typography>
                <Typography variant="caption" color="textSecondary">Specify formats generated and emailed by the engine</Typography>
              </Box>

              <Grid container spacing={3}>
                {['EMAIL', 'PDF', 'EXCEL', 'CSV'].map(fmt => {
                  const hasFormat = output.formats.includes(fmt);
                  return (
                    <Grid item xs={12} md={3} key={fmt}>
                      <Card sx={{
                        p: 3,
                        border: '1.5px solid',
                        borderColor: hasFormat ? 'primary.main' : 'divider',
                        bgcolor: hasFormat ? 'primary.light' : 'background.paper',
                        boxShadow: hasFormat ? `0 4px 12px ${theme.palette.primary.light}30` : 'none',
                        borderRadius: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                        transition: 'all 0.25s',
                        '&:hover': {
                          transform: 'translateY(-2px)'
                        }
                      }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={hasFormat}
                              onChange={e => {
                                const list = e.target.checked
                                  ? [...output.formats, fmt]
                                  : output.formats.filter(f => f !== fmt);
                                setOutput({ ...output, formats: list });
                              }}
                              color="primary"
                            />
                          }
                          label={
                            <Typography variant="h5" fontWeight={800} color={hasFormat ? 'primary.dark' : 'text.primary'}>
                              {fmt}
                            </Typography>
                          }
                        />
                        <Typography variant="caption" color="textSecondary" sx={{ height: 40 }}>
                          {fmt === 'EMAIL' && 'Generates dynamic inline HTML mail body structures.'}
                          {fmt === 'PDF' && 'Compiles styled iText report document attachments.'}
                          {fmt === 'EXCEL' && 'Compiles formatted workbook spreadsheet outputs.'}
                          {fmt === 'CSV' && 'Compiles plain text comma-delimited output.'}
                        </Typography>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Stack>
          )}

          {/* Step 7: Layout Styles */}
          {activeStep === 6 && (
            <Stack spacing={3}>
              <Box sx={{ borderLeft: '4px solid', borderColor: 'primary.main', pl: 1.5 }}>
                <Typography variant="h4" fontWeight={800}>Step 7: PDF / Document Layout Styles</Typography>
                <Typography variant="caption" color="textSecondary">Assign custom aesthetic layouts and branding color schemes</Typography>
              </Box>

              <Grid container spacing={3.5}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Stack spacing={3}>
                      <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconLayoutDashboard size={18} color={theme.palette.primary.main} /> Visual Theme
                      </Typography>
                      <TextField
                        select
                        fullWidth
                        label="Choose Visual Canvas Template"
                        value={output.templateId || ''}
                        onChange={e => setOutput({ ...output, templateId: e.target.value })}
                        slotProps={{ input: { sx: { borderRadius: '10px' } } }}
                      >
                        <MenuItem value="">[ Plain layout table ]</MenuItem>
                        {templates.map(t => (
                          <MenuItem key={t.rowId} value={t.rowId}>{t.templateName}</MenuItem>
                        ))}
                      </TextField>
                    </Stack>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Stack spacing={3}>
                      <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconPalette size={18} color={theme.palette.primary.main} /> Color Palette
                      </Typography>
                      <TextField
                        fullWidth
                        label="Document Theme Accent Color"
                        value={layout.themeColor || '#1a223f'}
                        onClick={(e) => setColorAnchorEl(e.currentTarget)}
                        placeholder="#1a223f"
                        slotProps={{
                          input: {
                            readOnly: true,
                            sx: { borderRadius: '10px', cursor: 'pointer' },
                            startAdornment: (
                              <InputAdornment position="start">
                                <Box 
                                  sx={{ 
                                    width: 18, 
                                    height: 18, 
                                    borderRadius: '50%', 
                                    bgcolor: layout.themeColor || '#1a223f', 
                                    border: '1.5px solid #ccc',
                                    transition: 'all 0.2s'
                                  }} 
                                />
                              </InputAdornment>
                            )
                          }
                        }}
                        sx={{ '& input': { cursor: 'pointer' } }}
                      />

                      <Popover
                        open={Boolean(colorAnchorEl)}
                        anchorEl={colorAnchorEl}
                        onClose={() => setColorAnchorEl(null)}
                        anchorOrigin={{
                          vertical: 'bottom',
                          horizontal: 'left',
                        }}
                        transformOrigin={{
                          vertical: 'top',
                          horizontal: 'left',
                        }}
                        slotProps={{
                          paper: {
                            sx: {
                              borderRadius: '16px',
                              p: 2,
                              width: '280px',
                              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                              border: '1px solid',
                              borderColor: 'divider',
                              bgcolor: 'background.paper'
                            }
                          }
                        }}
                      >
                        <Stack spacing={2}>
                          <Typography variant="subtitle2" fontWeight={800} color="textPrimary">
                            Select Theme Accent Color
                          </Typography>
                          
                          <Grid container spacing={1}>
                            {[
                              '#1a223f', '#3f51b5', '#6366f1', '#673ab7', '#9c27b0', '#e91e63',
                              '#00bcd4', '#009688', '#0f766e', '#4caf50', '#2e7d32', '#15803d',
                              '#ffc107', '#ff9800', '#f97316', '#ff5722', '#f44336', '#c2185b',
                              '#4b5563', '#374151', '#1f2937', '#0f172a', '#1e293b', '#000000'
                            ].map(val => {
                              const isSelected = (layout.themeColor || '#1a223f').toLowerCase() === val.toLowerCase();
                              return (
                                <Grid item xs={2} key={val} align="center">
                                  <Box
                                    onClick={() => {
                                      setLayout({ ...layout, themeColor: val });
                                      setColorAnchorEl(null);
                                    }}
                                    sx={{
                                      width: 28,
                                      height: 28,
                                      borderRadius: '50%',
                                      bgcolor: val,
                                      cursor: 'pointer',
                                      border: '2px solid',
                                      borderColor: isSelected ? 'primary.main' : 'transparent',
                                      boxShadow: isSelected ? '0 0 6px rgba(0,0,0,0.2)' : 'none',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'all 0.2s',
                                      '&:hover': {
                                        transform: 'scale(1.15)',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                                      }
                                    }}
                                  >
                                    {isSelected && <IconCheck size={14} color="#fff" />}
                                  </Box>
                                </Grid>
                              );
                            })}
                          </Grid>

                          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1.5 }}>
                            <TextField
                              size="small"
                              fullWidth
                              label="Custom HEX Code"
                              value={layout.themeColor || '#1a223f'}
                              onChange={e => setLayout({ ...layout, themeColor: e.target.value })}
                              placeholder="#1a223f"
                              slotProps={{
                                input: {
                                  sx: { borderRadius: '8px', fontSize: '12px' },
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <Box 
                                        sx={{ 
                                          width: 14, 
                                          height: 14, 
                                          borderRadius: '50%', 
                                          bgcolor: layout.themeColor || '#1a223f', 
                                          border: '1px solid #ccc' 
                                        }} 
                                      />
                                    </InputAdornment>
                                  )
                                }
                              }}
                            />
                          </Box>
                        </Stack>
                      </Popover>
                    </Stack>
                  </Card>
                </Grid>
              </Grid>
            </Stack>
          )}

          {/* Step 8: Placeholders Body */}
          {activeStep === 7 && (
            <Stack spacing={3}>
              <Box sx={{ borderLeft: '4px solid', borderColor: 'primary.main', pl: 1.5 }}>
                <Typography variant="h4" fontWeight={800}>Step 8: Email Subject & Body templates</Typography>
                <Typography variant="caption" color="textSecondary">Draft dynamic email templates using replacement parameter fields</Typography>
              </Box>

              <Card sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <Stack spacing={3}>
                  {/* Placeholder Guide helper */}
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: '12px', border: '1px solid', borderColor: 'grey.200' }}>
                    <Typography variant="subtitle2" fontWeight={800} color="primary.main" sx={{ mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <IconInfoCircle size={16} /> Dynamic Template Placeholders
                    </Typography>
                    <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 2 }}>
                      💡 Drag chips directly into any text input below, or click a chip to insert at your last cursor position.
                    </Typography>
                    
                    <Typography variant="caption" fontWeight={700} color="textSecondary" display="block" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px' }}>
                      Standard Parameters
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {['{{todayDate}}', '{{totalCount}}', '{{reportData}}'].map(tag => (
                        <Tooltip key={tag} title="Click to insert or drag into input">
                          <Chip
                            label={tag}
                            size="small"
                            variant="outlined"
                            onClick={() => handleInsertPlaceholder(tag)}
                            draggable
                            onDragStart={(e) => e.dataTransfer.setData('text/plain', tag)}
                            sx={{
                              fontWeight: 'bold',
                              fontFamily: 'monospace',
                              cursor: 'grab',
                              transition: 'all 0.2s',
                              '&:hover': { bgcolor: 'primary.light', borderColor: 'primary.main' },
                              '&:active': { cursor: 'grabbing' }
                            }}
                          />
                        </Tooltip>
                      ))}
                    </Box>

                    {selectedFields.filter(f => f.isActive).length > 0 && (
                      <>
                        <Typography variant="caption" fontWeight={700} color="textSecondary" display="block" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px' }}>
                          Selected Entity Columns (Dynamic Row Binding)
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {selectedFields.filter(f => f.isActive).map(f => {
                            const tag = `{{${f.fieldName}}}`;
                            return (
                              <Tooltip key={f.fieldName} title={`Insert dynamic ${f.fieldName} value per record`}>
                                <Chip
                                  label={tag}
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                  onClick={() => handleInsertPlaceholder(tag)}
                                  draggable
                                  onDragStart={(e) => e.dataTransfer.setData('text/plain', tag)}
                                  sx={{
                                    fontWeight: 'bold',
                                    fontFamily: 'monospace',
                                    cursor: 'grab',
                                    transition: 'all 0.2s',
                                    '&:hover': { bgcolor: 'primary.light', borderColor: 'primary.main' },
                                    '&:active': { cursor: 'grabbing' }
                                  }}
                                />
                              </Tooltip>
                            );
                          })}
                        </Box>
                      </>
                    )}
                  </Box>

                  <TextField
                    id="email-subject-input"
                    fullWidth
                    label="Email Subject line template"
                    value={output.subject || ''}
                    onChange={e => setOutput({ ...output, subject: e.target.value })}
                    onFocus={() => setActiveInputRef('subject')}
                    placeholder="e.g. Birthday wishes for {{employeeName}}"
                    slotProps={{ input: { sx: { borderRadius: '10px' } } }}
                  />

                  <TextField
                    id="email-body-input"
                    fullWidth
                    label="Email Body layout template (HTML allowed)"
                    value={output.body || ''}
                    onChange={e => setOutput({ ...output, body: e.target.value })}
                    onFocus={() => setActiveInputRef('body')}
                    multiline
                    rows={6}
                    placeholder="Dear {{employeeName}}, Happy Anniversary! Check report data: {{reportData}}"
                    slotProps={{ input: { sx: { borderRadius: '10px' } } }}
                  />

                  <TextField
                    id="email-footer-input"
                    fullWidth
                    label="Email Footer text"
                    value={output.footer || ''}
                    onChange={e => setOutput({ ...output, footer: e.target.value })}
                    onFocus={() => setActiveInputRef('footer')}
                    placeholder="Automated ERP alert note"
                    slotProps={{ input: { sx: { borderRadius: '10px' } } }}
                  />
                </Stack>
              </Card>
            </Stack>
          )}

          {/* Step 9: Run Previews */}
          {activeStep === 8 && (
            <Stack spacing={3}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ borderLeft: '4px solid', borderColor: 'primary.main', pl: 1.5 }}>
                <Box>
                  <Typography variant="h4" fontWeight={800}>Step 9: Test Query Preview Data</Typography>
                  <Typography variant="caption" color="textSecondary">Runs the dynamic query compiler to render top 10 matching records</Typography>
                </Box>
                <Button variant="contained" sx={btnNew} onClick={fetchQueryPreview} disabled={previewLoading} startIcon={<IconEye size={16} />}>
                  {previewLoading ? 'Compiling Query...' : 'Refresh Preview'}
                </Button>
              </Stack>

              {previewRows.length > 0 ? (
                <Box sx={{ overflowX: 'auto', maxHeight: '45vh', border: '1px solid', borderColor: 'divider', borderRadius: 3, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)' }}>
                  <table border="1" cellpadding="10" cellspacing="0" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12.5px', fontFamily: 'Arial, sans-serif' }}>
                    <tr style={{ background: '#1a223f', color: '#fff', textAlign: 'left', fontWeight: 'bold' }}>
                      {Object.keys(previewRows[0]).map(h => (
                        <th key={h} style={{ borderBottom: '2px solid #ccc' }}>{h}</th>
                      ))}
                    </tr>
                    {previewRows.map((r, idx) => (
                      <tr key={idx} style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)' }}>
                        {Object.values(r).map((v, i) => (
                          <td key={i} style={{ borderBottom: '1px solid #eee' }}>{v != null ? v.toString() : ''}</td>
                        ))}
                      </tr>
                    ))}
                  </table>
                </Box>
              ) : (
                <Typography color="textSecondary" align="center" sx={{ p: 6, border: '2px dashed', borderColor: 'divider', borderRadius: 3, bgcolor: 'grey.50' }}>
                  No preview records loaded. Verify query filters.
                </Typography>
              )}
            </Stack>
          )}

          {/* Step 10: Trigger test & save */}
          {activeStep === 9 && (
            <Stack spacing={3} alignItems="center" sx={{ p: 5, bgcolor: 'primary.light', borderRadius: 4, border: '1px solid', borderColor: 'primary.main' }}>
              <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.main', mb: 1 }}>
                <IconCheck size={36} color="#fff" />
              </Avatar>
              <Typography variant="h3" fontWeight={800} color="primary.dark">Step 10: Complete Configuration Save</Typography>
              <Typography variant="subtitle1" color="textSecondary" align="center" sx={{ maxWidth: 500 }}>
                Your automation workflow is fully configured. You can now save it and trigger a test execution to verify layout styles instantly.
              </Typography>

              <Box sx={{ display: 'flex', gap: 3, mt: 4 }}>
                <Button variant="outlined" startIcon={<IconPlayerPlay size={20} />} onClick={handleSave} sx={{ p: 1.8, borderRadius: '30px', minWidth: 200, fontWeight: 'bold' }}>
                  Save & Trigger Test
                </Button>
                <Button variant="contained" startIcon={<IconDeviceFloppy size={20} />} onClick={handleSave} sx={{ ...btnSave, p: 1.8, borderRadius: '30px', minWidth: 200, fontWeight: 'bold' }}>
                  Save Configuration
                </Button>
              </Box>
            </Stack>
          )}

        </Box>

        {/* Navigation footer buttons */}
        <Stack direction="row" justifyContent="space-between" sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 3.5 }}>
          <Button
            variant="outlined"
            startIcon={<IconChevronLeft size={18} />}
            onClick={prevStep}
            disabled={activeStep === 0}
            sx={{ borderRadius: '20px', px: 3 }}
          >
            Previous
          </Button>

          <Button
            variant="contained"
            endIcon={<IconChevronRight size={18} />}
            onClick={nextStep}
            disabled={activeStep === WIZARD_STEPS.length - 1}
            sx={{ ...btnNew, borderRadius: '20px', px: 3 }}
          >
            Next
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
}
