// src/Redux/Slices/ParPdfSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../Api/AxiosInstance';

// Create async thunk for generating PAR PDF
export const generateParPdf = createAsyncThunk(
  'parPdf/generate',
  async (parData, { rejectWithValue }) => {
    try {
      // Format the data exactly as the API expects
      const requestBody = {
        demographicNo: parseInt(parData.demographicNo),
        mobile: parseInt('8978978978'),
        scopeAnswers: {
          condition: parData.scopeAnswers.condition || '',
          status: parData.scopeAnswers.status || ''
        },
        appointmentNo: parseInt(parData.appointmentNo) || '',
        allergies: parData.allergies || '',
        reasonDescription: parData.reasonDescription || '',
        followUpAnswers: Object.keys(parData.followUpAnswers).reduce((acc, key) => {
          acc[key] = {
            questionId: parData.followUpAnswers[key].questionId,
            answer: parData.followUpAnswers[key].answer
          };
          return acc;
        }, {}),
        soapNotes: parData.soapNotes,
        reason: parData.reason
      };

      console.log('Request Body:', JSON.stringify(requestBody, null, 2));

      const response = await axiosInstance.post('/appointment/generateParPdf/', requestBody);
      
      if (response.data && response.data.status === 'Success') {
        return {
          status: 'Success',
          pdf: response.data.pdf,
          message: response.data.message
        };
      }
      
      return rejectWithValue({
        status: 'Error',
        message: response.data?.message || 'Failed to generate PDF'
      });

    } catch (error) {
      console.error('PAR PDF Generation Error:', error.response?.data || error);
      return rejectWithValue({
        status: 'Error',
        message: error.response?.data?.message || error.message
      });
    }
  }
);

const parPdfSlice = createSlice({
  name: 'parPdf',
  initialState: {
    loading: false,
    error: null,
    pdfData: null,
  },
  reducers: {
    clearParPdfState: (state) => {
      state.loading = false;
      state.error = null;
      state.pdfData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateParPdf.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.pdfData = null;
      })
      .addCase(generateParPdf.fulfilled, (state, action) => {
        state.loading = false;
        state.pdfData = action.payload.pdf;
        state.error = null;
      })
      .addCase(generateParPdf.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to generate PAR PDF';
        state.pdfData = null;
      });
  },
});

export const { clearParPdfState } = parPdfSlice.actions;
export default parPdfSlice.reducer;