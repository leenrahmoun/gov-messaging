import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { usersAPI } from '../api/users';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'employee',
    department: '',
    is_active: true,
  });
  const [departments, setDepartments] = useState([]);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchUsers();
      fetchDepartments();
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getUsers();
      
      // Handle different response structures from backend
      let usersArray = [];
      if (Array.isArray(response)) {
        usersArray = response;
      } else if (response?.data?.users && Array.isArray(response.data.users)) {
        usersArray = response.data.users;
      } else if (response?.users && Array.isArray(response.users)) {
        usersArray = response.users;
      } else if (response?.data && Array.isArray(response.data)) {
        usersArray = response.data;
      }
      
      setUsers(usersArray);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
      console.error('Error fetching users:', err);
      setUsers([]); // Ensure users is always an array
    } finally {
      setLoading(false);
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.username || !formData.email || !formData.password || !formData.full_name) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const selectedDepartment = Array.isArray(departments)
        ? departments.find(
            (dept) =>
              dept.name &&
              formData.department &&
              dept.name.toLowerCase() === formData.department.toLowerCase()
          )
        : null;

      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role: formData.role,
        is_active: formData.is_active,
        status: 'active',
      };

      if (selectedDepartment) {
        payload.department_id = selectedDepartment.id;
      } else if (formData.department) {
        payload.department = formData.department;
      }

      const response = await usersAPI.createUser(payload);
      if (response.success !== false) {
        setShowAddForm(false);
        setFormData({
          username: '',
          email: '',
          password: '',
          full_name: '',
          role: 'employee',
          department: '',
          is_active: true,
        });
        fetchUsers(); // Refresh list
        fetchDepartments(); // Refresh departments in case a new one was created
      } else {
        setError(response.message || 'Failed to create user');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create user';
      setError(errorMessage);
      console.error('Error creating user:', err);
    }
  };

  const handleDeleteUser = async (id, username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleteLoading(id);
      setError(''); // Clear previous errors
      const response = await usersAPI.deleteUser(id);
      if (response.success !== false) {
        fetchUsers(); // Refresh list
      } else {
        setError(response.message || 'Failed to delete user');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete user';
      setError(errorMessage);
      console.error('Error deleting user:', err);
    } finally {
      setDeleteLoading(null);
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-red-200 text-red-800',
      manager: 'bg-blue-200 text-blue-800',
      employee: 'bg-gray-200 text-gray-800',
    };
    const normalizedRole = role === 'user' ? 'employee' : role;
    return badges[normalizedRole] || badges.employee;
  };

  if (currentUser?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="card">
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Access denied. Admin only.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <Loader text="Loading users..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Users</h1>
            <p className="text-gray-600 mt-1">Manage system users</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary"
          >
            {showAddForm ? 'Cancel' : '+ Add User'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {showAddForm && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New User</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="username"
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter username"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter password (min 6 characters)"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="full_name"
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    id="department"
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter department name"
                    list="department-options"
                  />
                  <datalist id="department-options">
                    {Array.isArray(departments) &&
                      departments.map((dept) => (
                        <option key={dept.id} value={dept.name} />
                      ))}
                  </datalist>
                </div>
              </div>
              <div className="flex items-center">
                <input
                  id="is_active"
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-gov-blue focus:ring-gov-blue"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  Active (user can login)
                </label>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({
                      username: '',
                      email: '',
                      password: '',
                      full_name: '',
                      role: 'user',
                      department: '',
                      is_active: true,
                    });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create User
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card">
          {!Array.isArray(users) || users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.isArray(users) &&
                    users.map((user) => {
                      const normalizedRole =
                        user.role === 'user' ? 'employee' : user.role;
                      const departmentName =
                        user.department_name || user.department || '—';
                      const statusText =
                        user.status || (user.is_active ? 'active' : 'inactive');

                      return (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name || user.name || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadge(
                                normalizedRole
                              )}`}
                            >
                              {normalizedRole}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {departmentName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                statusText === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {statusText}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {user.id !== currentUser?.id && (
                              <button
                                onClick={() =>
                                  handleDeleteUser(
                                    user.id,
                                    user.full_name || user.username
                                  )
                                }
                                disabled={deleteLoading === user.id}
                                className="text-red-600 hover:text-red-800 disabled:opacity-50"
                              >
                                {deleteLoading === user.id ? 'Deleting...' : 'Delete'}
                              </button>
                            )}
                            {user.id === currentUser?.id && (
                              <span className="text-gray-400 text-xs">Current user</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Users;

