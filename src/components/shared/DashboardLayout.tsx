import { ReactNode, useState, useEffect } from 'react';
import { User } from '../../App';
import { 
  LogOut, 
  Bell, 
  Settings,
  Hospital,
  X,
  Check,
  AlertCircle,
  Info,
  UserPlus,
  Calendar
} from 'lucide-react';

interface DashboardLayoutProps {
  user: User;
  onLogout: () => void;
  children: ReactNode;
  sidebar: ReactNode;
}

export function DashboardLayout({ user, onLogout, children, sidebar }: DashboardLayoutProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    // Load sample notifications - in production, fetch from API
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    const sampleNotifications = [
      {
        id: '1',
        type: 'info',
        title: 'New Patient Registered',
        message: 'A new patient has been registered in the system',
        time: new Date(Date.now() - 5 * 60000).toISOString(),
        read: false
      },
      {
        id: '2',
        type: 'success',
        title: 'Staff Account Created',
        message: 'New staff member added to the system',
        time: new Date(Date.now() - 30 * 60000).toISOString(),
        read: false
      },
      {
        id: '3',
        type: 'warning',
        title: 'Appointment Scheduled',
        message: 'New appointment has been scheduled for tomorrow',
        time: new Date(Date.now() - 2 * 3600000).toISOString(),
        read: true
      }
    ];
    setNotifications(sampleNotifications);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <Check className="size-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="size-5 text-amber-600" />;
      case 'error':
        return <AlertCircle className="size-5 text-red-600" />;
      default:
        return <Info className="size-5 text-blue-600" />;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Hospital className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg">OPAL HMS</h1>
              <p className="text-xs text-gray-500">Hospital Management</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4">
          {sidebar}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{user.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="size-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl">Welcome back, {user.name.split(' ')[0]}</h2>
              <p className="text-sm text-gray-600">{user.department || 'Opal Hospital'}</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Notifications Button */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Bell className="size-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Panel */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-[32rem] flex flex-col">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg">Notifications</h3>
                        <p className="text-xs text-gray-600">{unreadCount} unread</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            Mark all read
                          </button>
                        )}
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell className="size-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-600">No notifications</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              onClick={() => markAsRead(notification.id)}
                              className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                                !notification.read ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="flex gap-3">
                                <div className="flex-shrink-0 mt-1">
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between mb-1">
                                    <p className="text-sm">{notification.title}</p>
                                    {!notification.read && (
                                      <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1.5" />
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-600 mb-2">{notification.message}</p>
                                  <p className="text-xs text-gray-400">{getTimeAgo(notification.time)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="p-3 border-t border-gray-200">
                      <button className="w-full text-sm text-blue-600 hover:text-blue-700 py-2">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="size-5 text-gray-600" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>

      {/* Overlay for notifications */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
}