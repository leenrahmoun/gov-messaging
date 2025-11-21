import api from './axios';

export const messagesAPI = {
  // Get all messages with filters
  getMessages: async (filters = {}) => {
    const response = await api.get('/messages', { params: filters });
    return response.data;
  },

  // Get message by ID
  getMessageById: async (id) => {
    const response = await api.get(`/messages/${id}`);
    return response.data;
  },

  // Create new message
  createMessage: async (messageData) => {
    const response = await api.post('/messages', messageData);
    return response.data;
  },

  // Update message
  updateMessage: async (id, messageData) => {
    const response = await api.put(`/messages/${id}`, messageData);
    return response.data;
  },

  // Delete message
  deleteMessage: async (id) => {
    const response = await api.delete(`/messages/${id}`);
    return response.data;
  },

  // Submit message for approval
  submitMessage: async (id) => {
    const response = await api.post(`/messages/${id}/submit`);
    return response.data;
  },

  // Approve message
  approveMessage: async (id, payload = {}) => {
    const response = await api.post(`/messages/${id}/approve`, payload);
    return response.data;
  },

  // Reject message
  rejectMessage: async (id, payload) => {
    const response = await api.post(`/messages/${id}/reject`, payload);
    return response.data;
  },

  // Send message
  sendMessage: async (id, payload) => {
    const response = await api.post(`/messages/${id}/send`, payload);
    return response.data;
  },

  // Mark message as received
  receiveMessage: async (id) => {
    const response = await api.post(`/messages/${id}/receive`);
    return response.data;
  },
};

