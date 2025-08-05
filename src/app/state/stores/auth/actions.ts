import { createAction } from "@reduxjs/toolkit";

// Action Types
export const LOGIN_REQUEST = "auth/LOGIN_REQUEST";
export const LOGIN_SUCCESS = "auth/LOGIN_SUCCESS";
export const LOGIN_FAILURE = "auth/LOGIN_FAILURE";
export const LOGOUT_REQUEST = "auth/LOGOUT_REQUEST";
export const LOGOUT_SUCCESS = "auth/LOGOUT_SUCCESS";
export const LOGOUT_FAILURE = "auth/LOGOUT_FAILURE";
export const AUTH_REQUEST = "auth/AUTH_REQUEST";
export const AUTH_SUCCESS = "auth/AUTH_SUCCESS";
export const AUTH_FAILURE = "auth/AUTH_FAILURE";

// Action Creators
export const loginRequest = createAction<{ email: string; password: string }>(LOGIN_REQUEST);
export const loginSuccess = createAction<any>(LOGIN_SUCCESS);
export const loginFailure = createAction<any>(LOGIN_FAILURE);

export const logoutRequest = createAction(LOGOUT_REQUEST);
export const logoutSuccess = createAction(LOGOUT_SUCCESS);
export const logoutFailure = createAction<any>(LOGOUT_FAILURE);

export const authRequest = createAction<string>(AUTH_REQUEST);
export const authSuccess = createAction<any>(AUTH_SUCCESS);
export const authFailure = createAction<any>(AUTH_FAILURE);

// Additional actions for form management
export const setLoading = createAction<boolean>("auth/SET_LOADING");
export const clearError = createAction("auth/CLEAR_ERROR");
