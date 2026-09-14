import { useEffect, useRef, useState, useCallback } from 'react';

import useMediaQuery from '@mui/material/useMediaQuery';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';

// third party
import FullCalendar from '@fullcalendar/react';
import listPlugin from '@fullcalendar/list';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import timelinePlugin from '@fullcalendar/timeline';
import interactionPlugin from '@fullcalendar/interaction';

// project imports
import Toolbar from './Toolbar';
import AddEventForm from './AddEventForm';
import CalendarStyled from './CalendarStyled';
import ScheduleDetailDialog from './ScheduleDetailDialog';
import CreateEventDispatcher from './CreateEventDispatcher';

import AddMeetingSchedule from 'modules/qms/MeetingSchedule/AddMeetingSchedule';

import Loader from 'ui-component/Loader';
import MainCard from 'ui-component/cards/MainCard';
import SubCard from 'ui-component/cards/SubCard';

import { dispatch, useSelector } from 'store';
import { getEvents, addEvent, updateEvent, removeEvent } from 'store/slices/calendar';
import { setFilterConfig } from 'store/slices/search';
import { addOrUpdateNotification, enqueueToast } from 'store/slices/notifications';
import useAuth from 'hooks/useAuth';

// ──────────────────────────────────────────────────────────────────────────────
// NOTIFICATION SCHEDULER
// Schedule browser/in-app notifications for upcoming QMS events
// Fires 1 minute before start time
// ──────────────────────────────────────────────────────────────────────────────
const notificationTimers = [];

const clearNotificationTimers = () => {
  notificationTimers.forEach((t) => clearTimeout(t));
  notificationTimers.length = 0;
};

const scheduleNotifications = (events) => {
  clearNotificationTimers();
  const now = Date.now();

  events.forEach((evt) => {
    const ext = evt.extendedProps || {};
    if (!ext.eventType) return; // skip generic events
    if (ext.isNonEditable) return; // skip past/closed

    const startMs = evt.start ? new Date(evt.start).getTime() : null;
    if (!startMs) return;

    // Timings
    const delay5Min = (startMs - 5 * 60 * 1000) - now;
    const delay30Sec = (startMs - 30 * 1000) - now;

    // Only process if event is strictly upcoming within next 24h
    if (startMs - now <= 0 || startMs - now > 24 * 60 * 60 * 1000) return;

    const isMeeting = ext.eventType === 'meeting';
    const isAudit = ext.eventType === 'audit';
    const isInterview = ext.eventType === 'interview';

    const title = isMeeting ? 'Meeting Reminder' : isAudit ? 'Audit Reminder' : 'Interview Reminder';
    const message = isMeeting
      ? `${ext.meetingType || ext.subject || 'Meeting'} (${ext.scheduleNo}) starts at ${ext.startTime}.`
      : isAudit
      ? `${ext.auditType || ext.auditArea || 'Audit'} (${ext.scheduleNo}) starts at ${ext.startTime}.`
      : `Interview with ${ext.candidateName || 'Candidate'} (${ext.round || 'Round'}) starts at ${ext.startTime}.`;

    const basePayload = {
      title,
      message,
      category: 'System',
      isRead: false,
    };

    // If the event is today and upcoming, ensure the base item is in the Bell Menu immediately
    const isToday = new Date(startMs).toDateString() === new Date(now).toDateString();
    if (isToday) {
      dispatch(addOrUpdateNotification({ ...basePayload, id: `sched-${ext.originalId}`, createdAt: new Date().toISOString() }));
    }

    // Schedule 1st Toast: 5 minutes before
    if (delay5Min > 0) {
      const timer5m = setTimeout(() => {
        const payload = { ...basePayload, id: `sched-${ext.originalId}-5m`, createdAt: new Date().toISOString(), title: `${title} (In 5 mins)` };
        dispatch(addOrUpdateNotification(payload));
        dispatch(enqueueToast(payload));
      }, delay5Min);
      notificationTimers.push(timer5m);
    }

    // Schedule 2nd Toast: 30 seconds before
    if (delay30Sec > 0) {
      const timer30s = setTimeout(() => {
        const payload = { ...basePayload, id: `sched-${ext.originalId}-30s`, createdAt: new Date().toISOString(), title: `${title} (Starting now)` };
        dispatch(addOrUpdateNotification(payload));
        dispatch(enqueueToast(payload));
      }, delay30Sec);
      notificationTimers.push(timer30s);
    }
  });
};

// ──────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ──────────────────────────────────────────────────────────────────────────────
export default function Calendar() {
  const calendarRef = useRef(null);
  const matchSm = useMediaQuery((theme) => theme.breakpoints.down('md'));
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);

  // Events + global filters from Redux
  const { events } = useSelector((state) => state.calendar);
  const globalFilters = useSelector((state) => state.search?.filters) || {};

  // ── Register Global Filter Config: Scope ──
  useEffect(() => {
    dispatch(setFilterConfig([
      {
        id: 'taskScope',
        label: 'Scope',
        type: 'select',
        isStarred: true,
        defaultValue: 'Mine',
        options: [
          { value: 'Mine', label: 'Mine' },
          { value: 'Team', label: 'My Team' },
          { value: 'Company', label: 'Company' }
        ]
      }
    ]));

    return () => {
      dispatch(setFilterConfig(null));
      clearNotificationTimers();
    };
  }, []);

  // ── Fetch events whenever scope filter changes ──
  useEffect(() => {
    setLoading(true);
    dispatch(getEvents(globalFilters, user)).finally(() => setLoading(false));
  }, [globalFilters, user]);

  // ── Schedule notifications whenever events change ──
  useEffect(() => {
    if (events && events.length > 0) {
      scheduleNotifications(events);
    }
  }, [events]);

  const [date, setDate] = useState(new Date());
  const [view, setView] = useState(matchSm ? 'listWeek' : 'dayGridMonth');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dispatcherOpen, setDispatcherOpen] = useState(false);
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState(null);
  const [selectedGenericEvent, setSelectedGenericEvent] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);
  const [slotDuration, setSlotDuration] = useState('00:30:00');
  const [currentViewRange, setCurrentViewRange] = useState({ start: null, end: null });

  // ── Detail dialog state: QMS event detail ──
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedQmsEvent, setSelectedQmsEvent] = useState(null);

  // ── Toolbar handlers ──
  const handleDateToday = () => {
    const calendarEl = calendarRef.current?.getApi();
    calendarEl?.today();
    setDate(calendarEl?.getDate() ?? new Date());
  };

  const handleDateSet = (newDate) => {
    const calendarEl = calendarRef.current?.getApi();
    calendarEl?.gotoDate(newDate);
    setDate(calendarEl?.getDate() ?? newDate);
  };

  const handleViewChange = useCallback((newView) => {
    const calendarEl = calendarRef.current?.getApi();
    calendarEl?.changeView(newView);
    setView(newView);
  }, []);

  useEffect(() => {
    handleViewChange(matchSm ? 'listWeek' : 'dayGridMonth');
  }, [matchSm, handleViewChange]);

  const handleDatePrev = () => {
    const calendarEl = calendarRef.current?.getApi();
    calendarEl?.prev();
    setDate(calendarEl?.getDate() ?? new Date());
  };

  const handleDateNext = () => {
    const calendarEl = calendarRef.current?.getApi();
    calendarEl?.next();
    setDate(calendarEl?.getDate() ?? new Date());
  };

  // ── Event interactions ──
  const handleRangeSelect = (arg) => {
    calendarRef.current?.getApi().unselect();
    setSelectedRange({ start: arg.start, end: arg.end });
    setSelectedGenericEvent(null);
    setDispatcherOpen(true);
  };

  const handleEventSelect = (arg) => {
    const ext = arg.event.extendedProps || {};

    if (ext.eventType === 'meeting' || ext.eventType === 'audit' || ext.eventType === 'interview') {
      // QMS event → show rich detail dialog
      const found = events.find((e) => e.id === arg.event.id);
      setSelectedQmsEvent(found ?? null);
      setDetailDialogOpen(true);
    } else {
      // Generic calendar event → show edit form
      const found = events.find((e) => e.id === arg.event.id);
      setSelectedGenericEvent(found ?? null);
      setSelectedRange(null);
      setIsModalOpen(true);
    }
  };

  // Prevent drag/drop for non-editable events
  const handleEventAllow = useCallback((dropInfo, draggedEvent) => {
    const ext = draggedEvent?.extendedProps || {};
    return !ext.isNonEditable;
  }, []);

  const handleEventUpdate = ({ event }) => {
    const ext = event.extendedProps || {};
    if (ext.isNonEditable) return; // safety guard
    dispatch(
      updateEvent({
        id: event.id,
        title: event.title,
        allDay: event.allDay,
        start: event.start ? event.start.toISOString() : undefined,
        end: event.end ? event.end.toISOString() : undefined
      })
    );
  };

  // ── Generic event modal actions ──
  const handleEventCreate = (data) => {
    const payload = {
      ...data,
      start: data.start instanceof Date ? data.start.toISOString() : data.start,
      end: data.end instanceof Date ? data.end.toISOString() : data.end
    };
    dispatch(addEvent(payload));
    handleModalClose();
  };

  const handleUpdateEvent = (eventId, update) => {
    const payload = {
      id: eventId,
      ...update,
      start: update.start instanceof Date ? update.start.toISOString() : update.start,
      end: update.end instanceof Date ? update.end.toISOString() : update.end
    };
    dispatch(updateEvent(payload));
    handleModalClose();
  };

  const handleEventDelete = (id) => {
    dispatch(removeEvent(id));
    handleModalClose();
  };

  const handleAddClick = () => {
    setSelectedGenericEvent(null);
    setSelectedRange(null);
    setDispatcherOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedGenericEvent(null);
    setSelectedRange(null);
  };

  // ── Style non-editable events visually ──
  const handleEventDidMount = (info) => {
    const ext = info.event.extendedProps || {};
    if (ext.isNonEditable) {
      info.el.style.opacity = '0.7';
      info.el.style.cursor = 'pointer';
      info.el.title = ext.isPast ? 'Past schedule (read-only)' : 'Closed/Cancelled (read-only)';
    }
  };

  if (loading) return <Loader />;

  return (
    <MainCard
      title="Event Calendar"
      sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}
      contentSX={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: matchSm ? 1 : 2, overflow: 'hidden' }}
      secondary={
        <Button color="secondary" variant="contained" onClick={handleAddClick}>
          + New
        </Button>
      }
    >
      <CalendarStyled sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Toolbar
          date={date}
          view={view}
          onClickNext={handleDateNext}
          onClickPrev={handleDatePrev}
          onClickToday={handleDateToday}
          onChangeView={handleViewChange}
          onChangeDate={handleDateSet}
          slotDuration={slotDuration}
          onSlotDurationChange={setSlotDuration}
        />
        <SubCard sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }} contentSX={{ p: 0, flexGrow: 1 }}>
          <FullCalendar
            ref={calendarRef}
            plugins={[listPlugin, dayGridPlugin, timelinePlugin, timeGridPlugin, interactionPlugin]}
            initialView={view}
            initialDate={date}
            slotDuration={slotDuration}
            events={activeFilter ? events.filter(e => {
              if (activeFilter === 'Closed/Past') return e.extendedProps?.isNonEditable;
              const label = e.extendedProps?.eventType === 'interview'
                ? 'Interview'
                : (e.extendedProps?.meetingType || e.extendedProps?.auditType || e.extendedProps?.auditArea || e.title || 'Event');
              return label === activeFilter;
            }) : events}
            selectable
            editable
            droppable
            weekends
            height="100%"
            expandRows={true}
            slotEventOverlap={false}
            eventDisplay="block"
            headerToolbar={false}
            allDayMaintainDuration
            eventResizableFromStart
            select={handleRangeSelect}
            eventDrop={handleEventUpdate}
            eventClick={handleEventSelect}
            eventResize={handleEventUpdate}
            eventAllow={handleEventAllow}
            eventDidMount={handleEventDidMount}
            eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
            dayMaxEvents={3}
            moreLinkClick="popover"
            datesSet={(arg) => setCurrentViewRange({ start: arg.start, end: arg.end })}
          />
        </SubCard>

        {/* Legend */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1, px: matchSm ? 1 : 2 }}>
          {Array.from(new Map(
            events
              .filter(e => {
                if (!e.backgroundColor && !e.color) return false;
                if (!currentViewRange.start || !currentViewRange.end) return true;
                const eStart = new Date(e.start);
                const eEnd = e.end ? new Date(e.end) : eStart;
                return eStart < currentViewRange.end && eEnd >= currentViewRange.start;
              })
              .map(e => {
                const label = e.extendedProps?.eventType === 'interview'
                  ? 'Interview'
                  : (e.extendedProps?.meetingType || e.extendedProps?.auditType || e.extendedProps?.auditArea || e.title || 'Event');
                return [label, e.backgroundColor || e.color];
              })
          ).entries()).map(([label, color]) => (
             <Chip 
               key={label} 
               label={label} 
               onClick={() => setActiveFilter(activeFilter === label ? null : label)}
               variant={activeFilter === null || activeFilter === label ? 'filled' : 'outlined'}
               sx={{ 
                 backgroundColor: activeFilter === null || activeFilter === label ? color : 'transparent', 
                 borderColor: color,
                 color: activeFilter === null || activeFilter === label ? '#fff' : color, 
                 fontWeight: 500,
                 cursor: 'pointer',
                 transition: 'all 0.2s ease-in-out',
                 '&:hover': { transform: 'scale(1.05)' }
               }} 
               size="small" 
             />
          ))}
          <Chip 
            label="Closed/Past" 
            onClick={() => setActiveFilter(activeFilter === 'Closed/Past' ? null : 'Closed/Past')}
            variant={activeFilter === null || activeFilter === 'Closed/Past' ? 'filled' : 'outlined'}
            sx={{ 
              backgroundColor: activeFilter === null || activeFilter === 'Closed/Past' ? '#78909c' : 'transparent', 
              borderColor: '#78909c',
              color: activeFilter === null || activeFilter === 'Closed/Past' ? '#fff' : '#78909c', 
              fontWeight: 500, 
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': { transform: 'scale(1.05)' }
            }} 
            size="small" 
          />
        </Box>
      </CalendarStyled>

      {/* Generic event create/edit dialog */}
      <Dialog maxWidth="sm" fullWidth onClose={handleModalClose} open={isModalOpen} slotProps={{ paper: { sx: { p: 0 } } }}>
        {isModalOpen && (
          <AddEventForm
            event={selectedGenericEvent}
            range={selectedRange}
            onCancel={handleModalClose}
            handleDelete={handleEventDelete}
            handleCreate={handleEventCreate}
            handleUpdate={handleUpdateEvent}
          />
        )}
      </Dialog>

      {/* QMS Schedule detail dialog */}
      <ScheduleDetailDialog
        open={detailDialogOpen}
        event={selectedQmsEvent}
        onClose={() => { setDetailDialogOpen(false); setSelectedQmsEvent(null); }}
      />

      {/* Creation Dispatcher */}
      <CreateEventDispatcher
        open={dispatcherOpen}
        onClose={() => setDispatcherOpen(false)}
        selectedRange={selectedRange}
        onSelectGeneric={() => setIsModalOpen(true)}
        onSelectMeeting={() => setMeetingDialogOpen(true)}
      />

      {/* Embedded Creation Dialogs */}
      {meetingDialogOpen && (
        <AddMeetingSchedule
          open={meetingDialogOpen}
          onClose={() => setMeetingDialogOpen(false)}
          onSave={() => dispatch(getEvents(globalFilters, user?.id))}
          readOnly={false}
        />
      )}
    </MainCard>
  );
}
