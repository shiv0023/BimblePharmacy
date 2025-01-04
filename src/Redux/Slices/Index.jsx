import { combineReducers } from 'redux';
import AuthReducer from "../Slices/AuthSlice"

const rootReducer = combineReducers({
  user: AuthReducer,
});

export default rootReducer;
