import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { messagesAPI } from '../api/messages';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import { normalizeMessages } from '../utils/messageUtils';

const Dashboard = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await messagesAPI.getMessages({ limit: 10 });
      
      // Handle different response structures from backend
      let messagesArray = [];
      if (Array.isArray(response)) {
        messagesArray = response;
      } else if (response?.data?.messages && Array.isArray(response.data.messages)) {
        messagesArray = response.data.messages;
      } else if (response?.messages && Array.isArray(response.messages)) {
        messagesArray = response.messages;
      } else if (response?.data && Array.isArray(response.data)) {
        messagesArray = response.data;
      }
      
      // Normalize messages from backend format to frontend format
      setMessages(normalizeMessages(messagesArray));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load messages');
      console.error('Error fetching messages:', err);
      setMessages([]); // Ensure messages is always an array
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-gray-200 text-gray-800',
      sent: 'bg-green-200 text-green-800',
      pending: 'bg-yellow-200 text-yellow-800',
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

  if (loading) {
    return (
      <DashboardLayout>
        <Loader text="Loading dashboard..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {user?.full_name || user?.name || user?.email || 'User'}
            </p>
          </div>
          <Link to="/compose" className="btn-primary">
            + New Message
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Messages</h3>
            <p className="text-3xl font-bold text-gov-blue">
              {Array.isArray(messages) ? messages.length : 0}
            </p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Sent Messages</h3>
            <p className="text-3xl font-bold text-green-600">
              {Array.isArray(messages) ? messages.filter((m) => m.status === 'sent').length : 0}
            </p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {Array.isArray(messages) ? messages.filter((m) => m.status === 'pending').length : 0}
            </p>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Messages</h2>
          
          {!Array.isArray(messages) || messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No messages yet</p>
              <Link to="/compose" className="btn-primary inline-block">
                Create Your First Message
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
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
                  {Array.isArray(messages) && messages.map((message) => (
                    <tr key={message.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {message.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">{message.type}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadge(
                            message.priority
                          )}`}
                        >
                          {message.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                            message.status
                          )}`}
                        >
                          {message.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(message.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          to={`/messages/${message.id}`}
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

export default Dashboard;

