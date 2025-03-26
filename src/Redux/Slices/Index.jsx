import { combineReducers } from '@reduxjs/toolkit';
import AuthReducer from "../Slices/AuthSlice"
import ClinicReducer from "../Slices/ClinicSlice"
import AppointmentReducer from '../Slices/AppointmentSlice';
import patientDetailsReducer from './PatientDetailsSlice';
import DrugReducer from './DrugSlice';
import clinicDetailsReducer from './ClinicDetails';

const rootReducer = combineReducers({
  user: AuthReducer,
  clinic: ClinicReducer,
  Appointment: AppointmentReducer,
  patientDetails: patientDetailsReducer,
  drugs: DrugReducer,
  clinicDetails: clinicDetailsReducer,
});

export default rootReducer;
