import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../Api/AxiosInstance';

// Add new thunk for generating scope assessment
export const generateScopeAssessment = createAsyncThunk(
    'appointment/generateScopeAssessment',
    async (params, { rejectWithValue }) => {
      try {
        // Convert gender from M/F to Male/Female
        const getFullGender = (gender) => {
          if (!gender) return '';
          if (gender.toUpperCase() === 'F') return 'Female';
          if (gender.toUpperCase() === 'M') return 'Male';
          return gender;
        };

        // Format parameters
        const formattedParams = {
          reason: String(params.reason || '').trim(),
          gender: getFullGender(params.gender)
        };

        // Log the formatted parameters
        console.log('Original params:', params);
        console.log('Formatted params:', formattedParams);

        // Validate parameters
        if (!formattedParams.gender || !['Male', 'Female'].includes(formattedParams.gender)) {
          throw new Error('Invalid gender. Valid options are Male or Female');
        }
        if (!formattedParams.reason) {
          throw new Error('Parameters missing: reason');
        }

        // Make the API call with formatted parameters
        const response = await axiosInstance.post('/appointment/generateScopeAssessment/', formattedParams);

        // Log the response
        console.log('API Response:', response.data);

        if (!response.data) {
          return rejectWithValue('No data received');
        }

        return response.data;
      } catch (error) {
        console.error('Generate scope assessment error:', error);
        if (error.response) {
          console.error('Error response data:', error.response.data);
          console.error('Error response status:', error.response.status);
        }
        const errorMessage = error.response?.data?.message || error.message || 'Failed to generate scope assessment';
        return rejectWithValue(errorMessage);
      }
    }
);

export const fetchAssessmentQuestions = createAsyncThunk(
  'assessment/fetchQuestions',
  async ({ condition, gender, age }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/appointment/getAssessmentQuestions/', {
        condition,
        gender,
        age
      });

      // Ensure the response has the expected structure
      if (response.data?.status === 'Success' && Array.isArray(response.data?.data)) {
        return response.data.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getScopeStatus = createAsyncThunk(
  'appointment/getScopeStatus',
  async (params, { rejectWithValue }) => {
    try {
      // No need to clean the scopeAnswers as they're already in correct format
      const response = await axiosInstance.post('/appointment/getScopeStatusByPatient/', {
        subdomainBimble: params.subdomainBimble,
        scopeAnswers: params.scopeAnswers,
        reason: params.reason,
        gender: params.gender,
        dob: params.dob,
        appointmentNo: params.appointmentNo
      });

      console.log('getScopeStatus response:', response.data);
      return response.data;
    } catch (error) {
      console.error('getScopeStatus error:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const generatePharmacyFollowUpAssessment = createAsyncThunk(
  'assessment/generatePharmacyFollowUpAssessment',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/appointment/generatePharmacyFollowUpQuestions/', payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Create the slice
const generateAssessmentSlice = createSlice({
  name: 'generateAssessment',
  initialState: {
    loading: false,
    error: null,
    scopeAssessment: null,
    scopeStatus: null,
    scopeStatusLoading: false,
    scopeStatusError: null,
  },
  reducers: {
    clearAssessment: (state) => {
      state.scopeAssessment = null;
      state.error = null;
      state.scopeStatus = null;
      state.scopeStatusError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateScopeAssessment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateScopeAssessment.fulfilled, (state, action) => {
        state.loading = false;
        state.scopeAssessment = action.payload;
        state.error = null;
      })
      .addCase(generateScopeAssessment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getScopeStatus.pending, (state) => {
        state.scopeStatusLoading = true;
        state.scopeStatusError = null;
      })
      .addCase(getScopeStatus.fulfilled, (state, action) => {
        state.scopeStatusLoading = false;
        state.scopeStatus = action.payload;
      })
      .addCase(getScopeStatus.rejected, (state, action) => {
        state.scopeStatusLoading = false;
        state.scopeStatusError = action.payload;
      });
  }
});

export const { clearAssessment } = generateAssessmentSlice.actions;
export default generateAssessmentSlice.reducer;