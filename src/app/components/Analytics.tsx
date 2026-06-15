import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, ArrowUpRight, ArrowDownLeft, Download, Calendar, Filter } from 'lucide-react';
import { BarChart, Bar, PieChart as RePieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { useFinance } from '../context/FinanceContext';

export default function Analytics() {
  const { transactions, balance, totalIncome, totalExpense } = useFinance();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [exportFormat, setExportFormat] = useState('PDF');

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

  // Compute monthlyData
  const monthlyData = useMemo(() => {
    if (transactions.length === 0) {
      return [{ month: 'Current', income: 0, expenses: 0, savings: 0 }];
    }
    return [
      { month: 'Current', income: totalIncome, expenses: totalExpense, savings: totalIncome - totalExpense }
    ];
  }, [transactions, totalIncome, totalExpense]);

  const handleExport = () => {
    const fileName = `MoneyLoop_Analytics_${new Date().toISOString().split('T')[0]}`;
    
    if (exportFormat === 'PDF') {
      // PDF export logic here
      console.log('Exporting as PDF:', fileName);
    } else if (exportFormat === 'CSV') {
      // CSV export logic here
      console.log('Exporting as CSV:', fileName);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-none w-full mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-2">Detailed financial insights and trends</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2">
            <Calendar className="w-4 h-4 text-gray-600" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border-0 bg-transparent text-sm font-medium focus:outline-none"
            >
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Total Balance</span>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{balance.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Total Income</span>
            <ArrowDownLeft className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">₹{totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Total Expenses</span>
            <ArrowUpRight className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600">₹{totalExpense.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Net Savings</span>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-600">₹{(totalIncome - totalExpense).toLocaleString()}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income & Expense Trend */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 bg-white rounded-xl p-6 shadow-lg border border-gray-200"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Income & Expense Flow</h2>
              <p className="text-sm text-gray-500">Overall financial trend</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#incomeGradient)"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="#ef4444"
                strokeWidth={3}
                fill="url(#expenseGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Expense Breakdown */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Expenses</h2>
              <p className="text-sm text-gray-500">By category</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <Filter className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            {categoryData.length > 0 ? (
              <RePieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                  }}
                />
              </RePieChart>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No expense data</div>
            )}
          </ResponsiveContainer>
          <div className="space-y-2 mt-4 max-h-[120px] overflow-y-auto">
            {categoryData.slice(0, 3).map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{cat.percentage}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
