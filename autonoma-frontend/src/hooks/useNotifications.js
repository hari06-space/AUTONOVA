/**
 * useNotifications — Centralized real-time notification hook
 *
 * Responsibilities:
 *  - Fetch initial notifications from REST API
 *  - Connect to STOMP WebSocket for real-time push delivery
 *  - Prevent duplicate WS connections (BroadcastChannel leader election)
 *  - Auto-reconnect with exponential backoff
 *  - Dispatch to Redux store (deduplication handled there)
 *  - Expose: notifications, unreadCount, markRead, markAllRead, isConnected
 *
 * Architecture:
 *  The hook is designed to be used ONCE at the app level (in NotificationSection).
 *  The Redux store is the single source of truth for all notification data.
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'store';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axiosServices from 'utils/axios';
import useAuth from 'hooks/useAuth';
import useConfig from 'hooks/useConfig';
import {
  setNotifications,
  addOrUpdateNotification,
  markRead as markReadAction,
  markAllRead as markAllReadAction,
  enqueueToast,
  selectNotifications,
  selectUnreadCount,
} from 'store/slices/notifications';

// BroadcastChannel name for multi-tab leader election
const BC_CHANNEL = 'bos-notifications-leader';
const BC_HEARTBEAT_MS = 5000;
const WS_RECONNECT_DELAY_MS = 5000;

export default function useNotifications() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);
  const { state: configState } = useConfig();
  const allowNotifications = configState.allowNotifications ?? true;
  const dndMode = configState.dndMode ?? false;

  const stompClientRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const isLeaderRef = useRef(false);
  const bcRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const fetchedRef = useRef(false);

  // ─── Helper: get empId ───────────────────────────────────────────────────────
  const getEmpId = useCallback(() => {
    if (!user) return null;
    if (user.empId !== undefined && user.empId !== null && user.empId !== 0) {
      return user.empId;
    }
    return user.empId || null;
  }, [user]);

  // ─── Toast Buffering ────────────────────────────────────────────────────────
  const toastBuffer = useRef([]);
  const toastTimer = useRef(null);

  const processToastBuffer = useCallback(() => {
    const items = toastBuffer.current;
    toastBuffer.current = [];
    if (items.length === 0) return;

    if (items.length <= 5) {
      items.forEach(n => dispatch(enqueueToast(n)));
    } else {
      // Group them by heading
      const groups = {};
      items.forEach(n => {
        let heading = 'Notifications';
        if (n.title) {
          const colonIdx = n.title.indexOf(':');
          if (colonIdx > 0) {
            heading = n.title.substring(0, colonIdx).trim();
          } else {
            heading = n.title;
          }
        }
        groups[heading] = (groups[heading] || 0) + 1;
      });

      const summaryLines = Object.entries(groups).map(([heading, count]) => `${heading}: ${count}`);
      const summaryMessage = summaryLines.join('\n');

      const summaryNotif = {
        id: 'summary-' + Date.now(),
        title: `${items.length} New Updates Received`,
        message: summaryMessage,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      
      dispatch(enqueueToast(summaryNotif));
    }
  }, [dispatch]);

  const queueForToast = useCallback((n) => {
    if (!allowNotifications || dndMode) return;
    toastBuffer.current.push(n);
    if (!toastTimer.current) {
      toastTimer.current = setTimeout(() => {
        toastTimer.current = null;
        processToastBuffer();
      }, 500);
    }
  }, [allowNotifications, dndMode, processToastBuffer]);

  const seenToastsRef = useRef(new Set());

  // ─── Fetch notifications from REST ──────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    const empId = getEmpId();
    if (empId === null) return;
    try {
      const res = await axiosServices.get(`/api/notifications/all/${empId}`);
      if (res?.data) {
        const data = Array.isArray(res.data) ? res.data : [];
        dispatch(setNotifications(data));
        // Enqueue toasts for new unread items not yet seen
        data.forEach(n => {
          if (!n.isRead) {
            const seenKey = `bos_toast_v3_${n.id}`;
            const isAlreadyToasted = localStorage.getItem(seenKey) || seenToastsRef.current.has(n.id);
            if (!isAlreadyToasted && document.visibilityState === 'visible') {
              localStorage.setItem(seenKey, '1');
              seenToastsRef.current.add(n.id);
              queueForToast(n);
            }
          }
        });
      }
    } catch (e) {
      console.error('[useNotifications] fetch failed:', e?.message);
    }
  }, [dispatch, getEmpId, queueForToast]);

  // ─── Handle incoming real-time notification ──────────────────────────────────
  const handleIncoming = useCallback((notif) => {
    if (!notif?.id) return;
    dispatch(addOrUpdateNotification(notif));
    if (!notif.isRead) {
      const seenKey = `bos_toast_v3_${notif.id}`;
      const isAlreadyToasted = localStorage.getItem(seenKey) || seenToastsRef.current.has(notif.id);
      if (!isAlreadyToasted && document.visibilityState === 'visible') {
        localStorage.setItem(seenKey, '1');
        seenToastsRef.current.add(notif.id);
        queueForToast(notif);
      }
    }
  }, [dispatch, queueForToast]);

  // ─── STOMP WebSocket connection ──────────────────────────────────────────────
  const connectStomp = useCallback(() => {
    if (stompClientRef.current?.active) return;
    const token = sessionStorage.getItem('serviceToken') || localStorage.getItem('serviceToken');
    if (!token) return;

    const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${baseUrl}/ws/signaling`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: WS_RECONNECT_DELAY_MS,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: () => { },
      onConnect: () => {
        setIsConnected(true);
        // Subscribe to recipient specific queue
        client.subscribe('/user/queue/notifications', (message) => {
          try {
            const notif = JSON.parse(message.body);
            handleIncoming(notif);
            fetchNotifications();
            if (bcRef.current) {
              bcRef.current.postMessage({ type: 'NOTIFICATION_RECEIVED', payload: notif });
            }
            window.dispatchEvent(new CustomEvent('bos-realtime-update', { detail: notif }));
          } catch (e) {
            console.error('[useNotifications] WS parse error:', e);
          }
        });

        // Subscribe to global realtime updates for system-wide sync across all users
        client.subscribe('/topic/global-updates', (message) => {
          try {
            const data = JSON.parse(message.body);
            if (data && typeof data === 'object') {
              if (data.type === 'SESSION_REVOKED') {
                window.dispatchEvent(new CustomEvent('bos-session-revoked', { detail: data }));
              }
              const currentEmpId = getEmpId();
              const isRecipient = currentEmpId != null && data.recipientEmpId != null && String(data.recipientEmpId) === String(currentEmpId);
              if (isRecipient) {
                handleIncoming(data);
              }
            }
            fetchNotifications();
            if (bcRef.current) {
              bcRef.current.postMessage({ type: 'GLOBAL_UPDATE_RECEIVED', payload: data });
            }
            window.dispatchEvent(new CustomEvent('bos-realtime-update', { detail: data }));
          } catch (e) {
            window.dispatchEvent(new CustomEvent('bos-realtime-update', { detail: message.body }));
          }
        });

        // Subscribe to user-specific session events (takeover / force logout)
        const currentUid = user?.userId || user?.id || user?.username;
        if (currentUid) {
          client.subscribe(`/topic/session-events/${currentUid}`, (message) => {
            try {
              const data = JSON.parse(message.body);
              window.dispatchEvent(new CustomEvent('bos-session-revoked', { detail: data }));
            } catch (e) {
              console.error('[useNotifications] Session event parse error:', e);
            }
          });
        }
      },
      onDisconnect: () => setIsConnected(false),
      onStompError: () => setIsConnected(false),
    });

    client.activate();
    stompClientRef.current = client;
  }, [handleIncoming, fetchNotifications, getEmpId]);

  // ─── Multi-tab leader election via BroadcastChannel ─────────────────────────
  useEffect(() => {
    if (!user) return;

    let bc;
    try {
      bc = new BroadcastChannel(BC_CHANNEL);
      bcRef.current = bc;

      // Announce candidacy
      bc.postMessage({ type: 'CANDIDATE' });

      let lastSeen = Date.now();
      bc.onmessage = (e) => {
        if (e.data?.type === 'HEARTBEAT') {
          lastSeen = Date.now();
          if (isLeaderRef.current) {
            isLeaderRef.current = false;
          }
        } else if (e.data?.type === 'NOTIFICATION_RECEIVED') {
          if (e.data.payload) handleIncoming(e.data.payload);
          fetchNotifications();
        } else if (e.data?.type === 'GLOBAL_UPDATE_RECEIVED') {
          fetchNotifications();
          window.dispatchEvent(new CustomEvent('bos-realtime-update', { detail: e.data?.payload }));
        }
      };

      // Check heartbeat & decide leadership
      const electionTimeout = setTimeout(() => {
        if (Date.now() - lastSeen >= 200) {
          isLeaderRef.current = true;
          heartbeatIntervalRef.current = setInterval(() => {
            bc.postMessage({ type: 'HEARTBEAT' });
          }, BC_HEARTBEAT_MS);
          connectStomp();
        }
        fetchNotifications();
      }, 200);

      return () => {
        clearTimeout(electionTimeout);
      };
    } catch {
      // BroadcastChannel not supported — just connect directly
      isLeaderRef.current = true;
      connectStomp();
      fetchNotifications();
    }
  }, [user, getEmpId, connectStomp, fetchNotifications, handleIncoming]);

  // ─── Real-time Event Listener & Polling ──────────────────────────────────────
  useEffect(() => {
    if (!user || getEmpId() === null) return;

    fetchNotifications();

    let debouncedTimer = null;
    const handleRealtimeUpdate = (event) => {
      if (event?.detail && typeof event.detail === 'object' && event.detail.recipientEmpId) {
        if (String(event.detail.recipientEmpId) === String(getEmpId())) {
          handleIncoming(event.detail);
        }
      }
      if (debouncedTimer) clearTimeout(debouncedTimer);
      debouncedTimer = setTimeout(() => {
        fetchNotifications();
      }, 300);
    };

    window.addEventListener('bos-realtime-update', handleRealtimeUpdate);

    // Periodic poll (every 30s) as backup to WebSocket STOMP
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    }, 30000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
        if (isLeaderRef.current && (!stompClientRef.current || !stompClientRef.current.active)) {
          connectStomp();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      if (debouncedTimer) clearTimeout(debouncedTimer);
      window.removeEventListener('bos-realtime-update', handleRealtimeUpdate);
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [user, getEmpId, fetchNotifications, handleIncoming]);

  // ─── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stompClientRef.current?.deactivate().catch(() => { });
      bcRef.current?.close();
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    };
  }, []);

  // ─── Actions ─────────────────────────────────────────────────────────────────
  const markRead = useCallback(async (id) => {
    dispatch(markReadAction(id));
    try {
      await axiosServices.put(`/api/notifications/${id}/read`);
    } catch (e) {
      console.error('[useNotifications] markRead failed:', e?.message);
    }
  }, [dispatch]);

  const markAllRead = useCallback(async () => {
    const empId = getEmpId();
    if (empId === null) return;
    dispatch(markAllReadAction());
    try {
      await axiosServices.put(`/api/notifications/read-all/${empId}`);
    } catch (e) {
      console.error('[useNotifications] markAllRead failed:', e?.message);
    }
  }, [dispatch, getEmpId]);

  const refresh = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isConnected,
    markRead,
    markAllRead,
    refresh,
  };
}
