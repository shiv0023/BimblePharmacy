import { combineReducers } from '@reduxjs/toolkit';
import AuthReducer from "../Slices/AuthSlice"
import ClinicReducer from "../Slices/ClinicSlice"
import AppointmentReducer from '../Slices/AppointmentSlice';
import patientDetailsReducer from './PatientDetailsSlice';
import DrugReducer from './DrugSlice';
import clinicDetailsReducer from './ClinicDetails';
import generateAssessmentReducer from './GenerateAssessmentslice';
import followupAssessmentReducer from './FollowUpAssessmentSlice';
import medicationReducer from './MedicationlistSlice';
import soapNotesReducer from './SoapNotesSlice';
import parPdfReducer from './ParPdfSlices';

const rootReducer = combineReducers({
  user: AuthReducer,
  clinic: ClinicReducer,
  Appointment: AppointmentReducer,
  patientDetails: patientDetailsReducer,
  drugs: DrugReducer,
  clinicDetails: clinicDetailsReducer,
  generateAssessment: generateAssessmentReducer,
  followupAssessment: followupAssessmentReducer,
  medication: medicationReducer,
  soapNotes: soapNotesReducer,
  parPdf: parPdfReducer,
});

export default rootReducer;
