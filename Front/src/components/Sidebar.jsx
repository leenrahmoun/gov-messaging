import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/messages', label: 'Messages', icon: '✉️' },
    { path: '/compose', label: 'Compose', icon: '✍️' },
  ];

  // Add admin/manager only items
  if (user && (user.role === 'admin' || user.role === 'manager')) {
    menuItems.push(
      { path: '/approvals', label: 'Approvals', icon: '✅' },
      { path: '/users', label: 'Users', icon: '👥' }
    );
  }

  return (
    <aside className="w-64 bg-white shadow-lg min-h-screen">
      <div className="p-4">
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-gov-blue text-white'
                  : 'text-gray-700 hover:bg-gov-gray-light'
              }`}
              aria-current={isActive(item.path) ? 'page' : undefined}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;

