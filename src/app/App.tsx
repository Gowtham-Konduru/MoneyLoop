import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { apiService } from './services/api';
import { LayoutDashboard, MessageSquare, Receipt, Wallet, Menu, X, LogOut, ChevronDown, User, History, BarChart3 } from 'lucide-react';
import MoneyLoopLogo from './components/ui/MoneyLoopLogo';
import Dashboard from './components/Dashboard';
import AIChat from './components/AIChat';
import Transactions from './components/Transactions';
import Budget from './components/Budget';
import Analytics from './components/Analytics';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import Profile from './components/Profile';
import { FinanceProvider } from './context/FinanceContext';

type NavItem = 'dashboard' | 'ai-chat' | 'transactions' | 'budget' | 'profile' | 'analytics';

const navItems = [
  { id: 'dashboard' as NavItem, label: 'Home', icon: LayoutDashboard },
  { id: 'budget' as NavItem, label: 'Budget', icon: Wallet },
  { id: 'analytics' as NavItem, label: 'Analytics', icon: BarChart3 },
  { id: 'ai-chat' as NavItem, label: 'AI Chat', icon: MessageSquare },
  { id: 'transactions' as NavItem, label: 'History', icon: History },
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ name: string, email: string } | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot-password' | 'verify-otp' | 'reset-password' | null>(null);
  const [activeView, setActiveView] = useState<NavItem>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiService.getCurrentUser();
        if (response.success && response.data) {
          const u = response.data.user as any;
          setUser({
            name: u.username || u.firstName,
            email: u.email
          });
          setIsAuthenticated(true);
        }
      } catch (error) {
        // Not authenticated
      } finally {
        setIsLoadingUser(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch (e) { }
    setIsAuthenticated(false);
    setUser(null);
    setAuthMode(null);
  };

  if (isLoadingUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authMode) {
      return (
        <Auth
          mode={authMode}
          onLogin={(userData) => {
            setUser(userData);
            setIsAuthenticated(true);
          }}
          onBack={() => setAuthMode(null)}
          onSwitchMode={(newMode) => setAuthMode(newMode)}
        />
      );
    }
    return <LandingPage onAuth={(mode) => setAuthMode(mode)} />;
  }

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard user={user} onLogout={handleLogout} onViewTransactions={() => setActiveView('transactions')} />;
      case 'ai-chat':
        return <AIChat onComplete={() => setActiveView('dashboard')} />;
      case 'transactions':
        return <Transactions />;
      case 'budget':
        return <Budget />;
      case 'analytics':
        return <Analytics />;
      case 'profile':
        return <Profile user={user} onLogout={handleLogout} />;
      default:
        return <Dashboard user={user} onLogout={handleLogout} />;
    }
  };

  return (
    <FinanceProvider>
      <div className="size-full flex flex-col md:flex-row bg-gradient-to-br from-gray-50 to-[#1B4FFF]/5 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside
          className={`hidden md:flex flex-col bg-gradient-to-b from-white to-[#00C896]/10 border-r border-gray-100 shadow-xl transition-all duration-300 ${isSidebarOpen ? 'w-72' : 'w-24'}`}
        >
          {/* Logo / Hamburger Button */}
          <div className="p-6 border-b-2 border-gray-200">
            {isSidebarOpen ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                      className="p-3 bg-gradient-to-br from-[#1B4FFF] to-[#00C896] rounded-2xl shadow-lg backdrop-blur-sm"
                    >
                      <MoneyLoopLogo size="md" className="text-white" />
                    </motion.div>
                    <div>
                      <h1 className="text-2xl font-bold bg-gradient-to-r from-[#1B4FFF] to-[#00C896] bg-clip-text text-transparent">
                        MoneyLoop
                      </h1>
                      <p className="text-xs text-gray-600 font-medium">AI Finance</p>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    animate={{ rotate: isSidebarOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Menu className="w-5 h-5 text-gray-600" />
                  </motion.button>
                </div>
              </>
            ) : (
              <div className="flex justify-center">
                <motion.button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  animate={{ rotate: isSidebarOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Menu className="w-5 h-5 text-gray-600" />
                </motion.button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className={`flex-1 ${isSidebarOpen ? 'p-4' : 'p-4'} space-y-2`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <motion.button
                  key={item.id}
                  whileHover={{ x: isSidebarOpen ? 6 : 0, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex ${isSidebarOpen ? 'items-center gap-3 px-5' : 'justify-center'} py-4 rounded-2xl font-semibold transition-all ${isActive
                      ? 'bg-gradient-to-r from-[#1B4FFF] to-[#00C896] text-white shadow-xl shadow-[#1B4FFF]/30'
                      : 'text-gray-700 hover:bg-white/80 hover:shadow-md border border-transparent hover:border-gray-200'
                    }`}
                  title={!isSidebarOpen ? item.label : ''}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {isSidebarOpen && <span>{item.label}</span>}
                </motion.button>
              );
            })}
          </nav>
          
          {/* User Profile in Sidebar with Dropdown */}
          <div className="p-4 border-t-2 border-gray-100 bg-white/50 backdrop-blur-md relative">
            <AnimatePresence>
              {isProfileMenuOpen && isSidebarOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsProfileMenuOpen(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-20 left-4 right-4 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-20 overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        setActiveView('profile');
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 transition-all group"
                    >
                      <div className="p-2 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600">
                        <User className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold">View Profile</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-gray-700 hover:text-red-600 transition-all group"
                    >
                      <div className="p-2 rounded-lg bg-red-50 group-hover:bg-red-100 text-red-600">
                        <LogOut className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold">Logout</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => isSidebarOpen && setIsProfileMenuOpen(!isProfileMenuOpen)}
              className={`w-full flex ${isSidebarOpen ? 'items-center gap-3' : 'justify-center'} p-3 rounded-2xl bg-white border shadow-sm transition-all ${
                isProfileMenuOpen ? 'border-indigo-300 ring-4 ring-indigo-50' : 'border-gray-100'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1B4FFF] to-[#00C896] flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              {isSidebarOpen && (
                <>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-bold text-gray-900 truncate">{user?.name || 'User'}</p>
                    <p className="text-[10px] text-gray-500 truncate font-medium">{user?.email || 'user@email.com'}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                </>
              )}
            </motion.button>
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-gradient-to-r from-[#1B4FFF] to-[#00C896] shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
              <MoneyLoopLogo size="sm" className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                MoneyLoop
              </h1>
              <p className="text-xs text-white/80">AI Finance</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50"
            >
              <nav className="p-4 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveView(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                          ? 'bg-gradient-to-r from-[#1B4FFF] to-[#00C896] text-white shadow-lg shadow-[#1B4FFF]/30'
                          : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="size-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl backdrop-blur-lg">
          <div className="grid grid-cols-4 gap-2 p-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setActiveView(item.id)}
                  className={`flex flex-col items-center gap-1 px-2 py-3 rounded-2xl transition-all font-semibold ${isActive
                      ? 'bg-gradient-to-br from-[#1B4FFF] to-[#00C896] text-white shadow-xl shadow-[#1B4FFF]/30'
                      : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] truncate w-full text-center">
                    {item.label.split(' ')[0]}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </FinanceProvider>
  );
}
