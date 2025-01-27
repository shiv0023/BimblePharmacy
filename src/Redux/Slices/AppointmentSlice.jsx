import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import axiosInstance from '../../Api/AxiosInstance';

export const fetchAppointments = createAsyncThunk(
  'appointments/fetchAppointments',
  async ({ startDate, endDate, token }, thunkAPI) => {
    try {
      const response = await axiosInstance.post('/appointment/fetchAppointmentsList/', {
        startDate,
        endDate,
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data || error.message);
    }
  }
);

const appointmentsSlice = createSlice({
  name: 'appointment',
  initialState: {
    data: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppointments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export default appointmentsSlice.reducer;
