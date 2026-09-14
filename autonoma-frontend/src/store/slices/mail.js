// third-party
import { createSlice } from '@reduxjs/toolkit';

// project imports
import axios from 'utils/axios';
import { dispatch } from '../index';

// ==============================|| SLICE - MAIL ||============================== //

const initialState = {
  error: null,
  mails: [],
  unreadCount: undefined
};

const slice = createSlice({
  name: 'mail',
  initialState,
  reducers: {
    hasError(state, action) {
      state.error = action.payload;
    },
    getMailsSuccess(state, action) {
      state.mails = action.payload.mails;
      state.unreadCount = action.payload.unreadCount;
    },
    filterMailsSuccess(state, action) {
      state.mails = action.payload;
    }
  }
});

// Reducer
export default slice.reducer;

// ==============================|| SLICE - MAIL ACTIONS ||============================== //

export function getMails() {
  return async () => {
    try {
      // Fetch real sent RFQ email logs from backend
      const response = await axios.get('/api/v1/rfq/email-logs');
      const rawMails = response.data || [];

      // Normalize the data into mail format
      const mails = rawMails.map((item, index) => ({
        id: String(item.id || index),
        isRead: true,
        important: false,
        starred: false,
        attach: true,
        time: item.sentDate ? new Date(item.sentDate).getTime() : Date.now(),
        profile: {
          name: item.toEmail || 'Supplier',
          avatar: null
        },
        subject: item.subject || 'RFQ Email',
        message: item.content || '',
        rfqNo: item.rfqNo || '',
        sentBy: item.sentByName || item.sentBy || '',
        fromEmail: item.fromEmail || '',
        toEmail: item.toEmail || '',
        ccEmail: item.ccEmail || '',
        isRfqMail: true
      }));

      const unreadCount = mails.filter((m) => !m.isRead).length;
      dispatch(slice.actions.getMailsSuccess({ mails, unreadCount }));
    } catch {
      // If backend not available, show empty state
      dispatch(slice.actions.getMailsSuccess({ mails: [], unreadCount: 0 }));
    }
  };
}

export function filterMails(filter) {
  return async () => {
    try {
      const response = await axios.get('/api/v1/rfq/email-logs');
      const rawMails = response.data || [];
      const mails = rawMails.map((item, index) => ({
        id: String(item.id || index),
        isRead: true,
        important: filter === 'important',
        starred: filter === 'starred',
        attach: true,
        time: item.sentDate ? new Date(item.sentDate).getTime() : Date.now(),
        profile: { name: item.toEmail || 'Supplier', avatar: null },
        subject: item.subject || 'RFQ Email',
        message: item.content || '',
        rfqNo: item.rfqNo || '',
        sentBy: item.sentByName || item.sentBy || '',
        fromEmail: item.fromEmail || '',
        toEmail: item.toEmail || '',
        ccEmail: item.ccEmail || '',
        isRfqMail: true
      }));
      dispatch(slice.actions.filterMailsSuccess(mails));
    } catch {
      dispatch(slice.actions.filterMailsSuccess([]));
    }
  };
}

export function setImportant() {
  return async () => {};
}

export function setStarred() {
  return async () => {};
}

export function setRead() {
  return async () => {};
}
