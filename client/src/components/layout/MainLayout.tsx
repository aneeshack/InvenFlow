
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BarChart3, 
  Box, 
  FileText, 
  Home, 
  LogOut, 
  Menu, 
  ShoppingCart, 
  User, 
  Users, 
  X
} from 'lucide-react';
import { CLIENT_API } from '@/util/Axios';
import { toast } from 'sonner';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {

    try {
      const response = await CLIENT_API.post('/logout');
      
      console.log('Login response:', response);
      if (response.status === 200 && response.data.success) {

        logout()
        navigate('/login'); // Redirect to home page
      } else {
        console.error('Unexpected response:', response.data);
        toast.error(response.data.error || 'Login failed: Unexpected response');
      }
    } catch (error) {
      toast.error('Invalid credentials');
    }
  };


  const menuItems = [
    // { name: 'Dashboard', icon: Home, path: '/' },
    { name: 'Inventory', icon: Box, path: '/inventory' },
    { name: 'Customers', icon: Users, path: '/customers' },
    { name: 'Sales', icon: ShoppingCart, path: '/sales' },
    { name: 'Reports', icon: BarChart3, path: '/reports' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b p-4 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md hover:bg-gray-100"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-lg font-bold text-invenflow-blue">InvenFlow</h1>
        <div className="w-8"></div> {/* Empty div for flex justify-between */}
      </header>

      {/* Sidebar (mobile: absolute overlay, desktop: fixed) */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r shadow-sm transition-transform duration-300 flex flex-col`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Box className="h-6 w-6 text-invenflow-purple" />
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-invenflow-blue to-invenflow-purple bg-clip-text text-transparent">
              InvenFlow
            </h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-md hover:bg-gray-100 md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                navigate(item.path);
                setSidebarOpen(false);
              }}
              className={`flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon size={18} />
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <User size={16} />
            </div>
            <div className="text-sm">
              <p className="font-medium">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1  md:w-0">
        <div className="container py-6 md:py-8 px-4 md:px-8 max-w-full">
          {children}
        </div>
      </main>

      {/* Overlay when sidebar is open on mobile */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default MainLayout;
