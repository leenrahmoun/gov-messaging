import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { messagesAPI } from '../api/messages';
import { attachmentsAPI } from '../api/attachments';
import { usersAPI } from '../api/users';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import { normalizeMessage } from '../utils/messageUtils';

const ViewMessage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [message, setMessage] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [sendDepartmentId, setSendDepartmentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchMessage();
    fetchAttachments();
  }, [id]);

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'manager') {
      fetchDepartments();
    } else {
      setDepartments([]);
    }
  }, [user]);

  const fetchMessage = async () => {
    try {
      setLoading(true);
      const response = await messagesAPI.getMessageById(id);
      const rawMessage = response?.data?.message || response?.message || response?.data || response;
      const normalized = normalizeMessage(rawMessage);
      setMessage(normalized);
      setSendDepartmentId(
        normalized.receiver_department_id || null
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load message');
      console.error('Error fetching message:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttachments = async () => {
    try {
      const response = await attachmentsAPI.getAttachments(id);
      
      // Handle different response structures from backend
      let attachmentsArray = [];
      if (Array.isArray(response)) {
        attachmentsArray = response;
      } else if (response?.data?.attachments && Array.isArray(response.data.attachments)) {
        attachmentsArray = response.data.attachments;
      } else if (response?.attachments && Array.isArray(response.attachments)) {
        attachmentsArray = response.attachments;
      } else if (response?.data && Array.isArray(response.data)) {
        attachmentsArray = response.data;
      }
      
      setAttachments(attachmentsArray);
    } catch (err) {
      console.error('Error fetching attachments:', err);
      setAttachments([]); // Ensure attachments is always an array
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await usersAPI.getDepartments();
      const departmentList =
        response?.data?.departments ||
        response?.departments ||
        [];
      setDepartments(Array.isArray(departmentList) ? departmentList : []);
    } catch (err) {
      console.error('Error fetching departments:', err);
      setDepartments([]);
    }
  };

  const handleDownload = async (attachmentId, filename) => {
    try {
      setDownloading(attachmentId);
      const blob = await attachmentsAPI.downloadAttachment(attachmentId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading attachment:', err);
      alert('Failed to download attachment');
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      setActionLoading(true);
      await messagesAPI.deleteMessage(id);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete message');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitForApproval = async () => {
    try {
      setActionLoading(true);
      await messagesAPI.submitMessage(id);
      await fetchMessage();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit message');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      const notes = window.prompt('Approval notes (optional):', '');
      setActionLoading(true);
      await messagesAPI.approveMessage(id, { notes });
      await fetchMessage();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve message');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = window.prompt('Please provide a rejection reason:');
    if (!reason) {
      return;
    }
    try {
      setActionLoading(true);
      await messagesAPI.rejectMessage(id, { notes: reason });
      await fetchMessage();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject message');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSend = async () => {
    if (!sendDepartmentId) {
      setError('Please select a receiver department before sending.');
      return;
    }
    try {
      setActionLoading(true);
      await messagesAPI.sendMessage(id, {
        receiver_department_id: sendDepartmentId
      });
      await fetchMessage();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkReceived = async () => {
    try {
      setActionLoading(true);
      await messagesAPI.receiveMessage(id);
      await fetchMessage();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark message as received');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-gray-200 text-gray-800',
      pending_approval: 'bg-yellow-200 text-yellow-800',
      approved: 'bg-blue-200 text-blue-800',
      sent: 'bg-green-200 text-green-800',
      received: 'bg-green-300 text-green-900',
      rejected: 'bg-red-200 text-red-800',
    };
    return badges[status] || badges.draft;
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      low: 'bg-blue-200 text-blue-800',
      normal: 'bg-gray-200 text-gray-800',
      high: 'bg-orange-200 text-orange-800',
      urgent: 'bg-red-200 text-red-800',
    };
    return badges[priority] || badges.normal;
  };

  const userDepartmentId = user?.department_id || user?.departmentId || null;
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isSender = message && user?.id === message.sender_id;
  const senderDepartmentId = message?.sender_department_id || null;
  const receiverDepartmentId = message?.receiver_department_id || null;

  const canSubmit =
    message &&
    ['draft', 'rejected'].includes(message.status) &&
    (isAdmin ||
      (isManager && userDepartmentId && senderDepartmentId === userDepartmentId) ||
      isSender);

  const canApprove =
    message &&
    message.status === 'pending_approval' &&
    (isAdmin ||
      (isManager && userDepartmentId && senderDepartmentId === userDepartmentId));

  const canSend =
    message &&
    (message.status === 'approved' || isAdmin) &&
    (isAdmin ||
      isSender ||
      (isManager && userDepartmentId && senderDepartmentId === userDepartmentId));

  const canReceive =
    message &&
    message.status === 'sent' &&
    (isAdmin ||
      (isManager && userDepartmentId && receiverDepartmentId === userDepartmentId));

  const canDelete =
    message &&
    (isAdmin ||
      (isSender && ['draft', 'rejected'].includes(message.status)) ||
      (isManager &&
        userDepartmentId &&
        senderDepartmentId === userDepartmentId &&
        ['draft', 'rejected'].includes(message.status)));

  const departmentOptions = Array.isArray(departments) ? departments : [];

  if (loading) {
    return (
      <DashboardLayout>
        <Loader text="Loading message..." />
      </DashboardLayout>
    );
  }

  if (!message) {
    return (
      <DashboardLayout>
        <div className="card">
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Message not found</p>
            <Link to="/dashboard" className="btn-primary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Link to="/dashboard" className="text-gov-blue hover:text-gov-blue-dark">
            ← Back to Dashboard
          </Link>
          <div className="flex flex-wrap gap-2">
            {canSubmit && (
              <button
                onClick={handleSubmitForApproval}
                className="btn-primary"
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Submit for Approval'}
              </button>
            )}
            {canApprove && (
              <>
                <button
                  onClick={handleApprove}
                  className="btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Processing...' : 'Approve'}
                </button>
                <button
                  onClick={handleReject}
                  className="btn-secondary text-red-600"
                  disabled={actionLoading}
                >
                  Reject
                </button>
              </>
            )}
            {canSend && (
              <button
                onClick={handleSend}
                className="btn-primary"
                disabled={actionLoading}
              >
                {actionLoading ? 'Sending...' : 'Send Message'}
              </button>
            )}
            {canReceive && (
              <button
                onClick={handleMarkReceived}
                className="btn-secondary"
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Mark as Received'}
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                className="btn-secondary text-red-600"
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="card">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{message.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-gray-500">Type:</span>
                <span className="ml-2 font-medium">{message.type}</span>
              </div>
              <div>
                <span className="text-gray-500">Priority:</span>
                <span
                  className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getPriorityBadge(
                    message.priority
                  )}`}
                >
                  {message.priority}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <span
                  className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                    message.status
                  )}`}
                >
                  {message.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Receiver Dept:</span>
                <span className="ml-2 font-medium">
                  {message.receiver_department_name || 'Not assigned'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2 font-medium">
                  {new Date(message.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            {canSend && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Receiver Department
                </label>
                <select
                  value={sendDepartmentId || ''}
                  onChange={(e) =>
                    setSendDepartmentId(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  className="input-field w-full md:w-1/2"
                  disabled={actionLoading}
                >
                  <option value="">Choose department</option>
                  {departmentOptions.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Message Body</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{message.body}</p>
            </div>
          </div>

          {message.recipients && Array.isArray(message.recipients) && message.recipients.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Recipients</h2>
              <div className="flex flex-wrap gap-2">
                {message.recipients.map((recipient) => (
                  <span
                    key={recipient.id}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {recipient.name || recipient.email}
                  </span>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(attachments) && attachments.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Attachments</h2>
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                  >
                    <span className="text-sm text-gray-700">{attachment.filename}</span>
                    <button
                      onClick={() => handleDownload(attachment.id, attachment.filename)}
                      disabled={downloading === attachment.id}
                      className="btn-primary text-sm"
                    >
                      {downloading === attachment.id ? 'Downloading...' : 'Download'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {message.approvals && Array.isArray(message.approvals) && message.approvals.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Approval Status</h2>
              <div className="space-y-2">
                {message.approvals.map((approval) => (
                  <div
                    key={approval.id}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                  >
                    <div>
                      <span className="font-medium">{approval.approver_name}</span>
                      <span
                        className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                          (approval.decision || approval.status) === 'approved'
                            ? 'bg-green-200 text-green-800'
                            : (approval.decision || approval.status) === 'rejected'
                            ? 'bg-red-200 text-red-800'
                            : 'bg-yellow-200 text-yellow-800'
                        }`}
                      >
                        {approval.decision || approval.status}
                      </span>
                    </div>
                    {(approval.notes || approval.comments || approval.comment) && (
                      <p className="text-sm text-gray-600">
                        {approval.notes || approval.comments || approval.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ViewMessage;

