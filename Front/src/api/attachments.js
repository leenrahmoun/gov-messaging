import api from './axios';

export const attachmentsAPI = {
  // Upload attachment
  uploadAttachment: async (messageId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/attachments/${messageId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get attachments for a message
  getAttachments: async (messageId) => {
    const response = await api.get(`/attachments/${messageId}`);
    return response.data;
  },

  // Download attachment
  downloadAttachment: async (attachmentId) => {
    const response = await api.get(`/attachments/download/${attachmentId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Delete attachment
  deleteAttachment: async (attachmentId) => {
    const response = await api.delete(`/attachments/${attachmentId}`);
    return response.data;
  },
};

