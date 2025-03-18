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

store.subscribe(() => {
  console.log('Store State:', store.getState());
});

export default store;