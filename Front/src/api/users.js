import api from './axios';

export const usersAPI = {
  // Get all users
  getUsers: async (filters = {}) => {
    const response = await api.get('/users', { params: filters });
    return response.data;
  },

  // Get user by ID
  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Get departments
  getDepartments: async () => {
    const response = await api.get('/users/meta/departments');
    return response.data;
  },

  // Get recipients (filtered by user role and department)
  getRecipients: async () => {
    const response = await api.get('/users/meta/recipients');
    return response.data;
  },

  // Create user (Admin only)
  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // Update user (Admin only)
  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  // Delete user (Admin only)
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Reset password (Admin only)
  resetPassword: async (id, newPassword) => {
    const response = await api.post(`/users/${id}/reset-password`, {
      newPassword,
    });
    return response.data;
  },
};

