import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../Api/AxiosInstance';

// Create async thunk for fetching patient details
export const fetchPatientDetails = createAsyncThunk(
  'patientDetails/fetchPatient',
  async ({ demographicNo }, { rejectWithValue }) => {
    try {
      // Ensure demographicNo is an integer
      const demoNo = parseInt(demographicNo, 10);

      if (isNaN(demoNo)) {
        throw new Error('demographicNo must be an integer');
      }

      const response = await axiosInstance.post('/patient/fetchPatient/', {
        demographicNo: demoNo
      });

      if (response.data.status === 'success' && response.data.data) {
        return response.data.data;
      }
      return rejectWithValue('No patient data received');
    } catch (error) {
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
      console.log (response.data.data,'hello')
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

// Save Rx Encounter Notes thunk
export const saveRxEncounterNotes = createAsyncThunk(
  'patientDetails/saveRxEncounterNotes',
  async (payload, { rejectWithValue }) => {
    try {
      // Log payload for debugging
      console.log('Saving Rx Encounter Notes payload:', payload);
      const response = await axiosInstance.post('/drugs/saveRxEncounterNotes/', payload);
      console.log(response,'message')

      if (response.data.status === 'Success') {
        return response.data;
      }
      // Log the error for debugging
      console.log('API error response:', response.data);
          
    } catch (error) {
      // Defensive error handling
      let errorMsg = 'Failed to save Rx encounter notes';
      if (error.response && error.response.data && error.response.data.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      return rejectWithValue(errorMsg);
    }
  }
);

const patientDetailsSlice = createSlice({
  name: 'patientDetails',
  initialState: {
    data:[],

    loading: false,

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
        state.dataaaa = action.payload
        state.loading = false;
        state.error = null;
        console.log('Patient Detailssssss:', action.payload);
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
        console.error('Failed to fetch encounter notess:', action.payload);
      });
  }
});

export const { clearPatientDetails } = patientDetailsSlice.actions;
export default patientDetailsSlice.reducer; 