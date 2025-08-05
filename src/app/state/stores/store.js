import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import { rootReducer } from './root_reducer';
import { rootSaga } from './root_saga';

// Create Saga Middleware
const sagaMiddleware = createSagaMiddleware();

// Configure Store
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: false, // Disable thunk since we're using saga
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(sagaMiddleware),
  devTools: __DEV__, // Enable Redux DevTools in development
});

// Run Root Saga
sagaMiddleware.run(rootSaga);

export default store; 