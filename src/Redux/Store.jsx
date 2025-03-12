// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './Slices/Index';

export const store = configureStore({
  reducer: {
    auth: rootReducer, 
  },
});
store.subscribe(() => {
  console.log('Store State:', store.getState());
});
export default store;
