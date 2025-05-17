import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../Api/AxiosInstance';

export const fetchAppointmentReasons = createAsyncThunk(
  'appointmentReason/fetchReasons',
  async (subdomain) => {
    try {
      if (!subdomain) {
        throw new Error('Subdomain is required');
      }

      // Don't remove .bimble.pro - send the full subdomain
      console.log('Making API call with subdomain:', subdomain);

      const response = await axiosInstance.post(
        '/appointment/fetchAppointmentReasonList/',
        { 
          subdomainBimble: subdomain  || '123virtual1.bimble.pro' // Use the full subdomain with .bimble.pro
        }
      );
      
      // Handle 204 No Content specifically
      if (response.status === 204) {
        console.log('Server returned 204 No Content - No appointment reasons available');
        return {
          reasons: [],
          message: 'No appointment reasons available for this clinic'
        };
      }

      // Handle other successful responses
      console.log(response.data,'hello')
      if (response.data) {
        let reasonsArray;
        if (Array.isArray(response.data)) {
          reasonsArray = response.data;
        } else if (typeof response.data === 'object') {
          reasonsArray = response.data.data || 
                        response.data.reasons || 
                        response.data.result || 
                        response.data.appointmentReasons ||
                        [];
        } else {
          reasonsArray = [];
        }
        return {
          reasons: reasonsArray,
          message: reasonsArray.length ? '' : 'No appointment reasons found'
        };
      }

      return {
        reasons: [],
        message: 'No data available'
      };

    } catch (error) {
      console.error('Detailed API Error:', {
        message: error.message,
        status: error.response?.status,
        subdomain: subdomain
      });
      throw error;
    }
  }
);

const appointmentReasonSlice = createSlice({
  name: 'appointmentReason',
  initialState: {
    reasons: [],
    loading: false,
    error: null,
    showReasonDropdown: false,
  },
  reducers: {
    toggleReasonDropdown: (state) => {
      state.showReasonDropdown = !state.showReasonDropdown;
    },
    closeReasonDropdown: (state) => {
      state.showReasonDropdown = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppointmentReasons.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.reasons = [];
      })
      .addCase(fetchAppointmentReasons.fulfilled, (state, action) => {
        state.loading = false;
        state.reasons = action.payload.reasons;
        state.error = null;
      })
      .addCase(fetchAppointmentReasons.rejected, (state, action) => {
        state.loading = false;
        state.reasons = [];
        state.error = action.error.message;
        console.error('Reducer Error:', action.error);
      });
  },
});

export const { toggleReasonDropdown, closeReasonDropdown } = appointmentReasonSlice.actions;
export default appointmentReasonSlice.reducer;