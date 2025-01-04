// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './Slices/Index';

export const store = configureStore({
  reducer: {
    auth: rootReducer, 
  },
});

export default store;
