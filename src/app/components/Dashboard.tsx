import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, TrendingDown, IndianRupee, ArrowUpRight, ArrowDownLeft, Bell, Settings, Download, Plus, Zap, Target, Calendar, CreditCard, Sparkles, X, User, FileText, ChevronRight, LogOut, Trash2 } from 'lucide-react';
import { BarChart, Bar, PieChart as RePieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { useFinance, Transaction, Goal, Bill } from '../context/FinanceContext';
import { apiService } from '../services/api';
import { useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const savingsTips = [
  { icon: '🎯', tip: 'Priority: Your 40% savings goal has been set! Automate your transfer today.', color: 'from-indigo-500 to-purple-600' },
  { icon: '🍽️', tip: 'Planning your meals could save you 15% more this month.', color: 'from-green-500 to-emerald-600' },
  { icon: '💡', tip: 'Based on your salary, you can afford ₹2,000 more for investments.', color: 'from-blue-500 to-cyan-600' },
];

export default function Dashboard({ user, onLogout, onViewTransactions }: any) {
  const displayUser = user || { name: 'John Doe', email: 'johndoe@email.com' };
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [exportDateRange, setExportDateRange] = useState('this_month');
  const [exportFormat, setExportFormat] = useState('PDF');
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<{ month: number; year: number } | null>(null);

  const { transactions, goals, bills, addTransaction, addGoal, addBill, payBill, balance, totalIncome, totalExpense, clearAllData } = useFinance();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const response = await apiService.getNotifications();
      if (response.success && response.data) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.notifications.filter((n: any) => !n.is_read).length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await apiService.markNotificationAsRead(id);
      setNotifications(prev => prev.map(n =>
        n.id === id ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Mark all unread notifications as read
      const unreadNotifications = notifications.filter(n => !n.is_read);
      for (const notification of unreadNotifications) {
        await apiService.markNotificationAsRead(notification.id);
      }
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Compute categoryData
  const categoryData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const categoryTotals = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + Math.abs(curr.amount);
      return acc;
    }, {} as Record<string, number>);

    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6b7280'];
    let i = 0;
    return Object.entries(categoryTotals).map(([name, val]) => {
      const value = val as number;
      const percentage = totalExpense > 0 ? ((value / totalExpense) * 100).toFixed(1) : '0';
      return {
        name,
        value,
        color: colors[i++ % colors.length],
        percentage: parseFloat(percentage)
      };
    }).sort((a, b) => b.value - a.value);
  }, [transactions, totalExpense]);

  // Compute monthlyData (simplified for prototype)
  const monthlyData = useMemo(() => {
    if (transactions.length === 0) {
      return [{ month: 'Current', income: 0, expenses: 0, savings: 0 }];
    }
    return [
      { month: 'Current', income: totalIncome, expenses: totalExpense, savings: totalIncome - totalExpense }
    ];
  }, [transactions, totalIncome, totalExpense]);

  const recentTransactions = transactions.slice(0, 5);
  const upcomingBills = bills.filter(b => b.status !== 'paid').slice(0, 3);

  const handleExport = useCallback(() => {
    const now = new Date();
    let filteredTransactions = transactions;

    if (exportDateRange === 'this_month') {
      filteredTransactions = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (exportDateRange === 'last_month') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
      filteredTransactions = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
      });
    } else if (exportDateRange === 'select_month' && selectedMonth) {
      filteredTransactions = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === selectedMonth.month && d.getFullYear() === selectedMonth.year;
      });
    }

    if (filteredTransactions.length === 0) {
      alert("No transaction data found for the selected period!");
      return;
    }

    const fileName = `MoneyLoop_Report_${new Date().toISOString().split('T')[0]}`;

    if (exportFormat === 'CSV') {
      const headers = ['Date', 'Description', 'Category', 'Type', 'Amount (INR)'];
      const csvContent = [
        headers.join(','),
        ...filteredTransactions.map(t =>
          [t.date, `"${t.name}"`, `"${t.category}"`, t.type, t.amount].join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${fileName}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (exportFormat === 'Excel') {
      const worksheet = XLSX.utils.json_to_sheet(filteredTransactions.map(t => ({
        Date: t.date,
        Description: t.name,
        Category: t.category,
        Type: t.type,
        'Amount (INR)': t.amount
      })));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
    } else if (exportFormat === 'PDF') {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text('MoneyLoop Financial Report', 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
      doc.text(`Period: ${exportDateRange}`, 14, 38);

      const tableData = filteredTransactions.map(t => [
        t.date,
        t.name,
        t.category,
        t.type,
        `₹${t.amount}`
      ]);

      autoTable(doc, {
        startY: 45,
        head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] }, // Indigo color
      });

      doc.save(`${fileName}.pdf`);
    }

    setActiveModal(null);
  }, [transactions, exportDateRange, selectedMonth, exportFormat]);

  const renderModalContent = () => {
    switch (activeModal) {
      case 'Profile':
        return (
          <div className="flex flex-col md:flex-row gap-8 min-h-[500px]">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 space-y-8 border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-8">
              <div className="text-center md:text-left px-2">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg mx-auto md:mx-0 flex items-center justify-center mb-4 border-4 border-white">
                  <User className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{displayUser.name}</h3>
                <p className="text-sm text-gray-500 truncate">{displayUser.email}</p>
              </div>

              <nav className="space-y-1">
                {[
                  { icon: User, label: 'Personal Information', active: true },
                  { icon: Calendar, label: 'Language', active: false },
                  { icon: CreditCard, label: 'Security', active: false },
                  { icon: Zap, label: 'Theme', active: false },
                ].map((item) => (
                  <button
                    key={item.label}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${item.active
                        ? 'bg-indigo-900 text-white shadow-md shadow-indigo-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
                      }`}
                  >
                    <item.icon className={`w-5 h-5 ${item.active ? 'text-white' : 'text-gray-400'}`} />
                    {item.label}
                  </button>
                ))}
              </nav>

              <div className="pt-4 px-2">
                <button
                  onClick={() => {
                    setActiveModal(null);
                    if (onLogout) onLogout();
                  }}
                  className="w-full flex items-center gap-3 text-sm font-bold text-red-500 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-5 h-5" /> Sign Out
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 space-y-8">
              <div className="md:pt-4">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Profile Settings</h1>
                <p className="text-sm text-gray-500 font-medium">Manage your account settings and preferences</p>
              </div>

              <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border-2 border-gray-50 shadow-2xl shadow-gray-200/50 space-y-8">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Personal Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                      <input
                        type="text"
                        defaultValue={displayUser.name}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
                    <div className="relative group">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                      <input
                        type="email"
                        defaultValue={displayUser.email}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Mobile Number</label>
                  <div className="relative group">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="tel"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium"
                      placeholder="Enter your mobile number"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveModal(null)}
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 hover:shadow-2xl hover:shadow-indigo-300 transition-all"
                  >
                    Save Changes
                  </motion.button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start gap-4">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-indigo-900 uppercase tracking-wider">Premium Member</p>
                  <p className="text-xs text-indigo-700 mt-0.5">You have access to all advanced financial tools and reports.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'Notifications':
        return (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-4 items-start p-4 rounded-2xl transition-all border ${!n.is_read ? 'bg-indigo-50/50 border-indigo-100 shadow-sm' : 'bg-gray-50/50 border-gray-100 opacity-70'
                    }`}
                  onClick={() => !n.is_read && markAsRead(n.id)}
                >
                  <div className={`p-2 rounded-xl ${n.type === 'success' ? 'bg-green-100 text-green-600' :
                      n.type === 'warning' ? 'bg-orange-100 text-orange-600' :
                        n.type === 'error' ? 'bg-red-100 text-red-600' :
                          'bg-blue-100 text-blue-600'
                    }`}>
                    <Bell className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className="font-bold text-gray-900 text-sm truncate">{n.title}</p>
                      {!n.is_read && <div className="w-2 h-2 bg-indigo-600 rounded-full mt-1.5 shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed mt-0.5">{n.message}</p>
                    <span className="text-[10px] text-gray-400 font-medium mt-1 block">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">No notifications yet</p>
              </div>
            )}
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="w-full text-center text-indigo-600 font-bold text-xs py-2 hover:bg-indigo-50 rounded-lg transition-colors mt-2"
              >
                Mark all as read
              </button>
            )}
          </div>
        );

      case 'Settings':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">Email Notifications</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-indigo-600" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">Dark Mode</span>
              <input type="checkbox" className="w-5 h-5 accent-indigo-600" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">Two-Factor Auth</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-indigo-600" />
            </div>
            <div className="pt-2">
              <label className="block text-sm text-gray-600 mb-1">Currency</label>
              <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500">
                <option>INR (₹)</option>
              </select>
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="w-full mt-4 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition shadow-lg"
            >
              Save Changes
            </button>
          </div>
        );

      case 'Export': {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        const getDateRangeLabel = () => {
          if (exportDateRange === 'this_month') return 'This Month';
          if (exportDateRange === 'last_month') return 'Last Month';
          if (exportDateRange === 'select_month' && selectedMonth) {
            return `${monthNames[selectedMonth.month]} ${selectedMonth.year}`;
          }
          return 'Select a month';
        };
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Format</label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500"
              >
                <option value="PDF">PDF Report</option>
                <option value="CSV">CSV Spreadsheet</option>
                <option value="Excel">Excel Worksheet</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Date Range</label>
              <select
                value={exportDateRange}
                onChange={(e) => {
                  setExportDateRange(e.target.value);
                  if (e.target.value !== 'select_month') setSelectedMonth(null);
                  if (e.target.value === 'select_month') setPickerYear(now.getFullYear());
                }}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500"
              >
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="select_month">Select Month…</option>
              </select>
            </div>

            {/* Inline month picker calendar */}
            {exportDateRange === 'select_month' && (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setPickerYear(y => y - 1)}
                    className="p-2 rounded-xl hover:bg-gray-200 transition-colors text-gray-600 font-bold text-lg"
                  >
                    ‹
                  </button>
                  <span className="font-bold text-gray-800 text-lg">{pickerYear}</span>
                  <button
                    type="button"
                    onClick={() => setPickerYear(y => y + 1)}
                    className="p-2 rounded-xl hover:bg-gray-200 transition-colors text-gray-600 font-bold text-lg"
                  >
                    ›
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {monthNames.map((m, idx) => {
                    const isSelected = selectedMonth?.month === idx && selectedMonth?.year === pickerYear;
                    const isFuture = pickerYear > now.getFullYear() || (pickerYear === now.getFullYear() && idx > now.getMonth());
                    return (
                      <button
                        key={m}
                        type="button"
                        disabled={isFuture}
                        onClick={() => setSelectedMonth({ month: idx, year: pickerYear })}
                        className={`py-2 rounded-xl text-sm font-medium transition-all ${isSelected
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md scale-105'
                          : isFuture
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-indigo-100 hover:text-indigo-700'
                          }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
                {selectedMonth && (
                  <p className="text-center text-sm text-indigo-600 font-semibold pt-1">
                    Selected: {monthNames[selectedMonth.month]} {selectedMonth.year}
                  </p>
                )}
              </div>
            )}

            <button
              onClick={handleExport}
              disabled={exportDateRange === 'select_month' && !selectedMonth}
              className={`w-full mt-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition ${exportDateRange === 'select_month' && !selectedMonth ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
              <Download className="w-5 h-5" /> Download Report
            </button>
          </div>
        );
      }

      case 'Add Expense':
        return (
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            addTransaction({
              name: 'Expense',
              amount: -Number(formData.get('amount')),
              category: formData.get('category') as string,
              date: formData.get('date') as string,
              type: 'expense'
            });
            setActiveModal(null);
          }} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Amount</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input name="amount" type="number" step="0.01" required placeholder="0.00" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Category</label>
              <select name="category" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500">
                <option>Food & Dining</option>
                <option>Transportation</option>
                <option>Shopping</option>
                <option>Entertainment</option>
                <option>Bills & Utilities</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Date</label>
              <input name="date" type="date" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500" />
            </div>
            <button type="submit" className="w-full mt-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition">
              Save Expense
            </button>
          </form>
        );

      case 'Add Income':
        return (
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            addTransaction({
              name: 'Income',
              amount: Number(formData.get('amount')),
              category: formData.get('source') as string,
              date: formData.get('date') as string,
              type: 'income'
            });
            setActiveModal(null);
          }} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Amount</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input name="amount" type="number" step="0.01" required placeholder="0.00" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Source</label>
              <select name="source" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500">
                <option>Salary</option>
                <option>Freelance</option>
                <option>Investments</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Date</label>
              <input name="date" type="date" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500" />
            </div>
            <button type="submit" className="w-full mt-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition">
              Save Income
            </button>
          </form>
        );

      case 'Set Goal':
        return (
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            addGoal({
              name: formData.get('name') as string,
              targetAmount: Number(formData.get('amount')),
              targetDate: formData.get('date') as string
            });
            setActiveModal(null);
          }} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Goal Name</label>
              <input name="name" type="text" required placeholder="e.g. New Car, Vacation" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Target Amount</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input name="amount" type="number" step="0.01" required placeholder="0.00" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Target Date</label>
              <input name="date" type="date" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500" />
            </div>
            <button type="submit" className="w-full mt-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition">
              Create Goal
            </button>
          </form>
        );

      case 'Pay Bill':
        return (
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            payBill(formData.get('billId') as string);
            setActiveModal(null);
          }} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Select Bill</label>
              <select name="billId" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500">
                {upcomingBills.length > 0 ? upcomingBills.map(b => (
                  <option key={b.id} value={b.id}>{b.name} (₹{b.amount})</option>
                )) : <option value="">No pending bills</option>}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Payment Method</label>
              <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500">
                <option>Main Checking (**** 1234)</option>
                <option>Credit Card (**** 5678)</option>
              </select>
            </div>
            <button type="submit" className="w-full mt-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition">
              Pay Now
            </button>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-none w-full mx-auto pb-12 md:pb-6">
      {/* Header with Actions */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Financial Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your financial overview</p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          {/* Notifications Button */}
          <button
            onClick={() => setActiveModal('Notifications')}
            className="relative flex items-center justify-center w-12 h-12 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Bell className="w-6 h-6" />
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setActiveModal('Settings')}
            className="flex items-center justify-center w-12 h-12 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Balance"
          value={`₹${balance.toFixed(2)}`}
          change="Real-time"
          isPositive={balance >= 0}
          icon={IndianRupee}
          gradient="from-indigo-500 via-purple-500 to-pink-500"
          iconBg="from-indigo-600 to-purple-600"
        />
        <StatsCard
          title="Total Income"
          value={`₹${totalIncome.toFixed(2)}`}
          change="Real-time"
          isPositive={true}
          icon={ArrowDownLeft}
          gradient="from-green-500 via-emerald-500 to-teal-500"
          iconBg="from-green-600 to-emerald-600"
        />
        <StatsCard
          title="Total Expenses"
          value={`₹${totalExpense.toFixed(2)}`}
          change="Real-time"
          isPositive={false}
          icon={ArrowUpRight}
          gradient="from-orange-500 via-red-500 to-pink-500"
          iconBg="from-orange-600 to-red-600"
        />
        <StatsCard
          title="Active Goals"
          value={`${goals.length}`}
          change="Real-time"
          isPositive={true}
          icon={Target}
          gradient="from-blue-500 via-cyan-500 to-teal-500"
          iconBg="from-blue-600 to-cyan-600"
        />
      </div>

      {/* Quick Actions & Features */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white rounded-xl p-3 shadow-md border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-base font-bold text-gray-900">Recent Activity</h2>
              <p className="text-xs text-gray-500">Latest transactions</p>
            </div>
            <button
              onClick={onViewTransactions}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-2">
            {recentTransactions.length > 0 ? recentTransactions.map((transaction) => (
              <motion.div
                key={transaction.id}
                whileHover={{ scale: 1.01, x: 4 }}
                className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${transaction.type === 'income'
                    ? 'bg-gradient-to-br from-green-100 to-emerald-100'
                    : 'bg-gradient-to-br from-red-100 to-pink-100'
                    }`}>
                    {transaction.type === 'income' ? (
                      <ArrowDownLeft className="w-5 h-5 text-green-600" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{transaction.name}</p>
                    <p className="text-sm text-gray-500">{transaction.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-lg ${transaction.type === 'income' ? 'text-green-600' : 'text-gray-900'
                    }`}>
                    {transaction.type === 'income' ? '+' : '-'}₹{Math.abs(transaction.amount).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">{transaction.category}</p>
                </div>
              </motion.div>
            )) : <p className="text-gray-500 p-4 text-center">No transactions found</p>}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="space-y-6">
          {/* Goals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 shadow-xl border-2 border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900">Goals</h3>
              </div>
            </div>
            <div className="space-y-2">
              {goals.length > 0 ? goals
                .filter((goal, index, self) => 
                  index === self.findIndex((g) => g.name === goal.name)
                )
                .slice(0, 3)
                .map((goal) => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100;
                return (
                  <div
                    key={goal.id}
                    className="p-3 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-900 text-sm">{goal.name}</p>
                      <p className="font-bold text-blue-600 text-sm">{progress.toFixed(0)}%</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-600">Target: ₹{goal.targetAmount.toLocaleString()}</p>
                      <p className="text-xs text-gray-600">Saved: ₹{goal.currentAmount.toLocaleString()}</p>
                    </div>
                  </div>
                );
              }) : <p className="text-gray-500 text-sm">No goals set yet</p>}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 shadow-xl border-2 border-gray-100"
          >
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-gray-900">Quick Actions</h3>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => setActiveModal('Set Goal')}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 hover:bg-blue-100 transition-colors"
              >
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Set Goal</span>
              </button>
              <button
                onClick={() => setActiveModal('Pay Bill')}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 hover:bg-purple-100 transition-colors"
              >
                <CreditCard className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Pay Bill</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-6"
      >
        <QuickActionCard icon={Plus} title="Add Expense" gradient="from-red-500 to-pink-500" onClick={() => setActiveModal('Add Expense')} />
        <QuickActionCard icon={ArrowDownLeft} title="Add Income" gradient="from-green-500 to-emerald-500" onClick={() => setActiveModal('Add Income')} />
        <QuickActionCard icon={Target} title="Set Goal" gradient="from-blue-500 to-cyan-500" onClick={() => setActiveModal('Set Goal')} />
        <QuickActionCard icon={CreditCard} title="Pay Bill" gradient="from-purple-500 to-pink-500" onClick={() => setActiveModal('Pay Bill')} />
      </motion.div>
      {/* Action Modal */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`${activeModal === 'Profile' ? 'bg-white max-w-4xl' : 'bg-white max-w-md'} rounded-3xl p-6 w-full shadow-2xl relative overflow-hidden`}
            >
              {activeModal === 'Profile' && (
                <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-yellow-500/10 to-transparent pointer-events-none" />
              )}
              <div className="flex items-center justify-between mb-2 relative z-10">
                <h3 className={`text-2xl font-bold ${activeModal === 'Profile' ? 'hidden' : 'text-gray-900'}`}>{activeModal}</h3>
                <button
                  onClick={() => setActiveModal(null)}
                  className={`p-2 rounded-xl transition-colors ml-auto ${activeModal === 'Profile' ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100'}`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="mt-2 relative z-10">
                {renderModalContent()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatsCard({ title, value, change, isPositive, icon: Icon, gradient, iconBg }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-all relative overflow-hidden group"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-3 bg-gradient-to-br ${iconBg} rounded-xl shadow-sm`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
            {change}
          </span>
        </div>
        <p className="text-sm font-semibold text-gray-500 mb-0.5">{title}</p>
        <p className="text-2xl md:text-3xl font-black text-gray-900">{value}</p>
      </div>
    </motion.div>
  );
}

function CustomButton({ icon: Icon, text, variant = 'gradient', size = 'md', onClick }: any) {
  const variants = {
    gradient: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40',
    outline: 'bg-white border-2 border-gray-200 text-gray-700 hover:border-indigo-300 hover:shadow-md',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3',
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`${variants[variant]} ${sizes[size]} rounded-2xl font-semibold flex items-center gap-2 transition-all`}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {text && <span>{text}</span>}
    </motion.button>
  );
}

function QuickActionCard({ icon: Icon, title, gradient, onClick }: any) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.95 }}
      className={`bg-gradient-to-br ${gradient} py-8 px-4 rounded-[2rem] shadow-lg text-white hover:shadow-xl transition-all w-full`}
    >
      <Icon className="w-8 h-8 mb-3 mx-auto" />
      <p className="font-bold text-sm">{title}</p>
    </motion.button>
  );
}
