import { User, Calendar, CreditCard, Zap, LogOut, FileText, Sparkles, Trash2, RefreshCcw, Pencil, Save, X, Settings, Shield, Bell, Globe, DollarSign, Lock, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFinance } from '../context/FinanceContext';
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { toast } from 'sonner';

interface ProfileProps {
  user: { name: string, email: string } | null;
  onLogout: () => void;
}

export default function Profile({ user, onLogout }: ProfileProps) {
  const displayUser = user || { name: 'User', email: 'user@email.com' };
  const { clearAllData } = useFinance();
  const [activeSection, setActiveSection] = useState<'info' | 'security' | 'settings'>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [securitySettings, setSecuritySettings] = useState({
    twoFactor: false,
    alerts: true
  });
  const [profileData, setProfileData] = useState({
    name: displayUser.name,
    email: displayUser.email,
    phoneNumber: ''
  });

  useEffect(() => {
    const fetchFullProfile = async () => {
      try {
        const response = await apiService.getUserProfile();
        if (response.success && response.data) {
          const u = response.data.user as any;
          setProfileData({
            name: u.username || u.firstName || '',
            email: u.email || '',
            phoneNumber: u.phoneNumber || u.phone_number || ''
          });
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };
    fetchFullProfile();
  }, []);

  const handleResetData = async () => {
    setIsResetting(true);
    try {
      await clearAllData();
      toast.success('All data has been reset successfully.');
      setShowResetModal(false);
    } catch (error) {
      toast.error('Failed to reset all data. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.updateUserProfile({
        username: profileData.name,
        email: profileData.email,
        phoneNumber: profileData.phoneNumber
      });
      if (response.success) {
        toast.success('Profile updated successfully');
        setIsEditing(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiService.changePassword(passwords.current, passwords.new);
      if (response.success) {
        toast.success('Password changed successfully');
        setPasswords({ current: '', new: '', confirm: '' });
        setShowPasswordForm(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSecuritySetting = (setting: 'twoFactor' | 'alerts') => {
    const newVal = !securitySettings[setting];
    setSecuritySettings({ ...securitySettings, [setting]: newVal });
    toast.success(`${setting === 'twoFactor' ? 'Two-Factor Auth' : 'Security Alerts'} ${newVal ? 'enabled' : 'disabled'}`);
    // In a real app, you'd call apiService.updateUserPreferences here
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar-style Navigation inside Profile */}
        <div className="w-full md:w-64 space-y-8 border-b md:border-b-0 md:border-r border-gray-200 pb-6 md:pb-0 md:pr-8">
          <div className="text-center md:text-left px-2">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#1B4FFF] to-[#00C896] shadow-xl mx-auto md:mx-0 flex items-center justify-center mb-4 border-4 border-white">
              <User className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{profileData.name}</h3>
            <p className="text-sm text-gray-500 truncate">{profileData.email}</p>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'info', icon: User, label: 'Personal Info' },
              { id: 'security', icon: Shield, label: 'Security' },
              { id: 'settings', icon: Settings, label: 'Settings' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${activeSection === item.id
                    ? 'bg-[#1B4FFF] text-white shadow-lg shadow-[#1B4FFF]/20'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-[#1B4FFF]'
                  }`}
              >
                <item.icon className={`w-5 h-5 ${activeSection === item.id ? 'text-white' : 'text-gray-400'}`} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="pt-4 px-2">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 text-sm font-bold text-red-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5" /> Sign Out
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              {activeSection === 'info' ? 'Profile Settings' : activeSection === 'security' ? 'Security Center' : 'App Settings'}
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              {activeSection === 'info' ? 'Manage your account settings and preferences' : activeSection === 'security' ? 'Keep your account secure and private' : 'Customize your application experience'}
            </p>
          </div>

          {activeSection === 'info' && (
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-gray-100 shadow-xl space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Personal Information</h2>
                {!isEditing ? (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsEditing(true)}
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                  >
                    <Pencil className="w-5 h-5" />
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsEditing(false)}
                    className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#1B4FFF] transition-colors" />
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      disabled={!isEditing}
                      className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-[#1B4FFF] focus:ring-4 focus:ring-[#1B4FFF]/10 transition-all outline-none font-medium text-gray-900 ${!isEditing && 'opacity-70 cursor-not-allowed'}`}
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
                  <div className="relative group">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#1B4FFF] transition-colors" />
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      disabled={!isEditing}
                      className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-[#1B4FFF] focus:ring-4 focus:ring-[#1B4FFF]/10 transition-all outline-none font-medium text-gray-900 ${!isEditing && 'opacity-70 cursor-not-allowed'}`}
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#1B4FFF] transition-colors" />
                  <input
                    type="email"
                    value={profileData.phoneNumber}
                    onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                    disabled={!isEditing}
                    className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-[#1B4FFF] focus:ring-4 focus:ring-[#1B4FFF]/10 transition-all outline-none font-medium text-gray-900 ${!isEditing && 'opacity-70 cursor-not-allowed'}`}
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {isEditing && (
                <div className="pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={isLoading}
                    className="w-full py-4 bg-gradient-to-r from-[#1B4FFF] to-[#00C896] text-white rounded-2xl font-bold text-lg shadow-xl shadow-[#1B4FFF]/20 hover:shadow-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isLoading ? (
                      <RefreshCcw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    Save Changes
                  </motion.button>
                </div>
              )}
            </div>
          )}

          {activeSection === 'security' && (
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-gray-100 shadow-xl space-y-8">
              <h2 className="text-xl font-bold text-gray-800">Security Settings</h2>

              <div className="space-y-6">
                {/* Password Section */}
                <div className="p-6 rounded-2xl bg-gray-50 border border-transparent hover:border-indigo-100 transition-all space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">Account Password</p>
                        <p className="text-xs text-gray-500 font-medium">Last changed 3 months ago</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPasswordForm(!showPasswordForm)}
                      className="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all"
                    >
                      {showPasswordForm ? 'Cancel' : 'Change Password'}
                    </button>
                  </div>

                  {showPasswordForm && (
                    <form onSubmit={handleChangePassword} className="space-y-4 pt-4 border-t border-gray-200 animate-in fade-in slide-in-from-top-4 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-600 ml-1">Current Password</label>
                          <input
                            type="password"
                            required
                            value={passwords.current}
                            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-[#1B4FFF] outline-none text-sm font-medium"
                            placeholder="••••••••"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-600 ml-1">New Password</label>
                          <input
                            type="password"
                            required
                            value={passwords.new}
                            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-[#1B4FFF] outline-none text-sm font-medium"
                            placeholder="Min 6 characters"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-600 ml-1">Confirm New Password</label>
                        <input
                          type="password"
                          required
                          value={passwords.confirm}
                          onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-[#1B4FFF] outline-none text-sm font-medium"
                          placeholder="••••••••"
                        />
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={isLoading}
                        type="submit"
                        className="w-full py-3 bg-[#1B4FFF] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#1B4FFF]/20 flex items-center justify-center gap-2"
                      >
                        {isLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Update Password
                      </motion.button>
                    </form>
                  )}
                </div>

                {/* 2FA Section */}
                <div className="flex items-center justify-between p-6 rounded-2xl bg-gray-50 border border-transparent hover:border-indigo-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Two-Factor Authentication</p>
                      <p className="text-xs text-gray-500 font-medium">Add an extra layer of protection</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={securitySettings.twoFactor}
                      onChange={() => toggleSecuritySetting('twoFactor')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B4FFF]"></div>
                  </label>
                </div>

                {/* Alerts Section */}
                <div className="flex items-center justify-between p-6 rounded-2xl bg-gray-50 border border-transparent hover:border-indigo-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Security Alerts</p>
                      <p className="text-xs text-gray-500 font-medium">Get notified of suspicious activity</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={securitySettings.alerts}
                      onChange={() => toggleSecuritySetting('alerts')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B4FFF]"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'settings' && (
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-gray-100 shadow-xl space-y-8">
              <h2 className="text-xl font-bold text-gray-800">Application Preferences</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Default Currency</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-[#1B4FFF] transition-all outline-none font-medium text-gray-900 appearance-none" defaultValue="INR">
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="INR">INR (₹)</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Language</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-[#1B4FFF] transition-all outline-none font-medium text-gray-900 appearance-none">
                      <option>English (US)</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1">Notification Settings</h3>
                {[
                  { label: 'Push Notifications', desc: 'Receive real-time alerts on your device', checked: true },
                  { label: 'Email Reports', desc: 'Weekly summary of your finances', checked: false },
                  { label: 'Budget Alerts', desc: 'Notifications when you reach 80% limit', checked: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-800">{item.label}</p>
                      <p className="text-xs text-gray-500 font-medium">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={item.checked} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B4FFF]"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'info' && (
            <div className="p-6 rounded-3xl bg-red-50 border border-red-100 flex items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="text-base font-bold text-red-900 uppercase tracking-wider">Danger Zone</p>
                  <p className="text-sm text-red-700 mt-1">This will permanently delete all your transactions, budgets, and goals.</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowResetModal(true)}
                className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-200 hover:bg-red-700 transition-all flex items-center gap-2"
              >
                <RefreshCcw className="w-4 h-4" /> Reset All Data
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Premium Glassmorphic Confirmation Modal (Mini Screen) */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isResetting && setShowResetModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl p-8 max-w-md w-full relative overflow-hidden text-center space-y-6 z-10"
            >
              {/* Alert Icon with Pulses */}
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-red-100 dark:bg-red-950/50 rounded-3xl"
                />
                <div className="relative p-5 bg-red-500 rounded-[1.5rem] shadow-xl shadow-red-500/20 text-white">
                  <Trash2 className="w-8 h-8" />
                </div>
              </div>

              {/* Title & Desc */}
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  Reset Financial Data?
                </h3>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
                  This action is permanent and cannot be undone. All your transaction history, custom budgets, goals, and notification logs will be deleted forever.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  disabled={isResetting}
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 py-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl transition-all text-sm outline-none focus:ring-2 focus:ring-gray-200"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isResetting}
                  onClick={handleResetData}
                  className="flex-1 py-4 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-700 hover:to-rose-600 text-white font-bold rounded-2xl shadow-lg shadow-red-200 dark:shadow-red-950/20 transition-all flex items-center justify-center gap-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                >
                  {isResetting ? (
                    <>
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                      <span>Resetting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Yes, Reset All</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
