import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import PropTypes from 'prop-types';
import {
  MenuItem,
  Stack,
  Box,
  Typography,
  Autocomplete,
  Chip,
  Divider,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Tooltip
} from '@mui/material';
import {
  BOSFormDialog,
  BOSTextField, BOSAutocomplete,
  BOSDatePicker,
  BOSFormSection,
  BOSAnalogTimePicker,
  BOSDataTable
  , errorStyle, BOSStatusChip
} from 'ui-component/bos';
import { IconPlus, IconTrash, IconSettings, IconUsers, IconMessageDots, IconClock, IconPlayerPause, IconPlayerPlay } from '@tabler/icons-react';
import useBOSValidation from 'hooks/useBOSValidation';
import { useLookups } from 'hooks/useLookups';

const formatTo24hString = (time) => {
  if (!time) return '';
  if (Array.isArray(time)) {
    const [h, m] = time;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  if (typeof time === 'string') {
    const parts = time.split(':');
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
  }
  return time;
};

const to24h = (time12h) => {
  if (!time12h) return '';
  if (!time12h.toUpperCase().includes('AM') && !time12h.toUpperCase().includes('PM')) {
    return formatTo24hString(time12h);
  }
  const [time, modifier] = time12h.trim().split(' ');
  let [hours, minutes] = time.split(':');
  let h = parseInt(hours, 10);
  if (modifier === 'PM' && h < 12) h += 12;
  if (modifier === 'AM' && h === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:${minutes}`;
};

const to12h = (timeVal) => {
  if (!timeVal) return '';
  const time24h = formatTo24hString(timeVal);
  if (!time24h) return '';
  const parts = time24h.split(':');
  const h24 = parseInt(parts[0], 10);
  const h12 = h24 % 12 || 12;
  const modifier = h24 >= 12 ? 'PM' : 'AM';
  return `${String(h12).padStart(2, '0')}:${parts[1].substring(0, 2)} ${modifier}`;
};

const getCurrent24hTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

const INITIAL_FORM = {
  momNo: 'AUTO',
  momDate: new Date().toISOString().split('T')[0],
  schedule: null,
  agenda: '',
  chairedBy: null,
  startTime: '09:00',
  endTime: '10:00',
  attendanceList: [],
  details: [
    { discussedPoint: '', processType: 'INFO', assignedBy: null, assignedTo: null, targetDate: '', reviewDate: '', attachmentRequired: 'NO' }
  ]
};

const calculateAttendanceStatus = (inTime, outTime, startTime, endTime) => {
  if (!inTime || inTime.trim() === '') return 'ABSENT';

  const start24 = formatTo24hString(startTime) || '09:00';
  const end24 = formatTo24hString(endTime) || '10:00';

  if (outTime && outTime.trim() !== '') {
    if (outTime < end24) {
      return 'EARLY_OUT';
    }
  }

  if (inTime < start24) {
    return 'EARLY_IN';
  } else if (inTime > start24) {
    return 'LATE';
  }
  return 'PRESENT';
};

const getStatusLabelAndTone = (status) => {
  const norm = String(status || '').toUpperCase();
  if (norm === 'EARLY_IN') return { label: 'Early In', tone: 'info' };
  if (norm === 'EARLY_OUT') return { label: 'Early Out', tone: 'warning' };
  if (norm === 'LATE') return { label: 'Late', tone: 'warning' };
  if (norm === 'ABSENT') return { label: 'Absent', tone: 'danger' };
  return { label: 'Present', tone: 'success' };
};

const sortAttendanceList = (list, hostId) => {
  if (!list) return [];
  const hostIdStr = hostId ? String(hostId) : null;
  return [...list].sort((a, b) => {
    const aIsHost = a.employee && hostIdStr && String(a.employee.id) === hostIdStr;
    const bIsHost = b.employee && hostIdStr && String(b.employee.id) === hostIdStr;
    if (aIsHost && !bIsHost) return -1;
    if (!aIsHost && bIsHost) return 1;
    return 0;
  });
};

const AddMomDialog = ({ open, onClose, onSave, item }) => {
  const dispatch = useDispatch();
  const { meetingSchedules = [], employees = [], refetch } = useLookups(['MEETING_SCHEDULES_ACTIVE', 'EMPLOYEES']);
  const { errors, validate, clearErrors } = useBOSValidation();
  const [form, setForm] = useState(INITIAL_FORM);
  const [pausedRows, setPausedRows] = useState({});

  const togglePauseClock = (key, att) => {
    setPausedRows((prev) => {
      const isNowPaused = !prev[key];
      if (!isNowPaused) {
        const current24 = getCurrent24hTime();
        setForm((prevForm) => {
          const list = [...prevForm.attendanceList];
          const targetIdx = list.findIndex((a, idx) => (a.employee?.id || idx) === key);
          if (targetIdx !== -1) {
            list[targetIdx] = {
              ...list[targetIdx],
              outTime: current24,
              attendanceStatus: calculateAttendanceStatus(
                list[targetIdx].inTime,
                current24,
                prevForm.schedule?.startTime,
                prevForm.schedule?.endTime
              )
            };
          }
          return { ...prevForm, attendanceList: list };
        });
      }
      return { ...prev, [key]: isNowPaused };
    });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setForm((prevForm) => {
        if (!prevForm.attendanceList || prevForm.attendanceList.length === 0) return prevForm;
        const current24 = getCurrent24hTime();
        let changed = false;

        const newAttendanceList = prevForm.attendanceList.map((att, idx) => {
          const key = att.employee?.id || idx;
          if (pausedRows[key]) return att;
          if (!att.inTime || att.attendanceStatus === 'ABSENT') return att;

          if (att.outTime !== current24) {
            changed = true;
            const calculatedStatus = calculateAttendanceStatus(
              att.inTime,
              current24,
              prevForm.schedule?.startTime,
              prevForm.schedule?.endTime
            );
            return {
              ...att,
              outTime: current24,
              attendanceStatus: calculatedStatus
            };
          }
          return att;
        });

        return changed ? { ...prevForm, attendanceList: newAttendanceList } : prevForm;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pausedRows]);

  useEffect(() => {
    if (open) {
      refetch();
      if (item) {
        let loadedItem = { ...item };
        if (loadedItem.attendanceList && loadedItem.schedule?.chairedBy) {
          const chairedIdStr = String(loadedItem.schedule.chairedBy.id);
          loadedItem.attendanceList = loadedItem.attendanceList.filter(
            (att) => !att.employee || String(att.employee.id) !== chairedIdStr
          );
        }
        if (loadedItem.attendanceList) {
          const hostId = loadedItem.schedule?.hostBy?.id;
          loadedItem.attendanceList = sortAttendanceList(
            loadedItem.attendanceList.map((att) => {
              const calculatedStatus = calculateAttendanceStatus(
                att.inTime,
                att.outTime,
                loadedItem.schedule?.startTime,
                loadedItem.schedule?.endTime
              );
              return {
                ...att,
                attendanceStatus: calculatedStatus
              };
            }),
            hostId
          );
        }
        setForm(loadedItem);
      } else {
        setForm(INITIAL_FORM);
      }
      clearErrors();
    }
  }, [open, item, clearErrors, refetch]);

  useEffect(() => {
    if (form.schedule?.id && meetingSchedules.length > 0) {
      const fullSch = meetingSchedules.find((s) => s.id === form.schedule.id);
      if (fullSch) {
        const hostEmployee = fullSch.hostBy;
        const hostIdStr = hostEmployee ? String(hostEmployee.id) : null;
        const chairedEmployee = fullSch.chairedBy;
        const chairedIdStr = chairedEmployee ? String(chairedEmployee.id) : null;

        let attendanceUpdated = false;
        let updatedAttendanceList = [...(form.attendanceList || [])];

        if (hostEmployee && hostIdStr && !updatedAttendanceList.some(att => att.employee && String(att.employee.id) === hostIdStr)) {
          if (!chairedIdStr || hostIdStr !== chairedIdStr) {
            updatedAttendanceList.push({
              employee: hostEmployee,
              inTime: '',
              outTime: '',
              attendanceStatus: 'ABSENT'
            });
            attendanceUpdated = true;
          }
        }

        if (chairedIdStr && updatedAttendanceList.some(att => att.employee && String(att.employee.id) === chairedIdStr)) {
          updatedAttendanceList = updatedAttendanceList.filter(att => !att.employee || String(att.employee.id) !== chairedIdStr);
          attendanceUpdated = true;
        }

        if (!form.schedule._isFull || attendanceUpdated) {
          const mappedList = updatedAttendanceList.map(att => {
            const calculatedStatus = calculateAttendanceStatus(
              att.inTime,
              att.outTime,
              fullSch.startTime,
              fullSch.endTime
            );
            return {
              ...att,
              attendanceStatus: calculatedStatus
            };
          });

          setForm((prev) => ({
            ...prev,
            schedule: {
              ...prev.schedule,
              ...fullSch,
              _isFull: true
            },
            attendanceList: sortAttendanceList(mappedList, fullSch.hostBy?.id)
          }));
        }
      }
    }
  }, [form.schedule, form.attendanceList, meetingSchedules]);

  // When schedule is selected, auto-fill header details
  const handleScheduleChange = (e, val) => {
    if (!val) return;
    let listToMap = [...(val.participants || [])];
    if (val.chairedBy) {
      listToMap = listToMap.filter((p) => p.employee && String(p.employee.id) !== String(val.chairedBy.id));
    }
    if (val.hostBy && !listToMap.some((p) => p.employee && String(p.employee.id) === String(val.hostBy.id))) {
      if (!val.chairedBy || String(val.hostBy.id) !== String(val.chairedBy.id)) {
        listToMap.push({ employee: val.hostBy });
      }
    }

    const participants = listToMap.map(p => {
      const isHost = val.hostBy && String(p.employee?.id) === String(val.hostBy.id);
      const inTime = isHost ? (val.startTime || '09:00') : '';
      const calculatedStatus = calculateAttendanceStatus(inTime, '', val.startTime, val.endTime);
      return {
        employee: p.employee,
        inTime,
        outTime: '',
        attendanceStatus: calculatedStatus
      };
    });

    setForm(p => ({
      ...p,
      schedule: val,
      agenda: val.agenda || '',
      chairedBy: val.chairedBy,
      startTime: val.startTime || '09:00',
      endTime: val.endTime || '10:00',
      attendanceList: sortAttendanceList(participants, val.hostBy?.id)
    }));
  };

  const addDetailRow = () => {
    setForm(p => ({
      ...p,
      details: [...p.details, { discussedPoint: '', processType: 'INFO', assignedBy: null, assignedTo: null, targetDate: '', reviewDate: '', attachmentRequired: 'NO' }]
    }));
  };

  const removeDetailRow = (index) => {
    if (form.details.length === 1) return;
    const newDetails = [...form.details];
    newDetails.splice(index, 1);
    setForm(p => ({ ...p, details: newDetails }));
  };

  const handleDetailChange = (index, field, value) => {
    const newDetails = [...form.details];
    newDetails[index][field] = value;
    setForm(p => ({ ...p, details: newDetails }));
  };

  const handleSave = () => {
    const rules = [
      { field: 'schedule', label: 'Meeting Schedule', required: true },
      { field: 'agenda', label: 'Agenda', required: true }
    ];

    if (validate(form, rules)) {
      // Validation: Out Time must not be before In Time
      const invalidOutTime = form.attendanceList.some((att) => {
        if (att.attendanceStatus === 'Absent' || att.attendanceStatus === 'ABSENT' || !att.inTime || !att.outTime) return false;
        const in24 = to24h(att.inTime);
        const out24 = to24h(att.outTime);
        if (!in24 || !out24) return false;
        return out24 < in24;
      });
      if (invalidOutTime) {
        dispatch(openSnackbar({ open: true, message: 'Out time cannot be before in time for any attendee', variant: 'alert', severity: 'warning' }));
        return;
      }

      if (!form.details || form.details.length === 0) {
        dispatch(
          openSnackbar({
            open: true,
            message: 'At least one discussion point is required.',
            variant: 'alert',
            severity: 'error'
          })
        );
        return;
      }

      // Custom validation for discussed points (SOP: 150 chars or 50 with attachment)
      for (const [idx, det] of form.details.entries()) {
        const minChars = det.attachmentRequired === 'YES' ? 50 : 150;
        if ((det.discussedPoint || '').length < minChars) {
          dispatch(openSnackbar({ open: true, message: `Point #${idx + 1} must be at least ${minChars} characters.`, variant: 'alert', severity: 'warning' }));
          return;
        }
        if (det.processType === 'ACTION' && (!det.assignedTo || !det.targetDate)) {
          dispatch(openSnackbar({ open: true, message: `Action Point #${idx + 1} requires an assignee and target date.`, variant: 'alert', severity: 'warning' }));
          return;
        }
      }
      onSave(form);
    }
  };

  return (
    <BOSFormDialog
      open={open}
      onClose={onClose}
      onSave={handleSave}
      title={item ? `Edit MOM - ${item.momNo}` : 'New Meeting Minutes'}
      saveButtonDisabled={Boolean(item && item.id)}
      maxWidth="lg"
    >
      <Stack spacing={3}>
        {/* HEADER */}
        <BOSFormSection title="Minutes of Meeting Details" icon={<IconSettings size={22} />}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={item && form.schedule ? [form.schedule, ...meetingSchedules.filter(s => s.id !== form.schedule.id)] : meetingSchedules}
                getOptionLabel={(option) => option.scheduleNo || ''}
                value={form.schedule}
                onOpen={() => refetch(true)}
                onChange={handleScheduleChange}
                renderInput={(params) => <BOSTextField {...params} label="Meeting Schedule No" required error={!!errors.schedule} sx={errorStyle(!!errors.schedule)} />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <BOSTextField label="Agenda" value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} multiline rows={1} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={employees}
                getOptionLabel={(option) => option.employeeName || ''}
                value={form.chairedBy}
                onChange={(e, val) => setForm({ ...form, chairedBy: val })}
                renderInput={(params) => <BOSTextField {...params} label="Chaired By" />}
              />
            </Grid>
          </Grid>
        </BOSFormSection>

        {/* ATTENDANCE */}
        <BOSFormSection title="Attendance Details" icon={<IconUsers size={22} />}>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell width={50}>Sl No</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Employee Name</TableCell>
                  <TableCell width={150}>In Time</TableCell>
                  <TableCell width={150}>Out Time</TableCell>
                  <TableCell width={150}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {form.attendanceList.map((att, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{att.employee?.department?.departmentName || 'N/A'}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: att.employee && form.schedule?.hostBy && String(att.employee.id) === String(form.schedule.hostBy.id) ? 'error.main' : 'text.primary' }}>
                      {att.employee?.employeeName}
                      {att.employee && form.schedule?.hostBy && String(att.employee.id) === String(form.schedule.hostBy.id) && ' (HOST)'}
                    </TableCell>
                    <TableCell>
                      <BOSTextField
                        type="text"
                        size="small"
                        value={att.attendanceStatus === 'ABSENT' ? '' : to12h(att.inTime)}
                        disabled
                        placeholder=""
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            height: '38px !important',
                            borderRadius: '12px !important',
                            backgroundColor: 'grey.50 !important',
                          },
                          '& .MuiInputBase-input': {
                            fontSize: '0.72rem !important',
                            fontWeight: '600 !important',
                            textAlign: 'center !important',
                            paddingLeft: '4px !important',
                            paddingRight: '4px !important',
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const key = att.employee?.id || idx;
                        const isPaused = Boolean(pausedRows[key]);
                        const isDisabled = !att.inTime || att.attendanceStatus === 'ABSENT';

                        return (
                          <BOSAnalogTimePicker
                            size="small"
                            value={att.attendanceStatus === 'ABSENT' ? '' : to12h(att.outTime)}
                            onChange={(e) => {
                              setPausedRows((prev) => ({ ...prev, [key]: true }));
                              const list = [...form.attendanceList];
                              const outTimeVal = to24h(e.target.value);
                              list[idx].outTime = outTimeVal;

                              const calculatedStatus = calculateAttendanceStatus(
                                list[idx].inTime,
                                outTimeVal,
                                form.schedule?.startTime,
                                form.schedule?.endTime
                              );
                              list[idx].attendanceStatus = calculatedStatus;

                              setForm({ ...form, attendanceList: list });
                            }}
                            disabled={isDisabled}
                            disableFutureValidation
                            minTime={to12h(att.inTime)}
                            minTimeMessage="Out time cannot be before in time."
                            isLiveClock={true}
                            isPaused={isPaused}
                            onTogglePause={!isDisabled ? () => togglePauseClock(key, att) : undefined}
                          />
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const { label, tone } = getStatusLabelAndTone(att.attendanceStatus);
                        return <BOSStatusChip status={label} toneOverride={tone} showIcon={true} width={120} />;
                      })()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </BOSFormSection>

        {/* DISCUSSION POINTS */}
        <BOSFormSection title="Discussion & Action Points" icon={<IconMessageDots size={22} />}>
          <Stack spacing={2}>
            {form.details.map((det, idx) => (
              <Box key={idx} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.default' }}>
                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>#{idx + 1}</Typography>
                  <BOSTextField
                    fullWidth
                    label="Discussed Point"
                    value={det.discussedPoint}
                    onChange={(e) => handleDetailChange(idx, 'discussedPoint', e.target.value.toUpperCase())}
                    multiline
                    rows={2}
                    placeholder="Describe the point in detail..."
                  />
                  <IconButton color="error" onClick={() => removeDetailRow(idx)} disabled={form.details.length === 1}><IconTrash /></IconButton>
                </Stack>
                <Grid container spacing={2}>
                  <Grid item xs={3}>
                    <BOSTextField select label="Process" size="small" value={det.processType} onChange={(e) => handleDetailChange(idx, 'processType', e.target.value)}>
                      <MenuItem value="INFO">INFO</MenuItem>
                      <MenuItem value="ACTION">ACTION</MenuItem>
                    </BOSTextField>
                  </Grid>
                  {det.processType === 'ACTION' && (
                    <>
                      <Grid item xs={3}>
                        <Autocomplete
                          options={employees}
                          getOptionLabel={(option) => option.employeeName || ''}
                          value={det.assignedTo}
                          onChange={(e, val) => handleDetailChange(idx, 'assignedTo', val)}
                          renderInput={(params) => <BOSTextField {...params} label="Assigned To" size="small" />}
                        />
                      </Grid>
                      <Grid item xs={3}>
                        <BOSDatePicker label="Target Date" size="small" value={det.targetDate} onChange={(e) => handleDetailChange(idx, 'targetDate', e.target.value)} name="targetDate" />
                      </Grid>
                      <Grid item xs={3}>
                        <BOSTextField select label="Attach Required?" size="small" value={det.attachmentRequired} onChange={(e) => handleDetailChange(idx, 'attachmentRequired', e.target.value)}>
                          <MenuItem value="YES">YES</MenuItem>
                          <MenuItem value="NO">NO</MenuItem>
                        </BOSTextField>
                      </Grid>
                    </>
                  )}
                </Grid>
              </Box>
            ))}
            <Button startIcon={<IconPlus />} variant="outlined" onClick={addDetailRow} sx={{ width: 'fit-content' }}>Add Discussion Point</Button>
          </Stack>
        </BOSFormSection>
      </Stack>
    </BOSFormDialog>
  );
};

AddMomDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  item: PropTypes.object
};

export default AddMomDialog;
