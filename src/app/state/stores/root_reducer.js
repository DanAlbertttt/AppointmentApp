import { combineReducers } from '@reduxjs/toolkit';
import { authReducer } from './auth';

// Root Reducer
export const rootReducer = combineReducers({
  auth: authReducer,
  // Add other reducers here as needed
  // appointments: appointmentsReducer,
  // user: userReducer,
}); 