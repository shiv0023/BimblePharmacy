import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../Api/AxiosInstance';

// Debug axios instance
console.log('Axios Instance:', axiosInstance.defaults.baseURL);

export const fetchSubdomains = createAsyncThunk(
  'clinic/fetchSubdomains',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Fetching subdomains...'); // Debug fetch start
      const response = await axiosInstance.get('bimbleProAdmin/fetchAllClinicsSubdomains/');
      console.log('Raw Response:', response); // Debug full response
      console.log('Response Data:', response.data); // Debug response data
      return response.data;
    } catch (error) {
      console.error('API Error Details:', {
        message: error.message,
        response: error.response,
        request: error.request
      });
      return rejectWithValue('Error fetching subdomains');
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
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubdomains.pending, (state) => {
        console.log('Loading started'); // Debug loading
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubdomains.fulfilled, (state, action) => {
        console.log('Success with payload:', action.payload); // Debug success
        state.loading = false;
        state.subdomains = action.payload;
      })
      .addCase(fetchSubdomains.rejected, (state, action) => {
        console.log('Failed with error:', action.payload); // Debug failure
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default clinicSlice.reducer;