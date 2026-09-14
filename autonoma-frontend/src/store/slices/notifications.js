import { createSlice } from '@reduxjs/toolkit';

// ─── Notifications Redux Slice ────────────────────────────────────────────────
// Manages: in-app notifications list, unread count, toast queue
// Prevents duplicates via seenIds Set (stored as Array for serialization)

const initialState = {
  notifications: [],   // AppNotification[] from backend
  seenIds: [],         // Track seen IDs to prevent duplicate toasts
  toastQueue: [],      // Queued premium toasts waiting to be shown
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications(state, action) {
      state.notifications = action.payload || [];
    },

    addOrUpdateNotification(state, action) {
      const notif = action.payload;
      if (!notif?.id) return;
      const idx = state.notifications.findIndex(n => n.id === notif.id);
      if (idx >= 0) {
        state.notifications[idx] = { ...state.notifications[idx], ...notif };
      } else {
        state.notifications.unshift(notif);
        // Cap at 200 entries — drop the oldest (tail) when exceeded
        if (state.notifications.length > 200) {
          state.notifications = state.notifications.slice(0, 200);
        }
      }
    },

    markRead(state, action) {
      const id = action.payload;
      const notif = state.notifications.find(n => n.id === id);
      if (notif) notif.isRead = true;
    },

    markAllRead(state) {
      state.notifications.forEach(n => { n.isRead = true; });
    },

    /** Add a notification to the toast display queue (prevents duplicates) */
    enqueueToast(state, action) {
      const notif = action.payload;
      if (!notif?.id) return;
      const idStr = String(notif.id);
      if (state.seenIds.includes(idStr)) return; // already shown
      state.seenIds.push(idStr);
      // Keep seenIds bounded to last 200 entries
      if (state.seenIds.length > 200) state.seenIds = state.seenIds.slice(-200);
      state.toastQueue.push({ ...notif, _toastId: idStr + '_' + Date.now() });
    },

    dequeueToast(state, action) {
      const toastId = action.payload;
      state.toastQueue = state.toastQueue.filter(t => t._toastId !== toastId);
    },

    clearToastQueue(state) {
      state.toastQueue = [];
    },
  }
});

export const {
  setNotifications,
  addOrUpdateNotification,
  markRead,
  markAllRead,
  enqueueToast,
  dequeueToast,
  clearToastQueue,
} = notificationsSlice.actions;

// Selectors
export const selectNotifications = state => state.notifications?.notifications ?? [];
export const selectUnreadCount = state =>
  (state.notifications?.notifications ?? []).filter(n => !n.isRead).length;
export const selectToastQueue = state => state.notifications?.toastQueue ?? [];

export default notificationsSlice.reducer;
