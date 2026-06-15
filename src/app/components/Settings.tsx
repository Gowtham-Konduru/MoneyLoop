import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Shield, Bell, Palette, Brain, Database, Globe,
  DollarSign, Link2, FileText, Gift, Crown, HelpCircle, Search,
  ChevronRight, ChevronDown, Check, X, RefreshCcw, Zap, Lock,
  Smartphone, Mail, Cloud, Trash2, Download,
  Moon, Sun, Sparkles, TrendingUp, ArrowLeft,
  CreditCard, HardDrive, Star, MessageSquare,
  Eye, Monitor, Wifi, WifiOff, LogOut, Settings as SettingsIcon,
  ChevronUp, AlertTriangle, BarChart3, Clock, MapPin
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { toast } from 'sonner';

interface SettingsProps {
  user: { name: string; email: string } | null;
  onBack: () => void;
  onLogout: () => void;
}

const ACCENT_COLORS = [
  { name: 'Ocean', value: '#1B4FFF', gradient: 'from-blue-500 to-indigo-600' },
  { name: 'Emerald', value: '#00C896', gradient: 'from-emerald-400 to-teal-600' },
  { name: 'Sunset', value: '#F97316', gradient: 'from-orange-400 to-red-500' },
  { name: 'Violet', value: '#8B5CF6', gradient: 'from-violet-400 to-purple-600' },
  { name: 'Rose', value: '#F43F5E', gradient: 'from-rose-400 to-pink-600' },
  { name: 'Amber', value: '#F59E0B', gradient: 'from-amber-400 to-yellow-600' },
];

interface SettingsCategory {
  id: string;
  icon: any;
  title: string;
  desc: string;
  gradient: string;
  bgLight: string;
  badge?: string;
}

const settingsCategories: SettingsCategory[] = [
  { id: 'profile', icon: User, title: 'Profile & Personalization', desc: 'Manage your identity and preferences', gradient: 'from-blue-500 to-indigo-600', bgLight: 'bg-blue-50' },
  { id: 'security', icon: Shield, title: 'Security & Privacy', desc: 'Protect your account and data', gradient: 'from-emerald-500 to-teal-600', bgLight: 'bg-emerald-50', badge: 'Important' },
  { id: 'notifications', icon: Bell, title: 'Notifications', desc: 'Control alerts and reminders', gradient: 'from-amber-500 to-orange-600', bgLight: 'bg-amber-50' },
  { id: 'appearance', icon: Palette, title: 'Appearance', desc: 'Theme, colors and display', gradient: 'from-violet-500 to-purple-600', bgLight: 'bg-violet-50' },
  { id: 'ai', icon: Brain, title: 'AI Preferences', desc: 'Configure smart insights & RAG', gradient: 'from-pink-500 to-rose-600', bgLight: 'bg-pink-50', badge: 'AI' },
  { id: 'data', icon: Database, title: 'Data & Storage', desc: 'Manage cache, backups & storage', gradient: 'from-slate-500 to-gray-700', bgLight: 'bg-gray-50' },
  { id: 'language', icon: Globe, title: 'Language & Region', desc: 'Locale, timezone & formatting', gradient: 'from-cyan-500 to-sky-600', bgLight: 'bg-cyan-50' },
  { id: 'currency', icon: DollarSign, title: 'Currency Settings', desc: 'Default currency & display', gradient: 'from-green-500 to-emerald-600', bgLight: 'bg-green-50' },
  { id: 'accounts', icon: Link2, title: 'Connected Accounts', desc: 'Bank accounts & linked services', gradient: 'from-indigo-500 to-blue-600', bgLight: 'bg-indigo-50' },
  { id: 'reports', icon: FileText, title: 'Reports & Exports', desc: 'Scheduled reports & data export', gradient: 'from-teal-500 to-cyan-600', bgLight: 'bg-teal-50' },
  { id: 'rewards', icon: Gift, title: 'Rewards', desc: 'Points, referrals & achievements', gradient: 'from-yellow-500 to-amber-600', bgLight: 'bg-yellow-50' },
  { id: 'premium', icon: Crown, title: 'Premium Plans', desc: 'Subscription & billing', gradient: 'from-purple-500 to-violet-700', bgLight: 'bg-purple-50', badge: 'PRO' },
  { id: 'help', icon: HelpCircle, title: 'Help & Support', desc: 'FAQ, feedback & contact us', gradient: 'from-rose-500 to-pink-600', bgLight: 'bg-rose-50' },
];

export default function Settings({ user, onBack, onLogout }: SettingsProps) {
  const displayUser = user || { name: 'User', email: 'user@email.com' };
  const { clearAllData, transactions, goals, budgets } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date>(new Date());

  // All settings state
  const [settings, setSettings] = useState({
    theme: 'light' as 'light' | 'dark' | 'auto',
    accentColor: '#1B4FFF',
    compactMode: false,
    animations: true,
    fontSize: 'medium' as 'small' | 'medium' | 'large',
    pushNotifications: true,
    emailReports: false,
    budgetAlerts: true,
    aiInsightAlerts: true,
    weeklyDigest: false,
    smsAlerts: false,
    goalReminders: true,
    billReminders: true,
    twoFactor: false,
    biometric: false,
    sessionTimeout: '30',
    loginAlerts: true,
    dataSharing: false,
    screenLock: false,
    aiEnabled: true,
    ragMode: 'balanced' as 'conservative' | 'balanced' | 'aggressive',
    suggestionFrequency: 'daily' as 'realtime' | 'daily' | 'weekly',
    personalizedTips: true,
    spendingAnalysis: true,
    currency: 'INR',
    language: 'English (US)',
    timezone: 'Asia/Kolkata (IST)',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'Indian (1,00,000)',
    autoBackup: true,
    cacheEnabled: true,
    analyticsEnabled: true,
    autoReports: false,
    reportFormat: 'PDF',
    reportFrequency: 'monthly',
  });

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast.success(`Setting updated`);
  };

  // Profile completion score
  const profileScore = useMemo(() => {
    let score = 0;
    if (displayUser.name && displayUser.name !== 'User') score += 20;
    if (displayUser.email && displayUser.email !== 'user@email.com') score += 20;
    if (settings.twoFactor) score += 15;
    if (settings.pushNotifications) score += 10;
    if (settings.aiEnabled) score += 10;
    if (transactions.length > 0) score += 10;
    if (goals.length > 0) score += 10;
    if (settings.autoBackup) score += 5;
    return Math.min(100, score);
  }, [displayUser, settings, transactions, goals]);

  // Security score
  const securityScore = useMemo(() => {
    let score = 30; // base
    if (settings.twoFactor) score += 25;
    if (settings.biometric) score += 15;
    if (settings.loginAlerts) score += 10;
    if (settings.screenLock) score += 10;
    if (!settings.dataSharing) score += 10;
    return Math.min(100, score);
  }, [settings]);

  // Storage usage (mock data)
  const storageData = useMemo(() => {
    const txSize = transactions.length * 0.5; // ~0.5KB per transaction
    const goalSize = goals.length * 0.3;
    const budgetSize = budgets.length * 0.2;
    const cacheSize = settings.cacheEnabled ? 12.4 : 0;
    const total = txSize + goalSize + budgetSize + cacheSize;
    return {
      transactions: txSize.toFixed(1),
      goals: goalSize.toFixed(1),
      budgets: budgetSize.toFixed(1),
      cache: cacheSize.toFixed(1),
      total: total.toFixed(1),
      limit: 100,
      percentage: Math.min(100, (total / 100) * 100),
    };
  }, [transactions, goals, budgets, settings.cacheEnabled]);

  // Sync handler
  const handleSync = async () => {
    setIsSyncing(true);
    await new Promise(r => setTimeout(r, 2000));
    setLastSynced(new Date());
    setIsSyncing(false);
    toast.success('All data synced successfully');
  };

  // Reset handler
  const handleResetData = async () => {
    setIsResetting(true);
    try {
      await clearAllData();
      toast.success('All data has been reset successfully.');
      setShowResetModal(false);
    } catch {
      toast.error('Failed to reset data. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return settingsCategories;
    const q = searchQuery.toLowerCase();
    return settingsCategories.filter(
      c => c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // AI Recommendations
  const aiRecommendations = useMemo(() => {
    const recs: { icon: any; text: string; action: string; color: string }[] = [];
    if (!settings.twoFactor) recs.push({ icon: Shield, text: 'Enable Two-Factor Authentication for better security', action: 'security', color: 'text-emerald-600' });
    if (!settings.autoBackup) recs.push({ icon: Cloud, text: 'Turn on automatic backups to protect your data', action: 'data', color: 'text-blue-600' });
    if (!settings.aiEnabled) recs.push({ icon: Brain, text: 'Enable AI insights to get personalized financial tips', action: 'ai', color: 'text-pink-600' });
    if (!settings.budgetAlerts) recs.push({ icon: Bell, text: 'Enable budget alerts to stay on track', action: 'notifications', color: 'text-amber-600' });
    if (transactions.length === 0) recs.push({ icon: TrendingUp, text: 'Add your first transaction to start tracking', action: 'data', color: 'text-indigo-600' });
    return recs;
  }, [settings, transactions]);

  // Toggle component
  const Toggle = ({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 min-w-0 mr-4">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-7 rounded-full transition-all duration-300 ${checked ? 'bg-gradient-to-r from-[#1B4FFF] to-[#00C896] shadow-lg shadow-[#1B4FFF]/20' : 'bg-gray-200'}`}
      >
        <motion.div
          animate={{ x: checked ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
        />
      </button>
    </div>
  );

  // Section header
  const SectionTitle = ({ children }: { children: string }) => (
    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 mt-1">{children}</p>
  );

  // Render category content
  const renderCategoryContent = (id: string) => {
    switch (id) {
      case 'profile':
        return (
          <div className="space-y-4">
            <SectionTitle>Account Information</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Display Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" defaultValue={displayUser.name} className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-[#1B4FFF] focus:ring-2 focus:ring-[#1B4FFF]/10 transition-all" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="email" defaultValue={displayUser.email} className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-[#1B4FFF] focus:ring-2 focus:ring-[#1B4FFF]/10 transition-all" />
                </div>
              </div>
            </div>
            <SectionTitle>Preferences</SectionTitle>
            <Toggle checked={settings.compactMode} onChange={(v) => updateSetting('compactMode', v)} label="Compact Mode" desc="Use a denser layout with smaller elements" />
            <Toggle checked={settings.animations} onChange={(v) => updateSetting('animations', v)} label="Enable Animations" desc="Smooth transitions and micro-interactions" />
          </div>
        );

      case 'security':
        return (
          <div className="space-y-4">
            <SectionTitle>Authentication</SectionTitle>
            <Toggle checked={settings.twoFactor} onChange={(v) => updateSetting('twoFactor', v)} label="Two-Factor Authentication" desc="Require a verification code on login" />
            <Toggle checked={settings.biometric} onChange={(v) => updateSetting('biometric', v)} label="Biometric Login" desc="Use fingerprint or Face ID" />
            <Toggle checked={settings.screenLock} onChange={(v) => updateSetting('screenLock', v)} label="App Lock" desc="Require PIN when opening the app" />
            <SectionTitle>Privacy</SectionTitle>
            <Toggle checked={settings.loginAlerts} onChange={(v) => updateSetting('loginAlerts', v)} label="Login Alerts" desc="Get notified of new sign-ins" />
            <Toggle checked={settings.dataSharing} onChange={(v) => updateSetting('dataSharing', v)} label="Data Sharing" desc="Share anonymized usage data for improvements" />
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">Session Timeout</label>
              <select value={settings.sessionTimeout} onChange={(e) => updateSetting('sessionTimeout', e.target.value)} className="w-full py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-[#1B4FFF] transition-all">
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="never">Never</option>
              </select>
            </div>
            {/* Security Score */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm"><Shield className="w-5 h-5 text-emerald-600" /></div>
                <div>
                  <p className="text-sm font-bold text-emerald-900">Security Score: {securityScore}/100</p>
                  <p className="text-xs text-emerald-700">{securityScore >= 80 ? 'Excellent protection!' : securityScore >= 50 ? 'Good, but can be improved' : 'Needs attention'}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-4">
            <SectionTitle>Alert Types</SectionTitle>
            <Toggle checked={settings.pushNotifications} onChange={(v) => updateSetting('pushNotifications', v)} label="Push Notifications" desc="Real-time alerts on your device" />
            <Toggle checked={settings.emailReports} onChange={(v) => updateSetting('emailReports', v)} label="Email Reports" desc="Periodic summaries to your inbox" />
            <Toggle checked={settings.smsAlerts} onChange={(v) => updateSetting('smsAlerts', v)} label="SMS Alerts" desc="Text messages for critical updates" />
            <SectionTitle>Financial Alerts</SectionTitle>
            <Toggle checked={settings.budgetAlerts} onChange={(v) => updateSetting('budgetAlerts', v)} label="Budget Alerts" desc="Notify when reaching 80% of budget" />
            <Toggle checked={settings.goalReminders} onChange={(v) => updateSetting('goalReminders', v)} label="Goal Reminders" desc="Progress updates on savings goals" />
            <Toggle checked={settings.billReminders} onChange={(v) => updateSetting('billReminders', v)} label="Bill Reminders" desc="Upcoming payment due date alerts" />
            <Toggle checked={settings.aiInsightAlerts} onChange={(v) => updateSetting('aiInsightAlerts', v)} label="AI Insights" desc="Smart tips based on spending patterns" />
            <Toggle checked={settings.weeklyDigest} onChange={(v) => updateSetting('weeklyDigest', v)} label="Weekly Digest" desc="Summary of your financial week" />
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-4">
            <SectionTitle>Theme</SectionTitle>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'light', icon: Sun, label: 'Light' },
                { id: 'dark', icon: Moon, label: 'Dark' },
                { id: 'auto', icon: Monitor, label: 'System' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => updateSetting('theme', t.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${settings.theme === t.id ? 'border-[#1B4FFF] bg-[#1B4FFF]/5 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <t.icon className={`w-5 h-5 ${settings.theme === t.id ? 'text-[#1B4FFF]' : 'text-gray-500'}`} />
                  <span className={`text-xs font-bold ${settings.theme === t.id ? 'text-[#1B4FFF]' : 'text-gray-600'}`}>{t.label}</span>
                </button>
              ))}
            </div>
            <SectionTitle>Accent Color</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {ACCENT_COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => updateSetting('accentColor', c.value)}
                  className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${c.gradient} transition-all hover:scale-110 ${settings.accentColor === c.value ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : ''}`}
                  title={c.name}
                >
                  {settings.accentColor === c.value && <Check className="w-4 h-4 text-white absolute inset-0 m-auto" />}
                </button>
              ))}
            </div>
            <SectionTitle>Display</SectionTitle>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">Font Size</label>
              <div className="grid grid-cols-3 gap-2">
                {(['small', 'medium', 'large'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => updateSetting('fontSize', s)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold capitalize border-2 transition-all ${settings.fontSize === s ? 'border-[#1B4FFF] bg-[#1B4FFF]/5 text-[#1B4FFF]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className="space-y-4">
            <SectionTitle>AI Engine</SectionTitle>
            <Toggle checked={settings.aiEnabled} onChange={(v) => updateSetting('aiEnabled', v)} label="Enable AI Insights" desc="Get intelligent financial recommendations" />
            <Toggle checked={settings.personalizedTips} onChange={(v) => updateSetting('personalizedTips', v)} label="Personalized Tips" desc="Tailored advice based on your spending" />
            <Toggle checked={settings.spendingAnalysis} onChange={(v) => updateSetting('spendingAnalysis', v)} label="Auto Spending Analysis" desc="AI analyzes your transactions automatically" />
            <SectionTitle>RAG Configuration</SectionTitle>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">Analysis Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: 'conservative', label: 'Safe', desc: 'Minimal risk' },
                  { id: 'balanced', label: 'Balanced', desc: 'Optimal mix' },
                  { id: 'aggressive', label: 'Growth', desc: 'Max returns' },
                ] as const).map(m => (
                  <button
                    key={m.id}
                    onClick={() => updateSetting('ragMode', m.id)}
                    className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${settings.ragMode === m.id ? 'border-[#1B4FFF] bg-[#1B4FFF]/5 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <span className={`text-xs font-bold ${settings.ragMode === m.id ? 'text-[#1B4FFF]' : 'text-gray-700'}`}>{m.label}</span>
                    <span className="text-[10px] text-gray-500">{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">Suggestion Frequency</label>
              <select value={settings.suggestionFrequency} onChange={(e) => updateSetting('suggestionFrequency', e.target.value)} className="w-full py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-[#1B4FFF] transition-all">
                <option value="realtime">Real-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm"><Sparkles className="w-5 h-5 text-pink-600" /></div>
                <div>
                  <p className="text-sm font-bold text-pink-900">Context-Aware RAG Active</p>
                  <p className="text-xs text-pink-700">AI uses your financial context for better insights</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-4">
            <SectionTitle>Storage Usage</SectionTitle>
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-800">{storageData.total} MB used</span>
                <span className="text-xs text-gray-500">{storageData.limit} MB limit</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${storageData.percentage}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${storageData.percentage > 80 ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-[#1B4FFF] to-[#00C896]'}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded bg-blue-500" /><span className="text-gray-600">Transactions: {storageData.transactions} MB</span></div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded bg-emerald-500" /><span className="text-gray-600">Goals: {storageData.goals} MB</span></div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded bg-violet-500" /><span className="text-gray-600">Budgets: {storageData.budgets} MB</span></div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded bg-amber-500" /><span className="text-gray-600">Cache: {storageData.cache} MB</span></div>
              </div>
            </div>
            <SectionTitle>Management</SectionTitle>
            <Toggle checked={settings.autoBackup} onChange={(v) => updateSetting('autoBackup', v)} label="Automatic Backups" desc="Sync your data to cloud daily" />
            <Toggle checked={settings.cacheEnabled} onChange={(v) => updateSetting('cacheEnabled', v)} label="Enable Cache" desc="Faster loading but uses more storage" />
            <Toggle checked={settings.analyticsEnabled} onChange={(v) => updateSetting('analyticsEnabled', v)} label="Usage Analytics" desc="Help improve MoneyLoop with usage data" />
            <button onClick={() => { updateSetting('cacheEnabled', false); toast.success('Cache cleared'); }} className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all group">
              <div className="flex items-center gap-3">
                <HardDrive className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">Clear Cache</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </button>
            {/* Danger Zone */}
            <div className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-200">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <p className="text-sm font-bold text-red-800">Danger Zone</p>
              </div>
              <p className="text-xs text-red-600 mb-3">Permanently delete all your financial data. This cannot be undone.</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowResetModal(true)}
                className="w-full py-2.5 bg-red-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" /> Reset All Data
              </motion.button>
            </div>
          </div>
        );

      case 'language':
        return (
          <div className="space-y-4">
            <SectionTitle>Language</SectionTitle>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">App Language</label>
              <select value={settings.language} onChange={(e) => updateSetting('language', e.target.value)} className="w-full py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-[#1B4FFF] transition-all">
                <option>English (US)</option>
                <option>English (UK)</option>
                <option>Hindi</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
                <option>Japanese</option>
              </select>
            </div>
            <SectionTitle>Region</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Timezone</label>
                <select value={settings.timezone} onChange={(e) => updateSetting('timezone', e.target.value)} className="w-full py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-[#1B4FFF] transition-all">
                  <option>Asia/Kolkata (IST)</option>
                  <option>America/New_York (EST)</option>
                  <option>Europe/London (GMT)</option>
                  <option>Asia/Tokyo (JST)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Date Format</label>
                <select value={settings.dateFormat} onChange={(e) => updateSetting('dateFormat', e.target.value)} className="w-full py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-[#1B4FFF] transition-all">
                  <option>DD/MM/YYYY</option>
                  <option>MM/DD/YYYY</option>
                  <option>YYYY-MM-DD</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">Number Format</label>
              <select value={settings.numberFormat} onChange={(e) => updateSetting('numberFormat', e.target.value)} className="w-full py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-[#1B4FFF] transition-all">
                <option>Indian (1,00,000)</option>
                <option>International (100,000)</option>
                <option>European (100.000)</option>
              </select>
            </div>
          </div>
        );

      case 'currency':
        return (
          <div className="space-y-4">
            <SectionTitle>Default Currency</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
                { code: 'USD', symbol: '$', name: 'US Dollar' },
                { code: 'EUR', symbol: '€', name: 'Euro' },
                { code: 'GBP', symbol: '£', name: 'British Pound' },
                { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
                { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
              ].map(c => (
                <button
                  key={c.code}
                  onClick={() => updateSetting('currency', c.code)}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${settings.currency === c.code ? 'border-[#1B4FFF] bg-[#1B4FFF]/5 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <span className={`text-lg font-bold ${settings.currency === c.code ? 'text-[#1B4FFF]' : 'text-gray-600'}`}>{c.symbol}</span>
                  <div className="text-left">
                    <p className={`text-xs font-bold ${settings.currency === c.code ? 'text-[#1B4FFF]' : 'text-gray-700'}`}>{c.code}</p>
                    <p className="text-[10px] text-gray-500 truncate">{c.name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'accounts':
        return (
          <div className="space-y-4">
            <SectionTitle>Linked Accounts</SectionTitle>
            {[
              { name: 'HDFC Bank', type: 'Savings Account', last4: '4521', connected: true, icon: CreditCard, color: 'text-blue-600' },
              { name: 'SBI Card', type: 'Credit Card', last4: '8832', connected: true, icon: CreditCard, color: 'text-indigo-600' },
              { name: 'Google Pay', type: 'UPI', last4: '9087', connected: false, icon: Smartphone, color: 'text-green-600' },
            ].map((acc) => (
              <div key={acc.name} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className={`p-2 bg-white rounded-lg shadow-sm ${acc.color}`}><acc.icon className="w-4 h-4" /></div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{acc.name}</p>
                    <p className="text-xs text-gray-500">{acc.type} •••• {acc.last4}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${acc.connected ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                  {acc.connected ? 'Connected' : 'Link'}
                </span>
              </div>
            ))}
            <button className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm font-bold text-gray-500 hover:border-[#1B4FFF] hover:text-[#1B4FFF] transition-all flex items-center justify-center gap-2">
              <Link2 className="w-4 h-4" /> Connect New Account
            </button>
          </div>
        );

      case 'reports':
        return (
          <div className="space-y-4">
            <SectionTitle>Automated Reports</SectionTitle>
            <Toggle checked={settings.autoReports} onChange={(v) => updateSetting('autoReports', v)} label="Auto-Generate Reports" desc="Automatically create financial reports" />
            {settings.autoReports && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Format</label>
                  <select value={settings.reportFormat} onChange={(e) => updateSetting('reportFormat', e.target.value)} className="w-full py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-[#1B4FFF] transition-all">
                    <option>PDF</option>
                    <option>Excel</option>
                    <option>CSV</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Frequency</label>
                  <select value={settings.reportFrequency} onChange={(e) => updateSetting('reportFrequency', e.target.value)} className="w-full py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-[#1B4FFF] transition-all">
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
              </motion.div>
            )}
            <button className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all group">
              <div className="flex items-center gap-3">
                <Download className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">Export All Data Now</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        );

      case 'rewards':
        return (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400 text-white text-center space-y-2 shadow-xl">
              <Star className="w-8 h-8 mx-auto" />
              <p className="text-3xl font-black">1,250</p>
              <p className="text-sm font-bold text-white/80">MoneyLoop Points</p>
            </div>
            <SectionTitle>Achievements</SectionTitle>
            {[
              { name: 'First Transaction', desc: 'Added your first entry', earned: transactions.length > 0, points: 50 },
              { name: 'Budget Master', desc: 'Created 3+ budgets', earned: budgets.length >= 3, points: 100 },
              { name: 'Goal Setter', desc: 'Set your first goal', earned: goals.length > 0, points: 75 },
              { name: 'Security Pro', desc: 'Enable 2FA', earned: settings.twoFactor, points: 200 },
            ].map(a => (
              <div key={a.name} className={`flex items-center justify-between p-3 rounded-xl border ${a.earned ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${a.earned ? 'bg-amber-200 text-amber-700' : 'bg-gray-200 text-gray-400'}`}>
                    {a.earned ? <Check className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{a.name}</p>
                    <p className="text-xs text-gray-500">{a.desc}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold ${a.earned ? 'text-amber-600' : 'text-gray-400'}`}>+{a.points} pts</span>
              </div>
            ))}
          </div>
        );

      case 'premium':
        return (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white space-y-3 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <Crown className="w-8 h-8 relative z-10" />
              <div className="relative z-10">
                <p className="text-sm font-bold text-white/70">Current Plan</p>
                <p className="text-2xl font-black">Free Plan</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-white text-purple-700 rounded-xl font-bold text-sm shadow-lg relative z-10"
              >
                Upgrade to Pro — ₹299/mo
              </motion.button>
            </div>
            <SectionTitle>Pro Features</SectionTitle>
            {[
              { feature: 'Unlimited Transactions', free: '100/mo', pro: 'Unlimited' },
              { feature: 'AI Insights', free: 'Basic', pro: 'Advanced RAG' },
              { feature: 'Reports', free: 'Monthly', pro: 'Real-time' },
              { feature: 'Connected Accounts', free: '2', pro: 'Unlimited' },
              { feature: 'Support', free: 'Email', pro: '24/7 Priority' },
            ].map(f => (
              <div key={f.feature} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                <span className="font-bold text-gray-700">{f.feature}</span>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">{f.free}</span>
                  <span className="text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-full">{f.pro}</span>
                </div>
              </div>
            ))}
          </div>
        );

      case 'help':
        return (
          <div className="space-y-4">
            <SectionTitle>Support</SectionTitle>
            {[
              { icon: HelpCircle, label: 'FAQ & Documentation', desc: 'Find answers to common questions' },
              { icon: MessageSquare, label: 'Contact Support', desc: 'Get help from our team' },
              { icon: Star, label: 'Rate MoneyLoop', desc: 'Share your experience' },
              { icon: FileText, label: 'Terms of Service', desc: 'Legal information' },
              { icon: Shield, label: 'Privacy Policy', desc: 'How we handle your data' },
            ].map(item => (
              <button key={item.label} className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all group">
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-gray-500" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-700">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </button>
            ))}
            <div className="text-center pt-4 space-y-1">
              <p className="text-xs text-gray-400 font-bold">MoneyLoop v2.1.0</p>
              <p className="text-[10px] text-gray-400">AI-Powered Finance Platform</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 pb-24 md:pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.1, x: -2 }}
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="p-2.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </motion.button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-[#1B4FFF] to-[#00C896] bg-clip-text text-transparent">Settings</h1>
            <p className="text-xs text-gray-500 font-medium">Customize your MoneyLoop experience</p>
          </div>
        </div>
        {/* Sync Indicator */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSync}
          disabled={isSyncing}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${isSyncing ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}
        >
          {isSyncing ? (
            <><RefreshCcw className="w-4 h-4 animate-spin" /> Syncing...</>
          ) : (
            <><Wifi className="w-4 h-4 text-emerald-500" /> Synced</>
          )}
        </motion.button>
      </motion.div>

      {/* Smart Search */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search settings... (e.g., notifications, theme, privacy)"
            className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-100 rounded-2xl text-sm font-medium outline-none focus:border-[#1B4FFF] focus:ring-4 focus:ring-[#1B4FFF]/10 transition-all shadow-sm placeholder:text-gray-400"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Stats Overview Cards */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Profile Completion */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="18" fill="none" stroke="#E5E7EB" strokeWidth="4" />
                <circle cx="22" cy="22" r="18" fill="none" stroke="url(#profileGrad)" strokeWidth="4" strokeDasharray={`${profileScore * 1.131} 200`} strokeLinecap="round" />
                <defs><linearGradient id="profileGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#1B4FFF" /><stop offset="100%" stopColor="#00C896" /></linearGradient></defs>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-gray-800">{profileScore}%</span>
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-500">Profile</p>
              <p className="text-sm font-black text-gray-900">Complete</p>
            </div>
          </div>
        </div>
        {/* Security Score */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${securityScore >= 70 ? 'bg-emerald-100' : securityScore >= 40 ? 'bg-amber-100' : 'bg-red-100'}`}>
              <Shield className={`w-5 h-5 ${securityScore >= 70 ? 'text-emerald-600' : securityScore >= 40 ? 'text-amber-600' : 'text-red-600'}`} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-500">Security</p>
              <p className="text-sm font-black text-gray-900">{securityScore}/100</p>
            </div>
          </div>
        </div>
        {/* Storage */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-100">
              <HardDrive className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-500">Storage</p>
              <p className="text-sm font-black text-gray-900">{storageData.total} MB</p>
            </div>
          </div>
        </div>
        {/* Plan */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-100">
              <Crown className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-500">Plan</p>
              <p className="text-sm font-black text-gray-900">Free</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Shortcuts */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex flex-wrap gap-2">
        {[
          { label: settings.theme === 'dark' ? 'Light Mode' : 'Dark Mode', icon: settings.theme === 'dark' ? Sun : Moon, action: () => updateSetting('theme', settings.theme === 'dark' ? 'light' : 'dark') },
          { label: settings.pushNotifications ? 'Mute' : 'Unmute', icon: Bell, action: () => updateSetting('pushNotifications', !settings.pushNotifications) },
          { label: settings.twoFactor ? '2FA On' : '2FA Off', icon: Lock, action: () => updateSetting('twoFactor', !settings.twoFactor) },
          { label: 'Export', icon: Download, action: () => toast.success('Export started') },
          { label: 'Sync', icon: Cloud, action: handleSync },
        ].map(s => (
          <motion.button
            key={s.label}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={s.action}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-700 hover:border-[#1B4FFF] hover:text-[#1B4FFF] hover:shadow-md transition-all"
          >
            <s.icon className="w-3.5 h-3.5" /> {s.label}
          </motion.button>
        ))}
      </motion.div>

      {/* AI Recommendations */}
      {aiRecommendations.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-r from-[#1B4FFF]/5 to-[#00C896]/5 border border-[#1B4FFF]/10 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#1B4FFF]" />
            <p className="text-xs font-bold text-[#1B4FFF] uppercase tracking-wider">AI Recommendations</p>
          </div>
          <div className="space-y-2">
            {aiRecommendations.slice(0, 3).map((rec, i) => (
              <motion.button
                key={i}
                whileHover={{ x: 4 }}
                onClick={() => setActiveCategory(rec.action)}
                className="w-full flex items-center gap-3 p-2.5 bg-white/80 rounded-xl hover:bg-white transition-all text-left"
              >
                <rec.icon className={`w-4 h-4 ${rec.color} flex-shrink-0`} />
                <span className="text-xs font-medium text-gray-700 flex-1">{rec.text}</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Settings Categories Grid */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredCategories.map((cat, idx) => {
          const isOpen = activeCategory === cat.id;
          const Icon = cat.icon;
          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * idx }}
              layout
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${isOpen ? 'border-[#1B4FFF]/30 shadow-lg shadow-[#1B4FFF]/5 md:col-span-2' : 'border-gray-100 hover:border-gray-200 hover:shadow-md'}`}
            >
              {/* Category Header */}
              <button
                onClick={() => setActiveCategory(isOpen ? null : cat.id)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${cat.gradient} shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900 truncate">{cat.title}</p>
                    {cat.badge && (
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${cat.badge === 'PRO' ? 'bg-purple-100 text-purple-700' : cat.badge === 'AI' ? 'bg-pink-100 text-pink-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {cat.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{cat.desc}</p>
                </div>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </motion.div>
              </button>

              {/* Expandable Content */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1 border-t border-gray-100">
                      {renderCategoryContent(cat.id)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Sign Out */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="pt-2">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 hover:border-red-200 transition-all"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </motion.div>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isResetting && setShowResetModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-white rounded-[2rem] shadow-2xl p-8 max-w-sm w-full relative z-10 text-center space-y-5"
            >
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 bg-red-100 rounded-2xl" />
                <div className="relative p-4 bg-red-500 rounded-xl shadow-xl shadow-red-500/20 text-white">
                  <Trash2 className="w-6 h-6" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-gray-900">Reset All Data?</h3>
                <p className="text-sm text-gray-500 leading-relaxed">This permanently deletes all transactions, budgets, goals, and notifications.</p>
              </div>
              <div className="flex gap-3">
                <button disabled={isResetting} onClick={() => setShowResetModal(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-all">
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isResetting}
                  onClick={handleResetData}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2"
                >
                  {isResetting ? <><RefreshCcw className="w-4 h-4 animate-spin" /> Resetting...</> : <><Trash2 className="w-4 h-4" /> Reset</>}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
