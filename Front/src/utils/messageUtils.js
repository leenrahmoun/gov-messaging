/**
 * Message Utility Functions
 * Normalize message data between backend and frontend formats
 */

/**
 * Normalize a single message from backend format to frontend format
 * Backend uses: subject, content, message_type
 * Frontend uses: title, body, type
 */
export const normalizeMessage = (message) => {
  if (!message) return null;

  return {
    ...message,
    // Map backend field names to frontend field names
    title: message.subject || message.title,
    body: message.content || message.body,
    type: message.message_type || message.type,
    // Keep original fields for API calls
    subject: message.subject,
    content: message.content,
    message_type: message.message_type,
  };
};

/**
 * Normalize an array of messages
 */
export const normalizeMessages = (messages) => {
  if (!Array.isArray(messages)) {
    return [];
  }
  return messages.map(normalizeMessage);
};

/**
 * Convert frontend message format to backend format for API calls
 * Frontend uses: title, body, type
 * Backend expects: subject, content, message_type
 */
export const toBackendFormat = (message) => {
  if (!message) return null;

  return {
    ...message,
    subject: message.title || message.subject,
    content: message.body || message.content,
    message_type: message.type || message.message_type,
    // Remove frontend-specific fields if they exist
    title: undefined,
    body: undefined,
    type: undefined,
  };
};

