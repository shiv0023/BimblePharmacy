import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../Api/AxiosInstance';

export const fetchClinicDetails = createAsyncThunk(
    'clinicDetails/fetchClinic',
    async (_, { rejectWithValue }) => {
      try {
        const response = await axiosInstance.post('/authentication/fetchClinicDetails/', {
          subdomainBimble: "123virtual1.bimble.pro"
        });
        
        console.log('Clinic details response:', response.data);
        
        if (response.data.status === 'success' && response.data.data) {
          return response.data.data;
        }
        return rejectWithValue('No clinic data received');
      } catch (error) {
        console.error('Clinic fetch error:', error);
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch clinic details');
      }
    }
  );

const clinicDetailsSlice = createSlice({
  name: 'clinicDetails',
  initialState: {
    data: null,
    loading: false,
    error: null
  },
  reducers: {
    clearClinicDetails: (state) => {
      state.data = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClinicDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClinicDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchClinicDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.data = null;
      });
  }
});

export const { clearClinicDetails } = clinicDetailsSlice.actions;
export default clinicDetailsSlice.reducer;