import { useSelector, useDispatch } from 'react-redux';
import { authActions, authSelectors } from '../stores/auth';

// Custom Hook for Authentication
export const useAuth = () => {
  const dispatch = useDispatch();
  
  // Selectors
  const user = useSelector(authSelectors.getUser);
  const token = useSelector(authSelectors.getToken);
  const isAuthenticated = useSelector(authSelectors.isAuthenticated);
  const isLoading = useSelector(authSelectors.isLoading);
  const error = useSelector(authSelectors.getError);
  const userName = useSelector(authSelectors.getUserName);
  const userEmail = useSelector(authSelectors.getUserEmail);
  const userId = useSelector(authSelectors.getUserId);
  const hasValidSession = useSelector(authSelectors.hasValidSession);

  // Actions
  const login = (credentials) => {
    dispatch(authActions.loginRequest(credentials));
  };

  const logout = () => {
    dispatch(authActions.logoutRequest());
  };

  const checkAuth = () => {
    dispatch(authActions.checkAuthRequest());
  };

  const clearError = () => {
    dispatch(authActions.clearAuthError());
  };

  return {
    // State
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    userName,
    userEmail,
    userId,
    hasValidSession,
    
    // Actions
    login,
    logout,
    checkAuth,
    clearError,
  };
}; 