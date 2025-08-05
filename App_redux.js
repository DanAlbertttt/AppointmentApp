import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import store from './src/app/state/stores/store';
import AppNavigatorRedux from './src/app/navigations/app_navigator_redux';

export default function AppRedux() {
  return (
    <Provider store={store}>
      <StatusBar style="auto" />
      <AppNavigatorRedux />
    </Provider>
  );
} 