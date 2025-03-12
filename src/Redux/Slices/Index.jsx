import { combineReducers } from '@reduxjs/toolkit';
import AuthReducer from "../Slices/AuthSlice"
import ClinicReducer from "../Slices/ClinicSlice"
import AppointmentReducer from '../Slices/AppointmentSlice';
import patientDetailsReducer from './PatientDetailsSlice';

const rootReducer = combineReducers({
  user: AuthReducer,
  clinic:ClinicReducer,
  Appointment:AppointmentReducer,
  patientDetails: patientDetailsReducer,

});

export default rootReducer;
