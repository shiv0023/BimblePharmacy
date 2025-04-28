import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../Api/AxiosInstance';

// Create async thunk for fetching patient details
export const fetchPatientDetails = createAsyncThunk(
  'patientDetails/fetchPatient',
  async ({ demographicNo }, { rejectWithValue }) => {
    try {
      // console.log('Fetching patient details for demographicNo:', demographicNo);
      
      const response = await axiosInstance.post('/patient/fetchPatient/', {
        demographicNo: demographicNo
      });

      console.log('Patient details response:', response.data);

      if (response.data.status === 'success' && response.data.data) {
        const patientData = response.data.data;
        
        // Add debug log for allergies
        console.log('Patient Data Allergies:', patientData.allergies);
        
        // Normalize the compliance value from patientAddress
        if (patientData.patientAddress?.patientCompliance) {
          patientData.patientCompliance = patientData.patientAddress.patientCompliance.toLowerCase();
        } else if (patientData.patientCompliance) {
          patientData.patientCompliance = patientData.patientCompliance.toLowerCase();
        }

        // console.log('Patient Compliance:', patientData.patientCompliance); // Debug log
        return patientData;
      }
      return rejectWithValue('No patient data received');
    } catch (error) {
      console.error('Patient details fetch error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch patient details');
    }
  }
);

// Updated encounter notes thunk
export const fetchEncounterNotes = createAsyncThunk(
  'patientDetails/fetchEncounterNotes',
  async ({ demographicNo }, { rejectWithValue }) => {
    try {
      // console.log('=== Encounter Notes API Call Start ===');
      // console.log('DemographicNo:', demographicNo);

      // Validate demographicNo
      if (!demographicNo) {
        throw new Error('DemographicNo is required');
      }

      // Make the API call
      const response = await axiosInstance.post('/patient/fetchEncounterNotes/', {
        demographicNo: parseInt(demographicNo) // Ensure number format
      });

      // console.log('API Response:', {
      //   status: response.status,
      //   data: response.data
      // });

      // Validate response
      if (!response.data) {
        throw new Error('No data received from API');
      }

      // Return the data
      return response.data.data || [];

    } catch (error) {
      console.error('Encounter Notes Error:', {
        name: error.name,
        message: error.message,
        response: error.response?.data
      });
      return rejectWithValue(error.message);
    }
  }
);

const patientDetailsSlice = createSlice({
  name: 'patientDetails',
  initialState: {
    data: {},
    encounterNotes: [],
    loading: false,
    notesLoading: false,
    error: null
  },
  reducers: {
    clearPatientDetails: (state) => {
      state.data = {};
      state.encounterNotes = [];
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Patient Details reducers
      .addCase(fetchPatientDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPatientDetails.fulfilled, (state, action) => {
        const demographicNo = action.meta.arg.demographicNo;
        state.data[demographicNo] = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchPatientDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.data = {};
      })
      // Encounter Notes reducers with separate loading state
      .addCase(fetchEncounterNotes.pending, (state) => {
        state.notesLoading = true;
        state.error = null;
        // console.log('Fetching encounter notes...');
      })
      .addCase(fetchEncounterNotes.fulfilled, (state, action) => {
        state.notesLoading = false;
        state.encounterNotes = action.payload;
        // console.log('Encounter notes updated:', action.payload);
      })
      .addCase(fetchEncounterNotes.rejected, (state, action) => {
        state.notesLoading = false;
        state.error = action.payload;
        console.error('Failed to fetch encounter notes:', action.payload);
      });
  }
});

export const { clearPatientDetails } = patientDetailsSlice.actions;
export default patientDetailsSlice.reducer; 