import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { reviewService } from '../../api/services';

export const fetchPendingReviews = createAsyncThunk('review/fetchPending', async () => {
  const response = await reviewService.getPending();
  return response.data;
});

export const resolveReviewItem = createAsyncThunk('review/resolve', async (data) => {
  await reviewService.resolve(data);
  return data.reviewItemId;
});

const reviewSlice = createSlice({
  name: 'review',
  initialState: {
    pendingItems: [],
    loading: false,
    resolving: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPendingReviews.pending, (state) => { state.loading = true; })
      .addCase(fetchPendingReviews.fulfilled, (state, action) => { state.loading = false; state.pendingItems = action.payload; })
      .addCase(fetchPendingReviews.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })
      .addCase(resolveReviewItem.pending, (state) => { state.resolving = true; })
      .addCase(resolveReviewItem.fulfilled, (state, action) => {
        state.resolving = false;
        state.pendingItems = state.pendingItems.filter(i => i.id !== action.payload);
      })
      .addCase(resolveReviewItem.rejected, (state, action) => { state.resolving = false; state.error = action.error.message; });
  },
});

export default reviewSlice.reducer;
