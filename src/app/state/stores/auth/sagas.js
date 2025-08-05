import { call, put, takeLatest } from 'redux-saga/effects';
import { AUTH_ACTIONS, authActions } from './actions';
import authService from '../../../services/auth_service';
import storageService from '../../../services/storage_service';

// Login Saga
function* loginSaga(action) {
  try {
    const { email, password } = action.payload;
    
    // Call the auth service
    const response = yield call(authService.login, email, password);
    
    // Save to storage
    yield call(storageService.setToken, response.token);
    yield call(storageService.setUser, response.user);
    
    // Dispatch success action
    yield put(authActions.loginSuccess(response));
  } catch (error) {
    // Dispatch failure action
    yield put(authActions.loginFailure(error.message || 'Login failed'));
  }
}

// Logout Saga
function* logoutSaga() {
  try {
    // Call the auth service
    yield call(authService.logout);
    
    // Clear storage
    yield call(storageService.clearAll);
    
    // Dispatch success action
    yield put(authActions.logoutSuccess());
  } catch (error) {
    // Even if API fails, clear storage and dispatch success
    yield call(storageService.clearAll);
    yield put(authActions.logoutSuccess());
  }
}

// Check Auth Saga
function* checkAuthSaga() {
  try {
    // Get stored data
    const token = yield call(storageService.getToken);
    const user = yield call(storageService.getUser);
    
    if (token && user) {
      // Verify with API (optional for mock)
      const currentUser = yield call(authService.getCurrentUser);
      
      if (currentUser) {
        yield put(authActions.checkAuthSuccess({ user, token }));
      } else {
        // Token is invalid, clear storage
        yield call(storageService.clearAll);
        yield put(authActions.checkAuthFailure('Invalid token'));
      }
    } else {
      yield put(authActions.checkAuthFailure('No stored credentials'));
    }
  } catch (error) {
    yield put(authActions.checkAuthFailure(error.message || 'Auth check failed'));
  }
}

// Root Auth Saga
export function* authSaga() {
  yield takeLatest(AUTH_ACTIONS.LOGIN_REQUEST, loginSaga);
  yield takeLatest(AUTH_ACTIONS.LOGOUT_REQUEST, logoutSaga);
  yield takeLatest(AUTH_ACTIONS.CHECK_AUTH_REQUEST, checkAuthSaga);
} 