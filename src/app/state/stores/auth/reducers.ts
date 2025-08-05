import { createSlice } from '@reduxjs/toolkit';
import {
  loginRequest,
  loginSuccess,
  loginFailure,
  logoutRequest,
  logoutSuccess,
  logoutFailure,
  authRequest,
  authSuccess,
  authFailure,
  setLoading,
  clearError,
} from './actions';

interface AuthState {
  loading: boolean;
  isAuthenticated: boolean;
  user: any;
  accessToken: string | null;
  error: string | null;
  message: string | null;
}

const initialState: AuthState = {
  loading: false,
  isAuthenticated: false,
  user: null,
  accessToken: null,
  error: null,
  message: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Login cases
    builder
      .addCase(loginRequest, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(loginSuccess, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.error = null;
        state.message = action.payload.message || 'Login successful';
      })
      .addCase(loginFailure, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.error = action.payload?.message || 'Login failed';
        state.message = null;
      });

    // Logout cases
    builder
      .addCase(logoutRequest, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(logoutSuccess, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.error = null;
        state.message = 'Logout successful';
      })
      .addCase(logoutFailure, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Logout failed';
        state.message = null;
      });

    // Auth verification cases
    builder
      .addCase(authRequest, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(authSuccess, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.error = null;
        state.message = null;
      })
      .addCase(authFailure, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.error = action.payload?.message || 'Authentication failed';
        state.message = null;
      });

    // Utility cases
    builder
      .addCase(setLoading, (state, action) => {
        state.loading = action.payload;
      })
      .addCase(clearError, (state) => {
        state.error = null;
        state.message = null;
      });
  },
});

export default authSlice.reducer;
