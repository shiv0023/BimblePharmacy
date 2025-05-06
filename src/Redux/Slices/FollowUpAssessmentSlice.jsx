import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../Api/AxiosInstance'; // your axios instance with interceptors

// Async thunk for follow-up assessment
export const generateFollowupAssessment = createAsyncThunk(
  'followupAssessment/generate',
  async (payload, { rejectWithValue }) => {
    try {
      console.log('Incoming Payload:', payload); // Log incoming payload

      // Transform scopeAnswers if present
      let formattedAnswers = {};  // Changed to object instead of array
      
      if (payload.scopeAnswers) {
        console.log('ScopeAnswers found:', payload.scopeAnswers);
        // Use the same format as the example but with dynamic data
        formattedAnswers = Object.entries(payload.scopeAnswers).reduce((acc, [question, answer]) => {
          acc[question] = String(answer).toLowerCase();
          return acc;
        }, {});
        
        console.log('Formatted Answers:', formattedAnswers);
      } else if (Array.isArray(payload.answers)) {
        // Convert array format to object format if needed
        formattedAnswers = payload.answers.reduce((acc, item) => {
          acc[item.question] = String(item.answer).toLowerCase();
          return acc;
        }, {});
        console.log('Converted array answers to object format:', formattedAnswers);
      }

      // Format the payload
      const formattedPayload = {
        gender: payload.gender,
        dob: payload.dob,
        reason: payload.reason || payload.condition,
        appointmentNo: payload.appointmentNo,
        scope: payload.scope || 'in scope of pharmacist',
        answers: formattedAnswers  ,// Using the formatted object
        reasonDescription: payload?.reasonDescription ||  "",  // Use from route params
        allergies: payload?.allergies || '', 
      };

      console.log('Sending API payload:', formattedPayload);

      const response = await axiosInstance.post(
        '/appointment/generatePharmacyFollowUpQuestions/',
        formattedPayload
      );
      
      console.log('Raw API Response:', response.data);
      console.log('Response Status:', response.status);
      console.log('Response Headers:', response.headers);

      // Return the data in the correct structure
      return {
        data: {
          questions: response.data.data.questions || []
        },
        status: response.data.status || 'Success',
        message: response.data.message || '',
        scopeStatus: response.data.scopeStatus || null,
        scopeStatusReason: response.data.scopeStatusReason || null
      };

    } catch (error) {
      console.error('API Error Details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return rejectWithValue({
        message: error.response?.data?.message || error.message,
        status: 'Error'
      });
    }
  }
);

const followupAssessmentSlice = createSlice({
  name: 'followupAssessment',
  initialState: {
    data: [],
    loading: false,
    error: null,
    scopeStatus: null,
    scopeStatusReason: null
  },
  reducers: {
    clearFollowupAssessment: (state) => {
      state.data = [];
      state.loading = false;
      state.error = null;
      state.scopeStatus = null;
      state.scopeStatusReason = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateFollowupAssessment.pending, (state) => {
        console.log('Loading State:', true);
        state.loading = true;
        state.error = null;
      })
      .addCase(generateFollowupAssessment.fulfilled, (state, action) => {
        console.log('Fulfilled Action Payload:', action.payload);
        state.loading = false;
        
        // Add detailed logging to see what's coming in
        console.log('Raw questions from payload:', action.payload?.questions);
        console.log('Raw data from payload:', action.payload?.data);
        
        // Check if questions are in the nested data structure
        if (action.payload?.data?.questions) {
          console.log('Found questions in nested data');
          state.data = action.payload.data.questions;
        } else if (Array.isArray(action.payload?.questions)) {
          console.log('Found questions directly');
          state.data = action.payload.questions;
        } else {
          console.log('No questions found, setting empty array');
          state.data = [];
        }
        
        state.scopeStatus = action.payload?.scopeStatus || null;
        state.scopeStatusReason = action.payload?.scopeStatusReason || null;
        state.error = null;

        // Log the final state update
        console.log('Final Updated State:', {
          dataLength: state.data.length,
          firstQuestion: state.data[0],
          scopeStatus: state.scopeStatus,
          scopeStatusReason: state.scopeStatusReason
        });
      })
      .addCase(generateFollowupAssessment.rejected, (state, action) => {
        console.log('Rejected Action Payload:', action.payload);
        state.loading = false;
        state.error = action.payload;
        state.data = [];
        state.scopeStatus = null;
        state.scopeStatusReason = null;
        console.log('Error State:', state.error);
      });
  }
});

export const { clearFollowupAssessment } = followupAssessmentSlice.actions;
export default followupAssessmentSlice.reducer;