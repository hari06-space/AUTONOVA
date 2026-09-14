import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dashboardService } from '../../api/services';

export const fetchStats = createAsyncThunk('dashboard/fetchStats', async () => {
  const response = await dashboardService.getStats();
  return response.data;
});

export const fetchRecentRequests = createAsyncThunk('dashboard/fetchRecent', async () => {
  const response = await dashboardService.getRecentRequests();
  return response.data;
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    stats: null,
    recentRequests: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStats.pending, (state) => { state.loading = true; })
      .addCase(fetchStats.fulfilled, (state, action) => { state.loading = false; state.stats = action.payload; })
      .addCase(fetchStats.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })
      .addCase(fetchRecentRequests.fulfilled, (state, action) => { state.recentRequests = action.payload; });
  },
});

export default dashboardSlice.reducer;
