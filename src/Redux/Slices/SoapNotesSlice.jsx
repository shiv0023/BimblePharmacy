// src/Redux/Slices/SoapNotesSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosInstance from '../../Api/AxiosInstance';

export const fetchSoapNotes = createAsyncThunk(
  'soapNotes/fetchSoapNotes',
  async (params, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/appointment/generateSoapNotes/', params);
      console.log (response,'soapnotessss')
      return response.data.data.soapNote; 
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const soapNotesSlice = createSlice({
  name: 'soapNotes',
  initialState: {
    loading: false,
    soapNote: null,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSoapNotes.pending, (state) => {
        state.loading = true;
        state.soapNote = null;
        state.error = null;
      })
      .addCase(fetchSoapNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.soapNote = action.payload;
        console.log(state.soapNote,'fullfilled soapnotes')
      })
      .addCase(fetchSoapNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default soapNotesSlice.reducer;