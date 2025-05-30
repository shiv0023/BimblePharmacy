import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../Api/AxiosInstance';
import { fetchPatientDetails } from './PatientDetailsSlice';

// Based on the error message, the correct endpoint should be one of these:
// - fetchAllPatientsAppointments
// - fetchPatientAppointments
// - fetchAppointment

export const fetchAppointments = createAsyncThunk(
  'appointment/fetchAppointments',
  async ({ startDate, endDate, token }, { dispatch, rejectWithValue }) => {
    try {
      // Set the authorization header
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const response = await axiosInstance.post('/appointment/fetchAllPatientsAppointments/',{
        startDate,
        endDate
      });
console.log (response,'appointment data')
      // Log the raw response
  


      if (!response.data || !response.data.data) {
        return rejectWithValue('No data received');
      }

      // Get the appointments array from response
      const appointments = response.data.data;

      // Get the first appointment's demographicNo and fetch patient details
      if (appointments.length > 0) {
        const firstAppointment = appointments[0];
    
        // Dispatch fetchPatientDetails with the demographicNo
        dispatch(fetchPatientDetails({ demographicNo: firstAppointment.demographicNo }));
      }

  

      return appointments.sort((a, b) => {
        // Newest date first
        if (a.appointmentDate > b.appointmentDate) return -1;
        if (a.appointmentDate < b.appointmentDate) return 1;
        // If same date, newest time first
        if (a.startTime > b.startTime) return -1;
        if (a.startTime < b.startTime) return 1;
        return 0;
      });
    } catch (error) {
      console.error('Fetch appointments error:', error);
      if (error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to fetch appointments');
      }
      return rejectWithValue('Network error occurred');
    }
  }
);

// Add a new thunk to set selected appointment and fetch patient details
export const setSelectedAppointmentAndFetchDetails = createAsyncThunk(
  'appointment/setSelectedAndFetch',
  async (appointment, { dispatch }) => {
    if (!appointment?.appointmentNo) {
      throw new Error('Appointment number is required');
    }

    // First set the selected appointment
    dispatch(setSelectedAppointment({
      ...appointment,
      appointmentNo: parseInt(appointment.appointmentNo)
    }));

    // Then fetch patient details if we have a demographicNo
    if (appointment?.demographicNo) {
      await dispatch(fetchPatientDetails({ 
        demographicNo: appointment.demographicNo,
        appointmentNo: appointment.appointmentNo
      }));
    }

    return appointment;
  }
);

const appointmentSlice = createSlice({
  name: 'appointment',
  initialState: {
    data: [],
    loading: false,
    error: null,
    selectedAppointment: null
  },
  reducers: {
    setSelectedAppointment: (state, action) => {
      state.selectedAppointment = action.payload;
   
    },
    clearAppointmentData: (state) => {
      state.data = [];
      state.selectedAppointment = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.error = null;
        
        // Log the updated state
    
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error('Appointment fetch failed:', action.payload);
      });
  }
});

export const { setSelectedAppointment, clearAppointmentData } = appointmentSlice.actions;
export default appointmentSlice.reducer;
