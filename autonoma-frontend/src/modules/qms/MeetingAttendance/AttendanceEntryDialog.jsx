import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Stack, Autocomplete, Typography, Box } from '@mui/material';
import { BOSFormDialog, BOSTextField, BOSFormSection } from 'ui-component/bos';
import { IconClock } from '@tabler/icons-react';
import useLookups from 'hooks/useLookups';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';
import useAuth from 'hooks/useAuth';

const formatTo12h = (time24) => {
  if (!time24) return '-';
  if (Array.isArray(time24)) {
    const [h, m] = time24;
    time24 = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  const [hours, minutes] = time24.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${minutes} ${ampm}`;
};

const formatTo12hNoAmPm = (time24) => {
  if (!time24) return '-';
  let h24 = 0;
  let m24 = 0;
  if (Array.isArray(time24)) {
    h24 = parseInt(time24[0], 10);
    m24 = parseInt(time24[1], 10);
  } else {
    const parts = time24.split(':');
    h24 = parseInt(parts[0], 10);
    m24 = parseInt(parts[1] || '00', 10);
  }
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${String(h12).padStart(2, '0')}:${String(m24).padStart(2, '0')}`;
};

const getHoursMinutes = (timeVal) => {
  if (!timeVal) return [0, 0];
  if (Array.isArray(timeVal)) {
    return [parseInt(timeVal[0], 10), parseInt(timeVal[1], 10)];
  }
  const parts = String(timeVal).split(':').map(Number);
  return [parts[0] || 0, parts[1] || 0];
};

const AttendanceEntryDialog = ({ open, item, onClose, onSave }) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { employees = [] } = useLookups(['EMPLOYEES']);
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [attendeeName, setAttendeeName] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('PRESENT');
  const [inTime, setInTime] = useState('');
  const [inTimeRaw, setInTimeRaw] = useState('');
  const [outTime, setOutTime] = useState('');
  const [outTimeRaw, setOutTimeRaw] = useState('');
  const [existingAttendance, setExistingAttendance] = useState([]);

  const isEdit = !!item;

  // Load eligible schedules (OPEN or RESCHEDULE, current date, within time window)
  useEffect(() => {
    if (open) {
      if (isEdit) {
        setSelectedSchedule(item.schedule);
        setAttendeeName(item.employee?.employeeName || 'N/A');
        setAttendanceStatus(item.status || 'PRESENT');
        setInTimeRaw(item.inTime);
        setInTime(formatTo12h(item.inTime));
        setOutTimeRaw(item.outTime || '');
        setOutTime(formatTo12h(item.outTime));
      } else {
        const loadSchedules = async () => {
          try {
            const response = await axios.get(API_PATHS.QMS.MEETING_SCHEDULES);
            const allSchedules = Array.isArray(response.data) ? response.data : [];
            const now = new Date();
            const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

            const eligible = allSchedules.filter(s => {
              // If not super admin, only show schedules where the current user is a participant, the host, or the chairperson
              if (user && user.userLevel !== 5) {
                const isHost = s.hostBy && Number(s.hostBy.id) === Number(user?.empId);
                const isChairperson = s.chairedBy && Number(s.chairedBy.id) === Number(user?.empId);
                const isParticipant = s.participants?.some(p => Number(p.employee?.id) === Number(user?.empId));
                if (!isParticipant && !isHost && !isChairperson) return false;
              }

              // Handle potential null/undefined status from backend just like the list page does
              const scheduleStatus = (s.status || 'OPEN').toUpperCase();
              
              // Restore strict eligibility checks
              if (scheduleStatus !== 'OPEN' && scheduleStatus !== 'RESCHEDULE') return false;
              if (s.meetingDate !== today) return false;
              if (!s.startTime) return false;
              const [h, m] = getHoursMinutes(s.startTime);
              const startMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m).getTime();
              
              // ── STRICT END TIME CHECK ──
              if (s.endTime) {
                const [eh, em] = getHoursMinutes(s.endTime);
                const endMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), eh, em).getTime();
                if (now.getTime() > endMs) return false;
              }
              
              const tenMinBefore = startMs - 10 * 60 * 1000;
              if (now.getTime() < tenMinBefore) return false;
              
              return true;
            });
            const getStartMs = (s) => {
              if (!s.startTime) return 0;
              const [h, m] = getHoursMinutes(s.startTime);
              return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m).getTime();
            };

            const sortedEligible = [...eligible].sort((a, b) => {
              const startA = getStartMs(a);
              const startB = getStartMs(b);
              const nowMs = now.getTime();

              const isUpcomingA = startA >= nowMs;
              const isUpcomingB = startB >= nowMs;

              if (isUpcomingA && !isUpcomingB) return -1;
              if (!isUpcomingA && isUpcomingB) return 1;

              if (isUpcomingA && isUpcomingB) {
                return startA - startB; // Earliest upcoming first
              } else {
                return startB - startA; // Latest ongoing first (closest to now)
              }
            });

            setSchedules(sortedEligible);
            if (sortedEligible.length > 0) {
              setSelectedSchedule(sortedEligible[0]);
            }
          } catch (error) {
            console.error('Failed to load schedules:', error);
          }
        };
        loadSchedules();
        setSelectedSchedule(null);
        setInTime('');
        setInTimeRaw('');
        setAttendanceStatus('PRESENT');
        setOutTime('');
        setOutTimeRaw('');
        if (user && user.userLevel !== 5) {
          const matchedEmp = employees.find(e => Number(e.id) === Number(user?.empId));
          setAttendeeName(matchedEmp ? matchedEmp.employeeName : (user.name || ''));
        } else {
          setAttendeeName('');
        }
      }
    }
  }, [open, item, isEdit, user]);

  // Determine attendance status based on time (Only for NEW entries)
  useEffect(() => {
    if (!isEdit && selectedSchedule && selectedSchedule.startTime) {
      const now = new Date();
      const [h, m] = getHoursMinutes(selectedSchedule.startTime);
      const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
      setAttendanceStatus(now > startTime ? 'LATE' : 'PRESENT');
      const timeStr = now.toTimeString().slice(0, 5);
      setInTimeRaw(timeStr);
      setInTime(formatTo12h(timeStr));

      // Fetch existing attendance to filter out already marked users
      axios.get(API_PATHS.QMS.MEETING_ATTENDANCE).then(res => {
        const filtered = (res.data || []).filter(a => a.schedule?.id === selectedSchedule.id);
        setExistingAttendance(filtered);
      }).catch(err => console.error('Failed to fetch attendance for filter', err));
    }
  }, [selectedSchedule, isEdit]);

  const handleSaveAction = async () => {
    if (!selectedSchedule) {
      dispatch(openSnackbar({ open: true, message: 'Please select a schedule', variant: 'alert', severity: 'warning' }));
      return;
    }

    try {
      if (isEdit) {
        if (item?.outTime) {
          onClose();
          return;
        }
        await axios.put(`${API_PATHS.QMS.MEETING_ATTENDANCE}/${item.id}/out`);
        dispatch(openSnackbar({ open: true, message: 'Out time marked successfully', variant: 'alert', severity: 'success' }));
        onSave();
        return;
      } else {
        if (!attendeeName) {
          dispatch(openSnackbar({ open: true, message: 'Please select an attendee', variant: 'alert', severity: 'warning' }));
          return;
        }
        // FIND employeeId
        const selectedEmp = employees.find(e => e.employeeName === attendeeName);
        
        if (!selectedEmp) {
          dispatch(openSnackbar({ open: true, message: 'Invalid attendee selected', variant: 'alert', severity: 'error' }));
          return;
        }
        
        // MARK IN ACTION
        await axios.post(API_PATHS.QMS.MEETING_ATTENDANCE, {
          scheduleId: selectedSchedule.id,
          employeeId: selectedEmp.id,
          inTime: inTimeRaw,
          status: attendanceStatus
        });
        dispatch(openSnackbar({ open: true, message: 'Attendance marked successfully', variant: 'alert', severity: 'success' }));
      }
      onSave();
    } catch (error) {
      dispatch(openSnackbar({ open: true, message: error.response?.data?.message || 'Action failed', variant: 'alert', severity: 'error' }));
    }
  };

  return (
    <BOSFormDialog
      open={open}
      onClose={onClose}
      onSave={handleSaveAction}
      isViewOnly={isEdit}
      hideFooter={isEdit}
      title={isEdit ? "View Attendance" : "Meeting User Attendance"}
      saveLabel="Mark In"
      maxWidth="sm"
      contentSx={{ overflowY: 'auto', p: 3 }}
    >
      <BOSFormSection 
        title={isEdit ? "Attendance Details" : "Attendance Entry"} 
        icon={<IconClock size={22} />}
        contentSx={{ p: 2 }}
      >
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {isEdit ? (
            <BOSTextField
              label="Schedule No"
              value={selectedSchedule?.scheduleNo || ''}
              InputProps={{ readOnly: true }}
              fullWidth
              sx={{ bgcolor: 'grey.50' }}
            />
          ) : (
            <Autocomplete
              options={schedules}
              getOptionLabel={(option) => option.scheduleNo || ''}
              value={selectedSchedule}
              onChange={(e, val) => setSelectedSchedule(val)}
              renderInput={(params) => (
                <BOSTextField {...params} label="Select Schedule No" required fullWidth />
              )}
            />
          )}

          {isEdit || (user && user.userLevel !== 5) ? (
            <BOSTextField
              label="Attendee Name"
              value={attendeeName}
              InputProps={{ readOnly: true }}
              fullWidth
              sx={{ bgcolor: 'grey.50' }}
            />
          ) : (
            <Autocomplete
              options={employees.filter(emp => 
                // Show participants, host, and chairperson assigned to this schedule who haven't marked attendance yet
                (!selectedSchedule || 
                  selectedSchedule.participants?.some(p => p.employee?.id === emp.id) ||
                  (selectedSchedule.hostBy && selectedSchedule.hostBy.id === emp.id) ||
                  (selectedSchedule.chairedBy && selectedSchedule.chairedBy.id === emp.id)
                ) &&
                !existingAttendance.some(att => att.employee?.id === emp.id)
              )}
              getOptionLabel={(option) => option.employeeName || ''}
              value={employees.find(e => e.employeeName === attendeeName) || null}
              onChange={(e, val) => setAttendeeName(val ? val.employeeName : '')}
              renderInput={(params) => (
                <BOSTextField {...params} label="Select Attendee" required fullWidth />
              )}
              noOptionsText={selectedSchedule ? "All assigned participants and host have marked attendance" : "Select a schedule first"}
            />
          )}

          <BOSTextField
            label="Attendance Status"
            value={attendanceStatus}
            InputProps={{ readOnly: true }}
            fullWidth
            sx={{
              bgcolor: attendanceStatus === 'LATE' ? 'warning.lighter' : (attendanceStatus === 'ABSENT' ? 'error.lighter' : 'success.lighter'),
              '& .MuiInputBase-input': {
                color: attendanceStatus === 'LATE' ? 'warning.dark' : (attendanceStatus === 'ABSENT' ? 'error.dark' : 'success.dark'),
                fontWeight: 700
              }
            }}
          />

          <BOSTextField
            label="In Time"
            value={inTime}
            InputProps={{ readOnly: true }}
            fullWidth
            sx={{ bgcolor: 'grey.50' }}
          />

          {isEdit && (
            <BOSTextField
              label="Out Time"
              value={outTime || '-'}
              InputProps={{ readOnly: true }}
              fullWidth
              sx={{ bgcolor: 'grey.50' }}
            />
          )}

          {selectedSchedule && (
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'primary.lighter' }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>Schedule Details</Typography>
              <Typography variant="body2"><strong>Meeting Type:</strong> {selectedSchedule.meetingType?.meetingName || '-'}</Typography>
              <Typography variant="body2"><strong>Date:</strong> {selectedSchedule.meetingDate || '-'}</Typography>
              <Typography variant="body2"><strong>Time:</strong> {formatTo12hNoAmPm(selectedSchedule.startTime)} - {formatTo12hNoAmPm(selectedSchedule.endTime)}</Typography>
            </Box>
          )}
        </Stack>
      </BOSFormSection>
    </BOSFormDialog>
  );
};

AttendanceEntryDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  item: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

export default AttendanceEntryDialog;
