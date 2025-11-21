import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { approvalsAPI } from '../api/approvals';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';

const Approvals = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const { user } = useAuth();
  
  // Check if user can approve/reject (Manager or Admin)
  const canApprove = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      // Fetch all approvals (backend will default to pending for managers/admins)
      const response = await approvalsAPI.getApprovals();
      
      // Handle different response structures from backend
      let approvalsArray = [];
      if (Array.isArray(response)) {
        approvalsArray = response;
      } else if (response?.data?.approvals && Array.isArray(response.data.approvals)) {
        approvalsArray = response.data.approvals;
      } else if (response?.approvals && Array.isArray(response.approvals)) {
        approvalsArray = response.approvals;
      } else if (response?.data && Array.isArray(response.data)) {
        approvalsArray = response.data;
      }
      
      setApprovals(approvalsArray);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load approvals';
      setError(errorMessage);
      console.error('Error fetching approvals:', err);
      setApprovals([]); // Ensure approvals is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, comment = '') => {
    try {
      setActionLoading(id);
      setError(''); // Clear previous errors
      const response = await approvalsAPI.approveMessage(id, comment);
      if (response.success) {
        fetchApprovals(); // Refresh list
      } else {
        setError(response.message || 'Failed to approve message');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to approve message';
      setError(errorMessage);
      console.error('Error approving message:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id, comment = '') => {
    const commentText = prompt('Enter rejection reason (required):');
    if (commentText === null) return; // User cancelled
    if (!commentText.trim()) {
      setError('Rejection reason is required');
      return;
    }

    try {
      setActionLoading(id);
      setError(''); // Clear previous errors
      const response = await approvalsAPI.rejectMessage(id, commentText);
      if (response.success) {
        fetchApprovals(); // Refresh list
      } else {
        setError(response.message || 'Failed to reject message');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to reject message';
      setError(errorMessage);
      console.error('Error rejecting message:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-200 text-yellow-800',
      approved: 'bg-green-200 text-green-800',
      rejected: 'bg-red-200 text-red-800',
    };
    return badges[status] || badges.pending;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Loader text="Loading approvals..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Approvals</h1>
          <p className="text-gray-600 mt-1">Review and approve pending messages</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="card">
          {!Array.isArray(approvals) || approvals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No pending approvals</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requester
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.isArray(approvals) && approvals.map((approval) => (
                    <tr key={approval.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {approval.message_subject || approval.message_title || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {approval.approver_name || approval.requester_name || approval.requester_email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                            approval.status
                          )}`}
                        >
                          {approval.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(approval.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {approval.status === 'pending' && canApprove && (
                          <>
                            <button
                              onClick={() => handleApprove(approval.id)}
                              disabled={actionLoading === approval.id}
                              className="text-green-600 hover:text-green-800 disabled:opacity-50"
                            >
                              {actionLoading === approval.id ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleReject(approval.id)}
                              disabled={actionLoading === approval.id}
                              className="text-red-600 hover:text-red-800 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <Link
                          to={`/messages/${approval.message_id}`}
                          className="text-gov-blue hover:text-gov-blue-dark"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Approvals;

