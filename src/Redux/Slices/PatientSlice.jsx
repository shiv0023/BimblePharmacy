import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../Api/AxiosInstance';

export const searchPatients = createAsyncThunk(
  'patients/search',
  async (searchKey, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/patient/searchPatient/', {
        searchKey: searchKey
      });

      if (response.data.status === 'success') {
        return response.data.data;
      } else {
        return rejectWithValue(response.data.message || 'Failed to search patients');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search patients');
    }
  }
);

const patientSearchSlice = createSlice({
  name: 'patientSearch',
  initialState: {
    searchResults: [],
    loading: false,
    error: null
  },
  reducers: {
    clearSearchResults: (state) => {
      state.searchResults = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchPatients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchPatients.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
        state.error = null;
      })
      .addCase(searchPatients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearSearchResults } = patientSearchSlice.actions;
export default patientSearchSlice.reducer;