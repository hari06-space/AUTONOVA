// third party
import { createSlice } from '@reduxjs/toolkit';

// project imports
import axios from 'utils/axios';
import { dispatch } from '../index';
import { API_PATHS } from 'utils/api-constants';

const normalizeEvent = (e) => ({
  ...e,
  id: e.id || e._id || String(Date.now())
});

const normalizeList = (list = []) => list.map(normalizeEvent);

// Helper: parse YYYY-MM-DD to Date at midnight local time
const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-');
  return new Date(Number(y), Number(m) - 1, Number(d));
};

// Helper: combine date string + time string to Date (e.g. "2026-07-04" + "14:30")
const combineDatetime = (dateStr, timeStr) => {
  if (!dateStr) return null;
  const base = parseLocalDate(dateStr);
  if (!base) return null;
  if (timeStr) {
    const [h, m] = timeStr.split(':');
    base.setHours(Number(h) || 0, Number(m) || 0, 0, 0);
  }
  return base;
};

// Check if a schedule is past (date is before today's start)
const isDatePast = (dateStr) => {
  const d = parseLocalDate(dateStr);
  if (!d) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
};

// Check if event is non-editable
const isNonEditable = (status, dateStr) => {
  const closedStatuses = ['CLOSED', 'CANCELLED', 'AUTO CLOSED', 'AMENDED'];
  return closedStatuses.includes((status || '').toUpperCase()) || isDatePast(dateStr);
};

// Generate a premium vibrant color based on a string
const PREMIUM_PALETTE = [
  '#4F46E5', // Indigo
  '#0284C7', // Light Blue
  '#059669', // Emerald
  '#D97706', // Amber
  '#E11D48', // Rose
  '#7C3AED', // Violet
  '#0D9488', // Teal
  '#C026D3', // Fuchsia
  '#EA580C', // Orange
  '#2563EB', // Blue
  '#4338CA', // Indigo darker
  '#65A30D', // Lime
];

const stringToDarkColor = (str) => {
  if (!str) return PREMIUM_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PREMIUM_PALETTE[Math.abs(hash) % PREMIUM_PALETTE.length];
};

// ── MEETING SCHEDULE → FullCalendar event ──
const meetingToEvent = (item) => {
  const dateStr = item.meetingDate || null;
  if (!dateStr) return null;

  const status = (item.status || 'OPEN').toUpperCase();
  const past = isDatePast(dateStr);
  const nonEditable = isNonEditable(status, dateStr);

  const meetingTypeName = item.meetingType?.meetingName || '';
  const scheduleNo = item.scheduleNo || '';
  const typeStr = meetingTypeName || item.comments || 'Meeting';

  let bgColor = stringToDarkColor(typeStr);
  let borderColor = bgColor;

  const startDt = combineDatetime(dateStr, item.startTime);
  const endDt = combineDatetime(dateStr, item.endTime);

  const departments = (item.departments || []).map(d => d.department?.departmentName).filter(Boolean).join(', ');
  const participants = (item.participants || []).map(p => p.employee?.employeeName).filter(Boolean);
  const participantsObj = (item.participants || []).map(p => ({
    employeeName: p.employee?.employeeName,
    imgName: p.employee?.imgName || p.employee?.photo
  })).filter(p => p.employeeName);
  const chairedBy = item.chairedBy?.employeeName || '';
  const host = item.hostBy?.employeeName || '';

  const isDraft = status === 'DRAFT';

  return {
    id: `meeting-${item.id}`,
    title: isDraft ? `📝 [Draft] ${typeStr}${scheduleNo ? ` - ${scheduleNo}` : ''}` : `📅 ${typeStr}${scheduleNo ? ` - ${scheduleNo}` : ''}`,
    start: startDt ? startDt.toISOString() : dateStr,
    end: endDt ? endDt.toISOString() : undefined,
    allDay: !item.startTime,
    backgroundColor: bgColor,
    borderColor: borderColor,
    textColor: '#ffffff',
    editable: !nonEditable,
    classNames: nonEditable ? ['fc-event-disabled'] : [],
    extendedProps: {
      eventType: 'meeting',
      originalId: item.id,
      scheduleNo: item.scheduleNo || '',
      meetingType: meetingTypeName,
      subject: item.subject || item.comments || '',
      agenda: item.agenda || item.comments || '',
      description: item.description || '',
      meetingDate: dateStr,
      startTime: item.startTime || '',
      endTime: item.endTime || '',
      intervalTime: item.intervalTime || '',
      frequency: item.frequency || '',
      departments: departments,
      chairedBy: chairedBy,
      chairedByObj: item.chairedBy ? { employeeName: item.chairedBy.employeeName, imgName: item.chairedBy.imgName || item.chairedBy.photo } : null,
      host: host,
      hostObj: item.hostBy ? { employeeName: item.hostBy.employeeName, imgName: item.hostBy.imgName || item.hostBy.photo } : null,
      participants: participants,
      participantsObj: participantsObj,
      status: status,
      isPast: past,
      isNonEditable: nonEditable
    }
  };
};

// ── AUDIT SCHEDULE → FullCalendar event ──
const auditToEvent = (item) => {
  const dateStr = item.auditDate || null;
  if (!dateStr) return null;

  const status = (item.status || 'OPEN').toUpperCase();
  const past = isDatePast(dateStr);
  const nonEditable = isNonEditable(status, dateStr);

  const auditTypeStr = item.auditType || item.auditArea || 'Audit';
  const scheduleNo = item.scheduleNo || '';

  let bgColor = stringToDarkColor(auditTypeStr);
  let borderColor = bgColor;

  const startDt = combineDatetime(dateStr, item.startTime);
  const endDt = combineDatetime(dateStr, item.endTime);

  return {
    id: `audit-${item.id}`,
    title: `🔍 ${auditTypeStr}${scheduleNo ? ` - ${scheduleNo}` : ''}`,
    start: startDt ? startDt.toISOString() : dateStr,
    end: endDt ? endDt.toISOString() : undefined,
    allDay: !item.startTime,
    backgroundColor: bgColor,
    borderColor: borderColor,
    textColor: '#ffffff',
    editable: !nonEditable,
    classNames: nonEditable ? ['fc-event-disabled'] : [],
    extendedProps: {
      eventType: 'audit',
      originalId: item.id,
      scheduleNo: item.scheduleNo || '',
      auditType: item.auditType || '',
      auditArea: item.auditArea || '',
      department: item.department || '',
      auditDate: dateStr,
      startTime: item.startTime || '',
      endTime: item.endTime || '',
      frequency: item.frequency || '',
      auditor: typeof item.auditor === 'object' ? item.auditor?.employeeName : item.auditor || '',
      auditorObj: typeof item.auditor === 'object' ? { employeeName: item.auditor?.employeeName, imgName: item.auditor?.imgName || item.auditor?.photo } : item.auditor,
      auditee: typeof item.auditee === 'object' ? item.auditee?.employeeName : item.auditee || '',
      auditeeObj: typeof item.auditee === 'object' ? { employeeName: item.auditee?.employeeName, imgName: item.auditee?.imgName || item.auditee?.photo } : item.auditee,
      ncrApprovedBy: typeof item.ncrApprovedBy === 'object' ? item.ncrApprovedBy?.employeeName : item.ncrApprovedBy || '',
      ncrApprovedByObj: typeof item.ncrApprovedBy === 'object' ? { employeeName: item.ncrApprovedBy?.employeeName, imgName: item.ncrApprovedBy?.imgName || item.ncrApprovedBy?.photo } : item.ncrApprovedBy,
      auditMonth: item.auditMonth || '',
      status: status,
      isPast: past,
      isNonEditable: nonEditable
    }
  };
};

// ── ATS INTERVIEW → FullCalendar event ──
const interviewToEvent = (item) => {
  const dateStr = item.interviewDate || null;
  if (!dateStr) return null;

  const status = (item.status || 'ACTIVE').toUpperCase();
  if (status === 'INACTIVE' || item.isActive === false) {
    return null;
  }

  const normalizeTime = (t) => {
    if (!t) return '00:00:00';
    const parts = t.split(':');
    const h = parts[0].padStart(2, '0');
    const m = (parts[1] || '00').padStart(2, '0');
    const s = (parts[2] || '00').padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const startStr = `${dateStr}T${normalizeTime(item.startTime)}`;
  const endStr = item.endTime ? `${dateStr}T${normalizeTime(item.endTime)}` : undefined;

  return {
    id: `interview-${item.id}`,
    title: `🗣️ Interview: ${item.candidateName || 'Candidate'} - ${item.round || ''}`,
    start: startStr,
    end: endStr,
    allDay: !item.startTime,
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
    textColor: '#ffffff',
    editable: false,
    extendedProps: {
      eventType: 'interview',
      originalId: item.id,
      candidateId: item.employeeId,
      candidateName: item.candidateName,
      candidateCode: item.candidateCode, // ATS Applicant Code
      department: typeof item.department === 'object' ? (item.department?.departmentName || '-') : item.department || '-',
      designation: typeof item.designation === 'object' ? (item.designation?.designationName || '-') : item.designationName || '-',
      screeningLevel: item.screeningLevel,
      round: item.round,
      interviewer: item.interviewPerson,
      interviewerId: item.interviewerId,
      status: item.status,
      interviewDate: item.interviewDate,
      startTime: item.startTime,
      endTime: item.endTime,
      interviewStatus: typeof item.interviewStatus === 'object' ? item.interviewStatus.name : item.interviewStatus,
      interviewResult: typeof item.interviewResult === 'object' ? item.interviewResult.name : item.interviewResult,
      comments: item.comments
    }
  };
};

// ==============================|| SLICE - CALENDAR ||============================== //

const initialState = {
  error: null,
  events: []
};

const slice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    hasError(state, action) {
      state.error = action.payload;
    },
    getEventsSuccess(state, action) {
      state.events = action.payload;
    },
    addEventSuccess(state, action) {
      state.events.push(action.payload);
    },
    updateEventSuccess(state, action) {
      const updated = action.payload;
      state.events = state.events.map((e) => (e.id === updated.id ? { ...e, ...updated } : e));
    },
    removeEventSuccess(state, action) {
      state.events = state.events.filter((e) => e.id !== action.payload);
    }
  }
});

export default slice.reducer;

// ==============================|| SLICE - CALENDAR ACTIONS ||============================== //

/**
 * Fetches all calendar events: generic events + meeting schedules + audit schedules.
 * @param {object} globalFilters - Redux search filters (taskScope, memberId etc.)
 * @param {string} userId - Current logged-in user ID for scoped queries
 */
export const getEvents = (globalFilters = {}, userObj = null) => async () => {
  try {
    const scope = globalFilters.taskScope || 'Mine';
    const memberId = globalFilters.memberId && globalFilters.memberId !== 'All' ? globalFilters.memberId : undefined;
    const currentUsername = typeof userObj === 'string'
      ? userObj
      : (userObj?.userId || userObj?.username || userObj?.id || '');

    const meetingParams = {
      page: 0,
      size: 500,
      taskScope: scope,
      currentUser: currentUsername || undefined,
      memberId: memberId,
      includeDraft: true
    };

    const auditParams = {
      page: 0,
      size: 500,
      taskScope: scope,
      currentUser: currentUsername || undefined
    };

    const [genericRes, meetingRes, auditRes, interviewRes] = await Promise.allSettled([
      axios.get('/api/calendar/events', { skipGlobalAlert: true }),
      axios.get(API_PATHS.QMS.MEETING_SCHEDULES, { params: meetingParams, skipGlobalAlert: true }),
      axios.get(API_PATHS.QMS.AUDIT_SCHEDULE, { params: auditParams, skipGlobalAlert: true }),
      axios.get(API_PATHS.HRA.ALL_INTERVIEWS, { skipGlobalAlert: true })
    ]);

    const genericEvents = genericRes.status === 'fulfilled'
      ? normalizeList(genericRes.value?.data?.events || [])
      : [];

    const meetingContent = meetingRes.status === 'fulfilled'
      ? (meetingRes.value?.data?.content || [])
      : [];
    const meetingEvents = meetingContent.map(meetingToEvent).filter(Boolean);

    const auditContent = auditRes.status === 'fulfilled'
      ? (auditRes.value?.data?.content || [])
      : [];
    const auditEvents = auditContent.map(auditToEvent).filter(Boolean);

    const interviewContent = interviewRes.status === 'fulfilled'
      ? (interviewRes.value?.data || [])
      : [];
    let interviewEvents = interviewContent.map(interviewToEvent).filter(Boolean);
    if (scope === 'Mine' && userObj) {
      const cleanUser = String(currentUsername).toLowerCase().trim();
      const cleanName = String(userObj.name || userObj.employeeName || '').toLowerCase().trim();
      interviewEvents = interviewEvents.filter(ev => {
        const interviewer = String(ev.extendedProps?.interviewer || '').toLowerCase().trim();
        const interviewerId = String(ev.extendedProps?.interviewerId || '').toLowerCase().trim();
        return (cleanUser && interviewer === cleanUser) ||
               (cleanUser && interviewerId === cleanUser) ||
               (cleanName && interviewer && interviewer.includes(cleanName));
      });
    }

    const allEvents = [...genericEvents, ...meetingEvents, ...auditEvents, ...interviewEvents];
    dispatch(slice.actions.getEventsSuccess(allEvents));
  } catch (error) {
    dispatch(slice.actions.hasError(error));
  }
};

export const addEvent = (event) => async () => {
  try {
    const response = await axios.post('/api/calendar/events/add', event);
    const created = normalizeEvent(response.data?.event ?? event);
    dispatch(slice.actions.addEventSuccess(created));
  } catch (error) {
    dispatch(slice.actions.hasError(error));
  }
};

export const updateEvent = (event) => async () => {
  try {
    const response = await axios.post('/api/calendar/events/update', event);
    const updated = normalizeEvent(response.data?.event ?? event);
    dispatch(slice.actions.updateEventSuccess(updated));
  } catch (err) {
    dispatch(slice.actions.hasError(err));
  }
};

export const removeEvent = (id) => async () => {
  try {
    await axios.post('/api/calendar/events/delete', { id });
    dispatch(slice.actions.removeEventSuccess(id));
  } catch (err) {
    dispatch(slice.actions.hasError(err));
  }
};
