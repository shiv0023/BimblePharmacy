import { combineReducers } from 'redux';
import AuthReducer from "../Slices/AuthSlice"
import ClinicReducer from "../Slices/ClinicSlice"
import AppointmentReducer from './AppointmentSlice';
const rootReducer = combineReducers({
  user: AuthReducer,
  clinic:ClinicReducer,
  Appointment:AppointmentReducer
  
});


export default rootReducer;
