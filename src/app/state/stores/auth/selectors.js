// Auth Selectors
export const authSelectors = {
  // Get entire auth state
  getAuthState: (state) => state.auth,
  
  // Get user data
  getUser: (state) => state.auth.user,
  
  // Get authentication token
  getToken: (state) => state.auth.token,
  
  // Check if user is authenticated
  isAuthenticated: (state) => state.auth.isAuthenticated,
  
  // Check if auth is loading
  isLoading: (state) => state.auth.isLoading,
  
  // Get auth error
  getError: (state) => state.auth.error,
  
  // Get user name
  getUserName: (state) => state.auth.user?.name || 'User',
  
  // Get user email
  getUserEmail: (state) => state.auth.user?.email || '',
  
  // Get user ID
  getUserId: (state) => state.auth.user?.id || null,
  
  // Check if user has valid session
  hasValidSession: (state) => {
    const { user, token, isAuthenticated } = state.auth;
    return !!(user && token && isAuthenticated);
  },
}; 