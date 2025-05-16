import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../Api/AxiosInstance';

console.log('Axios Instance:', axiosInstance.defaults.baseURL);

export const fetchSubdomains = createAsyncThunk(
  'clinic/fetchSubdomains',
  async (searchQuery, { rejectWithValue }) => {
    try {
      console.log('Fetching subdomains with query:', searchQuery);
      const response = await axiosInstance.get('/authentication/fetchAllEntitiesSubdomains/');
      
      console.log('Subdomains API Response:', response.data);
      
      if (!response.data) {
        throw new Error('No data received from the server');
      }
      
      return response.data;
    } catch (error) {
      console.error('Subdomains API Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch clinics');
    }
  }
);

const clinicSlice = createSlice({
  name: 'clinic',
  initialState: {
    data: [],
    loading: false,
    error: null
  },
  reducers: {
    clearClinicErrors: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubdomains.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubdomains.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchSubdomains.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error('Clinic fetch failed:', action.payload);
      });
  }
});

export const { clearClinicErrors } = clinicSlice.actions;
export default clinicSlice.reducer;