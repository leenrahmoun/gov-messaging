import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { messagesAPI } from '../api/messages';
import { attachmentsAPI } from '../api/attachments';
import { usersAPI } from '../api/users';
import Loader from '../components/Loader';
import { validateRequired } from '../utils/validation';

const Compose = () => {
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    type: 'internal',
    priority: 'normal',
    recipientIds: [],
  });
  const [recipients, setRecipients] = useState({
    admins: [],
    managers: [],
    employees: []
  });
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingRecipients, setLoadingRecipients] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecipients();
  }, []);

  const fetchRecipients = async () => {
    try {
      const response = await usersAPI.getRecipients();
      // Backend returns { success: true, data: { grouped: { admins, managers, employees } } }
      if (response && response.data && response.data.grouped) {
        setRecipients(response.data.grouped);
      } else if (response && response.grouped) {
        setRecipients(response.grouped);
      } else if (response && response.data && response.data.recipients) {
        // Fallback: build grouped from recipients array
        const r = response.data.recipients;
        setRecipients({
          admins: r.filter(u => u.role === 'admin'),
          managers: r.filter(u => u.role === 'manager'),
          employees: r.filter(u => u.role === 'employee')
        });
      } else {
        setRecipients({ admins: [], managers: [], employees: [] });
      }
    } catch (err) {
      console.error('Error fetching recipients:', err);
      setError('Failed to load recipients');
    } finally {
      setLoadingRecipients(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRecipientChange = (e) => {
    // support multi-select
    const options = Array.from(e.target.options || []);
    const selected = options.filter(o => o.selected).map(o => parseInt(o.value, 10)).filter(Boolean);
    setFormData(prev => ({ ...prev, recipientIds: selected }));
    setSelectedRecipient(selected.length ? selected[0] : null);
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!validateRequired(formData.title)) {
      setError('Title is required');
      return;
    }

    if (!validateRequired(formData.body)) {
      setError('Message body is required');
      return;
    }

    if (!formData.recipientIds || formData.recipientIds.length === 0) {
      setError('Please select at least one recipient');
      return;
    }

    setLoading(true);

    try {
      // Create message - map frontend field names to backend expected field names
      const messageData = {
        subject: formData.title,           // Backend expects 'subject', frontend uses 'title'
        content: formData.body,            // Backend expects 'content', frontend uses 'body'
        message_type: formData.type,       // Backend expects 'message_type', frontend uses 'type'
        priority: formData.priority,
        recipient_ids: formData.recipientIds, // Multiple recipients
        recipient_emails: [],               // Optional: for external recipients
        requires_approval: formData.type === 'official' || formData.type === 'external' // Auto-set based on type
      };

      const response = await messagesAPI.createMessage(messageData);
      
      // Extract message ID from response - backend returns: { success: true, data: { message: {...} } }
      const messageId = response?.data?.message?.id || response?.data?.id || response?.message?.id || response?.id;

      if (!messageId) {
        console.error('Failed to extract message ID from response:', response);
        throw new Error('Failed to create message - no message ID returned');
      }

      // Upload attachments if any
      if (files.length > 0) {
        for (const file of files) {
          try {
            await attachmentsAPI.uploadAttachment(messageId, file);
          } catch (err) {
            console.error('Error uploading file:', err);
            // Continue even if one file fails
          }
        }
      }

      navigate(`/messages/${messageId}`);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to create message'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingRecipients) {
    return (
      <DashboardLayout>
        <Loader text="Loading recipients..." />
      </DashboardLayout>
    );
  }

  const allRecipients = [
    ...(recipients.admins || []),
    ...(recipients.managers || []),
    ...(recipients.employees || [])
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Compose Message</h1>
          <p className="text-gray-600 mt-1">Create a new message</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="input-field"
              placeholder="Enter message title"
              required
            />
          </div>

          <div>
            <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
              Message Body <span className="text-red-500">*</span>
            </label>
            <textarea
              id="body"
              name="body"
              value={formData.body}
              onChange={handleInputChange}
              className="input-field"
              rows="8"
              placeholder="Enter your message"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="internal">Internal</option>
                <option value="external">External</option>
                <option value="official">Official</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-2">
              Recipient <span className="text-red-500">*</span>
            </label>
            <select
              id="recipient"
              value={formData.recipientIds.map(String)}
              onChange={handleRecipientChange}
              className="input-field"
              multiple
              required
            >
              {(recipients.admins || []).length > 0 && (
                <optgroup label="Admins">
                  {recipients.admins.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.name} ({user.email})
                    </option>
                  ))}
                </optgroup>
              )}

              {(recipients.managers || []).length > 0 && (
                <optgroup label="Managers">
                  {recipients.managers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.name} - {user.department_name} ({user.email})
                    </option>
                  ))}
                </optgroup>
              )}

              {(recipients.employees || []).length > 0 && (
                <optgroup label="Employees">
                  {recipients.employees.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.name} - {user.department_name} ({user.email})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            {formData.recipientIds && formData.recipientIds.length > 0 && (
              <p className="mt-2 text-sm text-gray-600">
                ✓ {formData.recipientIds.length} recipient(s) selected
              </p>
            )}
          </div>

          <div>
            <label htmlFor="files" className="block text-sm font-medium text-gray-700 mb-2">
              Attachments
            </label>
            <input
              id="files"
              type="file"
              multiple
              onChange={handleFileChange}
              className="input-field"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
            />
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                  >
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading || !selectedRecipient}>
              {loading ? 'Creating...' : 'Create Message'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default Compose;

