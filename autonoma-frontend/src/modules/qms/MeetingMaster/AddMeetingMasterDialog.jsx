import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MenuItem, Stack, Grid, Typography, Box, Chip, Checkbox, Button } from '@mui/material';
import { BOSFormDialog, BOSTextField, BOSStatusField, BOSFileUpload, BOSAutocomplete, BOSEmployeeAutocomplete, errorStyle, BOSFormSection } from 'ui-component/bos';
import { IconFiles, IconSparkles, IconCalendarTime } from '@tabler/icons-react';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';
import useBOSValidation from 'hooks/useBOSValidation';
import ScheduleRuleBuilderDialog from '../MeetingSchedule/ScheduleRuleBuilderDialog';
import ScheduleSimulationDialog from '../MeetingSchedule/ScheduleSimulationDialog';

const INITIAL_FORM = {
  meetingName: '',
  meetingDescription: '',
  meetingPrefix: '',
  meetingAgenda: '',
  employeeId: [],
  employeeName: '',
  status: 'ACTIVE',
  attachmentName: '',
  attachmentUrl: '',
  attachmentsRequired: 'No',
  reminderDays: 0,
  remainderDays: 0
};

const AddMeetingMasterDialog = ({ open, onClose, onSave, item, existingData = [], readOnly = false }) => {
  const { errors, validate, clearErrors, handleInputChange, setErrors } = useBOSValidation();
  const [form, setForm] = useState(INITIAL_FORM);
  const [localFiles, setLocalFiles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [ruleBuilderOpen, setRuleBuilderOpen] = useState(false);
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [existingRules, setExistingRules] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    if (open) {
      if (item && item.id) {
        axios.get(`${API_PATHS.QMS.SCHEDULE_RULES}/meeting/${item.id}`)
          .then(res => setExistingRules(res.data || []))
          .catch(() => setExistingRules([]));
      } else {
        setExistingRules([]);
      }

      axios.get('/api/lookups/bulk?types=EMPLOYEES')
        .then((res) => {
          const list = res.data?.employees || [];
          setEmployees(Array.isArray(list) ? list : []);
        })
        .catch(() => {
          axios.get('/api/master/hr/employees')
            .then((res) => {
              const data = res.data;
              const list = Array.isArray(data) ? data : (Array.isArray(data?.content) ? data.content : []);
              setEmployees(list);
            })
            .catch(() => setEmployees([]));
        });
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      if (item) {
        let employeeIds = [];
        if (item.employeeId) {
          if (Array.isArray(item.employeeId)) {
            employeeIds = item.employeeId;
          } else if (typeof item.employeeId === 'string') {
            employeeIds = item.employeeId.split(',').map(id => id.trim()).filter(Boolean).map(Number);
          } else {
            employeeIds = [Number(item.employeeId)];
          }
        } else if (item.employeeMappings && Array.isArray(item.employeeMappings)) {
          employeeIds = item.employeeMappings.map(m => m.employee?.id ?? m.employeeId).filter(Boolean);
        }
        const f = {
          ...item,
          status: item.isActive === false ? 'INACTIVE' : 'ACTIVE',
          employeeId: employeeIds,
          employeeName: item.employeeName || '',
          attachmentsRequired: item.attachmentUrl ? 'Yes' : 'No',
          reminderDays: item.reminderDays ?? item.remainderDays ?? 0,
          remainderDays: item.reminderDays ?? item.remainderDays ?? 0
        };
        setForm(f);
        if (item.attachmentUrl) {
          const urls = item.attachmentUrl.split(',').map(u => u.trim()).filter(Boolean);
          const names = (item.attachmentName || item.attachmentUrl).split(',').map(n => n.trim()).filter(Boolean);
          const files = urls.map((url, i) => ({
            fileName: names[i] || url,
            serverFileName: url,
            isServer: true
          }));
          setLocalFiles(files);
        } else {
          setLocalFiles([]);
        }
      } else {
        setForm(INITIAL_FORM);
        setLocalFiles([]);
      }
      clearErrors();
    }
  }, [open, item, clearErrors]);

  const h = (e) => handleInputChange(e, setForm);

  const handleDescriptionChange = (e) => {
    const val = e.target.value;
    setForm(prev => ({ ...prev, meetingDescription: val }));
    if (errors.meetingDescription) {
      clearErrors('meetingDescription');
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const textFieldsToUppercase = ['meetingName', 'meetingDescription', 'meetingPrefix', 'meetingAgenda'];
    if (textFieldsToUppercase.includes(name) && typeof value === 'string') {
      setForm(prev => ({ ...prev, [name]: value.toUpperCase() }));
    }
  };

  const handleSave = async () => {
    const rules = [
      { field: 'meetingName', label: 'Meeting Name', required: true },
      { field: 'meetingDescription', label: 'Meeting Description', required: true },
      { field: 'meetingPrefix', label: 'Meeting Prefix', required: true },
      { field: 'meetingAgenda', label: 'Meeting Agenda', required: true }
    ];

    let isValid = validate(form, rules);

    if (form.attachmentsRequired === 'Yes' && localFiles.length === 0) {
      setErrors(prev => ({
        ...prev,
        attachments: 'At least one attachment is required when Attachments Required is set to Yes.'
      }));
      dispatch(openSnackbar({
        open: true,
        message: 'At least one attachment is required when Attachments Required is set to Yes.',
        variant: 'alert',
        severity: 'error'
      }));
      isValid = false;
    }

    if (isValid) {
      const isDuplicate = existingData.some(m =>
        m.meetingName?.trim()?.toLowerCase() === form.meetingName?.trim()?.toLowerCase() &&
        m.id !== item?.id
      );

      if (isDuplicate) {
        setErrors(prev => ({ ...prev, meetingName: 'A meeting with this name already exists' }));
        dispatch(openSnackbar({
          open: true,
          message: `Meeting "${form.meetingName.trim()}" already exists. Please use a different name.`,
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'warning'
        }));
        return;
      }

      const remVal = (form.reminderDays === '' || form.reminderDays === null || form.reminderDays === undefined)
        ? ((form.remainderDays === '' || form.remainderDays === null || form.remainderDays === undefined) ? 0 : parseInt(form.remainderDays, 10))
        : parseInt(form.reminderDays, 10);

      const savePayload = {
        ...form,
        reminderDays: isNaN(remVal) ? 0 : remVal,
        remainderDays: isNaN(remVal) ? 0 : remVal,
        isActive: form.status === 'ACTIVE',
        employeeId: Array.isArray(form.employeeId) ? form.employeeId.join(',') : (form.employeeId || '')
      };
      delete savePayload.employeeMappings;
      delete savePayload.createdUser;
      delete savePayload.updatedUser;
      delete savePayload.attachments;
      delete savePayload.attachmentsRequired;
      delete savePayload.statusObj;
      delete savePayload.title;
      delete savePayload.componentName;
      onSave(savePayload);
    }
  };

  const handleAttachmentsRequiredChange = (event) => {
    const val = event.target.value;
    setForm(prev => ({
      ...prev,
      attachmentsRequired: val
    }));
    if (val === 'No' || localFiles.length > 0) {
      clearErrors('attachments');
    }
  };

  const sidebarContent = (
    <Stack spacing={4}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
          Attachments
        </Typography>
        <BOSFileUpload
          files={localFiles}
          onChange={(uploadedFiles) => {
            setLocalFiles(uploadedFiles);
            if (uploadedFiles.length === 0) {
              setForm(prev => ({ ...prev, attachmentName: '', attachmentUrl: '' }));
            } else {
              const names = uploadedFiles.map(f => f.fileName || f.name || '').join(', ');
              const urls = uploadedFiles.map(f => f.serverFileName || f.path || f.filePath || '').join(', ');
              setForm(prev => ({
                ...prev,
                attachmentName: names,
                attachmentUrl: urls
              }));
            }
            if (uploadedFiles.length > 0 && errors.attachments) {
              clearErrors('attachments');
            }
          }}
          module="MASTER_QMS_MEETING_MEETING_MASTER"
          multiple={true}
          maxFiles={10}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
          label="Upload"
          icon={IconFiles}
          compact={false}
          scan={true}
          disabled={readOnly}
          error={!!errors.attachments}
          helperText={errors.attachments}
        />
      </Box>

    </Stack>
  );

  return (
    <BOSFormDialog
      open={open}
      onClose={onClose}
      onSave={handleSave}
      title="Meeting Master"
      maxWidth="lg"
      sidebar={sidebarContent}
    >
      <BOSFormSection title="Meeting Details">
        <Stack spacing={2.5}>
          <BOSTextField
            name="meetingName"
            label="Meeting Name"
            value={form.meetingName || ''}
            onChange={h}
            onBlur={handleBlur}
            error={!!errors.meetingName}
            helperText={errors.meetingName}
            sx={[ { '& input': { textTransform: 'uppercase' } }, errorStyle(!!errors.meetingName) ]}
            required
            disabled={readOnly}
          />
          
          <BOSTextField
            name="meetingDescription"
            label="Meeting Description"
            value={form.meetingDescription || ''}
            onChange={handleDescriptionChange}
            onBlur={handleBlur}
            error={!!errors.meetingDescription}
            helperText={errors.meetingDescription}
            sx={[ { '& textarea': { textTransform: 'uppercase' } }, errorStyle(!!errors.meetingDescription) ]}
            multiline
            minRows={2}
            disableRichText={true}
            required
            disabled={readOnly}
          />
          
          <BOSTextField
            name="meetingPrefix"
            label="Meeting Prefix"
            value={form.meetingPrefix || ''}
            onChange={h}
            onBlur={handleBlur}
            error={!!errors.meetingPrefix}
            helperText={errors.meetingPrefix}
            sx={[ { '& input': { textTransform: 'uppercase' } }, errorStyle(!!errors.meetingPrefix) ]}
            required
            disabled={readOnly}
          />
          
          <BOSTextField
            name="meetingAgenda"
            label="Meeting Agenda"
            value={form.meetingAgenda || ''}
            onChange={h}
            onBlur={handleBlur}
            error={!!errors.meetingAgenda}
            helperText={errors.meetingAgenda}
            sx={[ { '& textarea': { textTransform: 'uppercase' } }, errorStyle(!!errors.meetingAgenda) ]}
            multiline
            minRows={2}
            disableRichText={true}
            required
            disabled={readOnly}
          />

          <BOSEmployeeAutocomplete
            multiple
            name="employeeId"
            label="Employee Name"
            options={employees}
            value={form.employeeId || []}
            onChange={(newValue) => {
              const selectedArr = Array.isArray(newValue) ? newValue : [newValue].filter(Boolean);
              const selectedIds = selectedArr.map(val => typeof val === 'object' && val !== null ? (val.id ?? val.ID ?? val.employeeId) : val);
              const selectedNames = selectedIds
                .map(id => employees.find(emp => (emp.id ?? emp.ID ?? emp.employeeId) === id))
                .filter(Boolean)
                .map(emp => {
                  const code = emp.oldEmpCode || emp.empCode || '';
                  return code ? `${emp.employeeName} (${code})` : emp.employeeName;
                })
                .join(', ');

              setForm(p => ({
                ...p,
                employeeId: selectedIds,
                employeeName: selectedNames
              }));
              if (errors.employeeId) clearErrors('employeeId');
            }}
            error={!!errors.employeeId}
            helperText={errors.employeeId || 'Only employees with a user account are shown'}
            limitTags={5}
            sx={errorStyle(!!errors.employeeId)}
            disabled={readOnly}
          />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4.2}>
              <BOSTextField
                select
                fullWidth
                name="attachmentsRequired"
                label="Attachments Required"
                value={form.attachmentsRequired || 'No'}
                onChange={handleAttachmentsRequiredChange}
                required
                disabled={readOnly}
                sx={{ '& .MuiInputLabel-root': { whiteSpace: 'nowrap', overflow: 'visible', textOverflow: 'clip' } }}
              >
                <MenuItem value="Yes">Yes</MenuItem>
                <MenuItem value="No">No</MenuItem>
              </BOSTextField>
            </Grid>

            <Grid item xs={12} sm={3.8}>
              <BOSStatusField
                isCreate={!item}
                type="string-upper"
                name="status"
                label="Status"
                value={form.status}
                onChange={h}
                disabled={!item || readOnly}
                sx={{ '& .MuiInputLabel-root': { whiteSpace: 'nowrap', overflow: 'visible', textOverflow: 'clip' } }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <BOSTextField
                fullWidth
                type="number"
                name="reminderDays"
                label="Reminder Days"
                value={form.reminderDays ?? form.remainderDays ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setForm(prev => ({ ...prev, reminderDays: '', remainderDays: '', reminderDaysVal: '' }));
                  } else {
                    const num = parseInt(val, 10);
                    if (!isNaN(num)) {
                      const cleanVal = Math.min(15, Math.max(0, num));
                      setForm(prev => ({ ...prev, reminderDays: cleanVal, remainderDays: cleanVal, reminderDaysVal: cleanVal }));
                    }
                  }
                  if (errors.reminderDays || errors.remainderDays) {
                    clearErrors('reminderDays');
                    clearErrors('remainderDays');
                  }
                }}
                onBlur={(e) => {
                  const val = parseInt(e.target.value, 10);
                  const cleanVal = isNaN(val) ? 0 : Math.min(15, Math.max(0, val));
                  setForm(prev => ({ ...prev, reminderDays: cleanVal, remainderDays: cleanVal, reminderDaysVal: cleanVal }));
                }}
                inputProps={{ min: 0, max: 15 }}
                helperText={errors.reminderDays || errors.remainderDays || 'Max 15 days'}
                error={!!errors.reminderDays || !!errors.remainderDays}
                disabled={readOnly}
                sx={{ '& .MuiInputLabel-root': { whiteSpace: 'nowrap', overflow: 'visible', textOverflow: 'clip' } }}
              />
            </Grid>
          </Grid>

          {item && item.id && (
            <Box sx={{ pt: 1 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<IconSparkles size={18} />}
                onClick={() => setRuleBuilderOpen(true)}
                sx={{ borderRadius: 1.5, fontWeight: 700 }}
              >
                {existingRules.length > 0 ? `Configure Schedule Rules (${existingRules.length})` : 'Configure Schedule Rules'}
              </Button>
            </Box>
          )}
        </Stack>
      </BOSFormSection>

      {item && item.id && (
        <>
          <ScheduleRuleBuilderDialog
            open={ruleBuilderOpen}
            onClose={() => setRuleBuilderOpen(false)}
            meetingId={item.id}
            meetingName={item.meetingName}
            existingRules={existingRules}
            onRuleSaved={() => {
              axios.get(`${API_PATHS.QMS.SCHEDULE_RULES}/meeting/${item.id}`)
                .then(res => setExistingRules(res.data || []))
                .catch(() => {});
            }}
            onOpenSimulation={() => {
              setRuleBuilderOpen(false);
              setSimulationOpen(true);
            }}
          />

          <ScheduleSimulationDialog
            open={simulationOpen}
            onClose={() => setSimulationOpen(false)}
            meetingId={item.id}
            meetingName={item.meetingName || item.name}
            meetingCode={item.meetingCode || item.code}
            defaultFrequency={item.frequency || 'MONTHLY'}
          />
        </>
      )}
    </BOSFormDialog>
  );
};

AddMeetingMasterDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  item: PropTypes.object,
  existingData: PropTypes.array,
  readOnly: PropTypes.bool
};

export default AddMeetingMasterDialog;
