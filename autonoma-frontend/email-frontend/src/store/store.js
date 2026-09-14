import { configureStore } from '@reduxjs/toolkit';
import dashboardReducer from './slices/dashboardSlice';
import reviewReducer from './slices/reviewSlice';

export const store = configureStore({
  reducer: {
    dashboard: dashboardReducer,
    review: reviewReducer,
  },
});
