import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../Api/AxiosInstance';

export const getMedicationList = createAsyncThunk(
  'medication/getMedicationList',
  async (reason, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/appointment/getMedicationList/', {
        reason
      });

      if (!response.data) {
        return rejectWithValue('No data received');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch medication list'
      );
    }
  }
);

const initialState = {
  medications: [],
  loading: false,
  error: null
};

const medicationSlice = createSlice({
  name: 'medication',
  initialState,
  reducers: {
    clearMedications: (state) => {
      state.medications = [];
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getMedicationList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMedicationList.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.data) {
          state.medications = Object.entries(action.payload.data).map(([name, value]) => ({
            name,
            sig: value.sig
          }));
        } else {
          state.medications = [];
        }
        state.error = null;
      })
      .addCase(getMedicationList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.medications = [];
      });
  }
});

export const { clearMedications } = medicationSlice.actions;
export default medicationSlice.reducer;