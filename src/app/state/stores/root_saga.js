import { all } from 'redux-saga/effects';
import { authSaga } from './auth';

// Root Saga
export function* rootSaga() {
  yield all([
    authSaga(),
    // Add other sagas here as needed
    // appointmentsSaga(),
    // userSaga(),
  ]);
} 