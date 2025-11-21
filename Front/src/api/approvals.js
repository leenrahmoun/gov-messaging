import api from './axios';

export const approvalsAPI = {
  // Get all approvals
  getApprovals: async (filters = {}) => {
    const response = await api.get('/approvals', { params: filters });
    return response.data;
  },

  // Get approval by ID
  getApprovalById: async (id) => {
    const response = await api.get(`/approvals/${id}`);
    return response.data;
  },

  // Approve message
  approveMessage: async (id, comments = '') => {
    const response = await api.post(`/approvals/${id}/approve`, { comments });
    return response.data;
  },

  // Reject message
  rejectMessage: async (id, comments = '') => {
    const response = await api.post(`/approvals/${id}/reject`, { comments });
    return response.data;
  },
};

