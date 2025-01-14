import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../Api/AxiosInstance';


console.log('Axios Instance:', axiosInstance.defaults.baseURL);

export const fetchSubdomains = createAsyncThunk(
  'clinic/fetchSubdomains',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Fetching subdomains...'); 
      const response = await axiosInstance.get('/team/fetchAllClinicsSubdomains/');
      console.log('Raw Response:', response); 
      console.log('Response Data:', response.data); 
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
      });
  }
});

export default clinicSlice.reducer;