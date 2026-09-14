import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'utils/axios';
import useAuth from 'hooks/useAuth';
import useRealtimeRefresh from 'hooks/useRealtimeRefresh';
import meetingAlarmAudio from 'utils/meetingAlarmSound';

const STORAGE_PREFIX = 'autonoma_meeting_alarm_dismissed_';
const BC_NAME = 'autonoma_meeting_alarm_channel';
const AUTO_DISMISS_SECONDS = 30;

// Helper: parse HH:mm or HH:mm:ss string to total seconds from midnight
const timeToSeconds = (timeVal) => {
  if (!timeVal) return null;
  if (Array.isArray(timeVal)) {
    const [h, m, s = 0] = timeVal;
    return Number(h) * 3600 + Number(m) * 60 + Number(s);
  }
  const parts = String(timeVal).split(':').map(Number);
  return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
};

export default function useMeetingAlarmWatcher() {
  const { isLoggedIn, user } = useAuth();
  const [todayMeetings, setTodayMeetings] = useState([]);
  const [activeAlarm, setActiveAlarm] = useState(null); // The meeting currently sounding alarm
  const [secondsRemaining, setSecondsRemaining] = useState(AUTO_DISMISS_SECONDS);
  const [meetingCountdownSeconds, setMeetingCountdownSeconds] = useState(0); // seconds until meeting starts
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // Interval trigger history for current session: { [scheduleId]: Set of interval indices triggered (0, 1, 2, 3) }
  const intervalTrackerRef = useRef({});
  const lastStartTimeRef = useRef({});
  const broadcastChannelRef = useRef(null);

  const getUserIdentifier = useCallback(() => {
    return user?.userId || user?.username || user?.empId || user?.id || user?.userName || user?.email || 'guest';
  }, [user]);

  // Reset interval tracker when user changes
  useEffect(() => {
    intervalTrackerRef.current = {};
    setActiveAlarm(null);
  }, [user?.userId, user?.username, user?.empId, user?.id, user?.userName]);

  // Helper: check if schedule is permanently dismissed for CURRENT user
  const isScheduleDismissed = useCallback((scheduleId, dateStr) => {
    try {
      const userKey = getUserIdentifier();
      const key = `${STORAGE_PREFIX}${userKey}_${scheduleId}_${dateStr}`;
      return !!localStorage.getItem(key);
    } catch {
      return false;
    }
  }, [getUserIdentifier]);

  // Helper: permanently dismiss schedule for CURRENT user
  const markScheduleDismissed = useCallback((scheduleId, dateStr) => {
    try {
      const userKey = getUserIdentifier();
      const key = `${STORAGE_PREFIX}${userKey}_${scheduleId}_${dateStr}`;
      localStorage.setItem(key, 'true');
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({ type: 'DISMISSED', scheduleId, userKey });
      }
      // Call backend ack in background
      axios.post(`/api/qms/meeting-schedules/${scheduleId}/acknowledge-reminder`).catch(() => {});
    } catch (e) {
      console.warn('Failed to mark meeting alarm dismissed:', e);
    }
  }, [getUserIdentifier]);

  // ── STRICT AUDIO CONTROL BOUND TO ACTIVE ALARM STATE ──
  useEffect(() => {
    if (activeAlarm) {
      meetingAlarmAudio.startAlarm();
    } else {
      meetingAlarmAudio.stopAlarm();
    }
    return () => {
      meetingAlarmAudio.stopAlarm();
    };
  }, [activeAlarm]);

  // Fetch today's meetings for user
  const fetchTodayMeetings = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const params = {};
      const empId = user?.empId || user?.employeeId;
      if (empId) {
        params.employeeId = empId;
      }
      const res = await axios.get('/api/qms/meeting-schedules/today-alarms', { params });
      if (Array.isArray(res.data)) {
        setTodayMeetings(res.data);
      }
    } catch (err) {
      console.warn('[MeetingAlarm] Failed to fetch today alarms:', err);
    }
  }, [isLoggedIn, user?.empId, user?.employeeId]);

  // Initial fetch and continuous 10s background heartbeat sync
  useEffect(() => {
    if (!isLoggedIn) return;
    fetchTodayMeetings();

    // 10-second silent background poll for real-time accuracy without refresh
    const syncTimer = setInterval(() => {
      fetchTodayMeetings();
    }, 10000);

    // Instant sync on tab focus or visibility change
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchTodayMeetings();
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      clearInterval(syncTimer);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [isLoggedIn, fetchTodayMeetings]);

  useRealtimeRefresh(fetchTodayMeetings, 'QmsMeetingSchedule');
  useRealtimeRefresh(fetchTodayMeetings, 'MeetingSchedule');
  useRealtimeRefresh(fetchTodayMeetings, 'QmsScheduleMeetingConfig');

  // Multi-tab sync via BroadcastChannel & Storage Event
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(BC_NAME);
      broadcastChannelRef.current = bc;
      bc.onmessage = (event) => {
        if (event?.data?.type === 'DISMISSED') {
          const dismissedId = event.data.scheduleId;
          const targetUserKey = event.data.userKey;
          const currentUserKey = getUserIdentifier();
          if (!targetUserKey || targetUserKey === currentUserKey) {
            setActiveAlarm((current) => {
              if (current && current.scheduleId === dismissedId) {
                return null;
              }
              return current;
            });
          }
        }
      };
      return () => {
        bc.close();
      };
    }
  }, [getUserIdentifier]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key && e.key.startsWith(STORAGE_PREFIX)) {
        const currentUserKey = getUserIdentifier();
        const expectedPrefix = `${STORAGE_PREFIX}${currentUserKey}_`;
        if (e.key.startsWith(expectedPrefix)) {
          const parts = e.key.replace(expectedPrefix, '').split('_');
          const schId = Number(parts[0]);
          setActiveAlarm((current) => {
            if (current && Number(current.scheduleId) === schId) {
              return null;
            }
            return current;
          });
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [getUserIdentifier]);

  // Main Background Ticker: runs every 1 second
  useEffect(() => {
    if (!isLoggedIn || !todayMeetings || todayMeetings.length === 0) {
      if (activeAlarm) setActiveAlarm(null);
      return;
    }

    const ticker = setInterval(() => {
      const now = new Date();
      const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const todayStr = `${y}-${m}-${d}`;

      // If an alarm is already active on screen, tick down the 30-second auto-dismiss and meeting countdown
      if (activeAlarm) {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            // 30 seconds auto-dismiss expired -> Auto close popup and stop audio!
            setActiveAlarm(null);
            return 0;
          }
          return prev - 1;
        });

        const startSec = timeToSeconds(activeAlarm.startTime);
        if (startSec != null) {
          const diff = startSec - currentSeconds;
          setMeetingCountdownSeconds(Math.max(0, diff));
        }
        return;
      }

      // Check all meetings for today
      for (const meeting of todayMeetings) {
        const scheduleId = meeting.scheduleId;
        const meetingDate = meeting.meetingDate || todayStr;

        // Skip if permanently dismissed
        if (isScheduleDismissed(scheduleId, meetingDate)) {
          continue;
        }

        const startSec = timeToSeconds(meeting.startTime);
        if (startSec == null) continue;

        // If meeting start time was changed/rescheduled, reset interval tracker for instant trigger
        if (lastStartTimeRef.current[scheduleId] !== startSec) {
          lastStartTimeRef.current[scheduleId] = startSec;
          intervalTrackerRef.current[scheduleId] = new Set();
        }

        const diffSeconds = startSec - currentSeconds;

        // Trigger window: between 10 minutes (600s) before start and up to 5 minutes after start
        if (diffSeconds <= 600 && diffSeconds >= -300) {
          // Determine interval slot index (0 = 10m, 1 = 7m, 2 = 4m, 3 = 1m)
          let intervalSlot = 0;
          if (diffSeconds <= 60) intervalSlot = 3;
          else if (diffSeconds <= 240) intervalSlot = 2;
          else if (diffSeconds <= 420) intervalSlot = 1;
          else intervalSlot = 0;

          if (!intervalTrackerRef.current[scheduleId]) {
            intervalTrackerRef.current[scheduleId] = new Set();
          }

          const triggeredSlots = intervalTrackerRef.current[scheduleId];

          if (!triggeredSlots.has(intervalSlot)) {
            // Trigger alarm popup for this interval!
            triggeredSlots.add(intervalSlot);
            setActiveAlarm(meeting);
            setSecondsRemaining(AUTO_DISMISS_SECONDS);
            setMeetingCountdownSeconds(Math.max(0, diffSeconds));
            break;
          }
        }
      }
    }, 1000);

    return () => clearInterval(ticker);
  }, [isLoggedIn, todayMeetings, activeAlarm, isScheduleDismissed]);

  // Dismiss Permanently (Manual Close button)
  const handleClose = useCallback(() => {
    if (!activeAlarm) return;
    const { scheduleId, meetingDate } = activeAlarm;
    markScheduleDismissed(scheduleId, meetingDate || new Date().toISOString().substring(0, 10));
    setActiveAlarm(null);
  }, [activeAlarm, markScheduleDismissed]);

  // Mark Attendance action
  const handleMarkAttendance = useCallback((navigate) => {
    if (!activeAlarm) return;
    const { scheduleId, meetingDate } = activeAlarm;
    markScheduleDismissed(scheduleId, meetingDate || new Date().toISOString().substring(0, 10));
    setActiveAlarm(null);

    if (navigate) {
      navigate(`/qms/meeting-attendance?scheduleId=${scheduleId}`);
    }
  }, [activeAlarm, markScheduleDismissed]);

  // Audio Toggle
  const toggleMute = useCallback(() => {
    const muted = meetingAlarmAudio.toggleMute();
    setIsAudioMuted(muted);
  }, []);

  return {
    activeAlarm,
    secondsRemaining,
    meetingCountdownSeconds,
    isAudioMuted,
    toggleMute,
    handleClose,
    handleMarkAttendance
  };
}
