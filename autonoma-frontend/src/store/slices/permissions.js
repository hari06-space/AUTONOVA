import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'utils/axios';

/**
 * BOS Permission Slice
 *
 * Stores the current user's page-level permissions in Redux.
 * Fetched once on login, cached for the session lifetime.
 * Used by the sidebar MenuList to dynamically hide pages the user has no access to.
 */

// Async thunk: fetch all page authorizations for a user
export const fetchUserPermissions = createAsyncThunk('permissions/fetchUserPermissions', async (userId, { rejectWithValue }) => {
  try {
    const [authsRes, enabledIdsRes] = await Promise.all([
      axios.get(`/api/user-page-auth/${userId}`),
      axios.get(`/api/user-page-auth/${userId}/enabled-page-ids`)
    ]);
    return {
      auths: authsRes.data,
      enabledPageIds: enabledIdsRes.data
    };
  } catch (err) {
    return rejectWithValue(err?.message || 'Failed to fetch permissions');
  }
});

const permissionsSlice = createSlice({
  name: 'permissions',
  initialState: {
    /** @type {'idle'|'loading'|'loaded'|'error'} */
    status: 'idle',
    /** Raw auth array from API */
    auths: [],
    /** Lookup map: pageCode -> { enable, read, write, delete, export, approval, manager } */
    map: {},
    /** List of enabled pageIds */
    enabledPageIds: [],
    /** Lookup map: pageCode -> pageId */
    pageCodeToIdMap: {},
    error: null
  },
  reducers: {
    clearPermissions: (state) => {
      state.status = 'idle';
      state.auths = [];
      state.map = {};
      state.enabledPageIds = [];
      state.pageCodeToIdMap = {};
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserPermissions.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUserPermissions.fulfilled, (state, action) => {
        state.status = 'loaded';
        state.auths = action.payload.auths;
        state.enabledPageIds = action.payload.enabledPageIds || [];
        state.error = null;

        // Build the pageCode -> permissions lookup map & pageCode -> pageId mapping
        const map = {};
        const pageCodeToIdMap = {};
        if (Array.isArray(action.payload.auths)) {
          action.payload.auths.forEach((auth) => {
            const code = auth?.page?.pageCode;
            if (code) {
              map[code] = {
                enable: auth.enable === 1,
                read: auth.readAcs === 1,
                write: auth.write === 1,
                delete: auth.deleteAcs === 1,
                export: auth.export === 1,
                approval: auth.approval === 1,
                manager: auth.manager === 1
              };
              pageCodeToIdMap[code] = auth.pageId;
            }
          });
        }
        state.map = {
          ...map,
          _enabledPageIds: action.payload.enabledPageIds || [],
          _pageCodeToIdMap: pageCodeToIdMap
        };
        state.pageCodeToIdMap = pageCodeToIdMap;
      })
      .addCase(fetchUserPermissions.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload;
      });
  }
});

export const { clearPermissions } = permissionsSlice.actions;
export default permissionsSlice.reducer;
