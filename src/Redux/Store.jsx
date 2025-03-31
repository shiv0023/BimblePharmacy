// src/redux/store.js
import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import rootReducer from './Slices/Index';

export const store = configureStore({
  reducer: {
    auth: rootReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Disable the serializable check middleware
    }),
});

// Add detailed state logging
store.subscribe(() => {
  const state = store.getState();
  console.group('Redux State Update');
  console.log('Current State:', {
    auth: {
      clinicDetails: state.auth.clinicDetails,
      user: state.auth.user,
      // Add any other specific state properties you want to monitor
    }
  });
  console.log('Full State:', state);
  console.groupEnd();
});

export default store;