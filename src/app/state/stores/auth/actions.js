// Action Types
export const AUTH_ACTIONS = {
  LOGIN_REQUEST: 'auth/login_request',
  LOGIN_SUCCESS: 'auth/login_success',
  LOGIN_FAILURE: 'auth/login_failure',
  LOGOUT_REQUEST: 'auth/logout_request',
  LOGOUT_SUCCESS: 'auth/logout_success',
  LOGOUT_FAILURE: 'auth/logout_failure',
  CHECK_AUTH_REQUEST: 'auth/check_auth_request',
  CHECK_AUTH_SUCCESS: 'auth/check_auth_success',
  CHECK_AUTH_FAILURE: 'auth/check_auth_failure',
  CLEAR_AUTH_ERROR: 'auth/clear_auth_error',
};

// Action Creators
export const authActions = {
  // Login Actions
  loginRequest: (credentials) => ({
    type: AUTH_ACTIONS.LOGIN_REQUEST,
    payload: credentials,
  }),

  loginSuccess: (userData) => ({
    type: AUTH_ACTIONS.LOGIN_SUCCESS,
    payload: userData,
  }),

  loginFailure: (error) => ({
    type: AUTH_ACTIONS.LOGIN_FAILURE,
    payload: error,
  }),

  // Logout Actions
  logoutRequest: () => ({
    type: AUTH_ACTIONS.LOGOUT_REQUEST,
  }),

  logoutSuccess: () => ({
    type: AUTH_ACTIONS.LOGOUT_SUCCESS,
  }),

  logoutFailure: (error) => ({
    type: AUTH_ACTIONS.LOGOUT_FAILURE,
    payload: error,
  }),

  // Check Auth Actions
  checkAuthRequest: () => ({
    type: AUTH_ACTIONS.CHECK_AUTH_REQUEST,
  }),

  checkAuthSuccess: (userData) => ({
    type: AUTH_ACTIONS.CHECK_AUTH_SUCCESS,
    payload: userData,
  }),

  checkAuthFailure: (error) => ({
    type: AUTH_ACTIONS.CHECK_AUTH_FAILURE,
    payload: error,
  }),

  // Utility Actions
  clearAuthError: () => ({
    type: AUTH_ACTIONS.CLEAR_AUTH_ERROR,
  }),
}; 