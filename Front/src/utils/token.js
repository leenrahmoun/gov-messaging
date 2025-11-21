/**
 * Token management utilities
 * Using sessionStorage for better security (cleared on tab close)
 */

export const getToken = () => {
  return sessionStorage.getItem('auth_token');
};

export const setToken = (token) => {
  sessionStorage.setItem('auth_token', token);
};

export const removeToken = () => {
  sessionStorage.removeItem('auth_token');
};

export const isAuthenticated = () => {
  return !!getToken();
};

