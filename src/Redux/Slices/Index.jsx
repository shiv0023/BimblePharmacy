import { combineReducers } from 'redux';
import AuthReducer from "../Slices/AuthSlice"
import ClinicReducer from "../Slices/ClinicSlice"
const rootReducer = combineReducers({
  user: AuthReducer,
  clinic:ClinicReducer
  
});
// console.log('Clinic Reducer:', clinic);

export default rootReducer;
