import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../Api/AxiosInstance';

console.log('Axios Instance:', axiosInstance.defaults.baseURL);

export const fetchSubdomains = createAsyncThunk(
  'clinic/fetchSubdomains',
  async (_, { rejectWithValue }) => {
    try {
      // console.log('Fetching subdomains...'); 
      // Based on the error message, the correct path should be under authentication
      const response = await axiosInstance.get('/authentication/fetchAllEntitiesSubdomains/');
      
      // console.log('Raw Response:', response); 
      console.log('response', response.data); 
      
      if (!response.data) {
        return rejectWithValue('No data received from the server');
      }
      
      return response.data;
    } catch (error) {
      console.error('API Error Details:', {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : 'No response',
        request: error.request ? 'Request made' : 'No request'
      });
      
      // If we get a 404, try an alternative endpoint
      if (error.response && error.response.status === 404) {
            try {
              // console.log('Trying alternative endpoint...');
          const altResponse = await axiosInstance.get('/authentication/fetchAllEntitiesSubdomains/');
          console.log('Alternative endpoint success:', altResponse.data);
          return altResponse.data;
        } catch (altError) {
          console.error('Alternative endpoint also failed:', altError.message);
          return rejectWithValue('Error fetching subdomains: Both primary and alternative endpoints failed');
        }
      }
      
      return rejectWithValue('Error fetching subdomains: ' + (error.message || 'Unknown error'));
    }
  }
);

const clinicSlice = createSlice({
  name: 'clinic',
  initialState: {
    subdomains: [],
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
        state.subdomains = action.payload;
      })
      .addCase(fetchSubdomains.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error('Clinic Slice Error State:', action.payload);
      });
  }
});

export const { clearClinicErrors } = clinicSlice.actions;
export default clinicSlice.reducer;