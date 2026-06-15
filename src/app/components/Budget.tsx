import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, TrendingDown, AlertCircle, CheckCircle, Target, Edit, Trash2, X, Sparkles, UploadCloud } from 'lucide-react';
import { useFinance, BudgetCategory } from '../context/FinanceContext';

const PRESET_CATEGORIES = [
  { name: 'Groceries', icon: '🛒' },
  { name: 'Housing', icon: '🏠' },
  { name: 'Transportation', icon: '🚗' },
  { name: 'Utilities', icon: '💡' },
  { name: 'Healthcare', icon: '🏥' },
  { name: 'Education', icon: '🎓' },
  { name: 'Entertainment', icon: '🎬' },
  { name: 'Shopping', icon: '🛍️' },
  { name: 'Food & Dining', icon: '🍽️' },
  { name: 'Personal Care', icon: '💅' },
  { name: 'Subscriptions', icon: '📱' },
  { name: 'Travel', icon: '✈️' },
  { name: 'Savings', icon: '💰' },
  { name: 'Investments', icon: '📈' },
  { name: 'Insurance', icon: '🛡️' },
  { name: 'Gifts & Donations', icon: '🎁' },
  { name: 'Taxes', icon: '📄' },
  { name: 'Debt & EMI', icon: '💳' },
  { name: 'Pets', icon: '🐾' },
  { name: 'Custom', icon: '✨' },
];

export default function Budget() {
  const { budgets, transactions, addBudget, deleteBudget, updateBudget } = useFinance();
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetCategory | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingBudget, setDeletingBudget] = useState<BudgetCategory | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [selectedUploadCategory, setSelectedUploadCategory] = useState('');
  
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customName, setCustomName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState(PRESET_CATEGORIES[0].icon);

  // Calculate spent for each budget category
  const budgetData = useMemo(() => {
    return budgets.map(budget => {
      // Find all expense transactions matching this category name
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category === budget.name)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      return {
        ...budget,
        spent
      };
    });
  }, [budgets, transactions]);

  const totalBudget = budgetData.reduce((acc, cat) => acc + cat.budget, 0);
  const totalSpent = budgetData.reduce((acc, cat) => acc + cat.spent, 0);
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const remaining = totalBudget - totalSpent;

  const handleAddBudget = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get('amount'));
    const name = selectedCategory === 'Custom' ? customName : selectedCategory;
    
    if (!name.trim()) {
      alert('Please enter a category name');
      return;
    }

    addBudget({
      name: name.trim(),
      budget: amount,
      icon: categoryIcon || '🎯',
    });
    
    setShowAddModal(false);
    // Reset form state
    setSelectedCategory('');
    setCustomName('');
    setCategoryIcon(PRESET_CATEGORIES[0].icon);
  };

  const handleEditBudget = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get('amount'));
    const name = selectedCategory === 'Custom' ? customName : selectedCategory;
    
    if (!name.trim() || !editingBudget) {
      alert('Please enter a category name');
      return;
    }

    updateBudget(editingBudget.id, {
      name: name.trim(),
      budget: amount,
      icon: categoryIcon || '🎯',
    });
    
    setShowEditModal(false);
    setEditingBudget(null);
    setSelectedCategory('');
    setCustomName('');
    setCategoryIcon(PRESET_CATEGORIES[0].icon);
  };

  const openEditModal = (budget: BudgetCategory) => {
    setEditingBudget(budget);
    setSelectedCategory(budget.name);
    setCustomName(budget.name);
    setCategoryIcon(budget.icon);
    setShowEditModal(true);
  };

  const openDeleteModal = (budget: BudgetCategory) => {
    console.log('Opening delete modal for budget:', budget);
    setDeletingBudget(budget);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    console.log('Confirming delete for budget:', deletingBudget);
    if (deletingBudget) {
      try {
        console.log('Calling deleteBudget with ID:', deletingBudget.id);
        await deleteBudget(deletingBudget.id);
        console.log('Delete successful');
        setShowDeleteModal(false);
        setDeletingBudget(null);
      } catch (error) {
        console.error('Delete failed:', error);
        alert('Failed to delete budget. Please try again.');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedUploadFile(file);
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUploadFile) {
      alert('Please select a bill file first');
      return;
    }
    if (!selectedUploadCategory) {
      alert('Please select a category');
      return;
    }

    // Process the upload
    alert(`Bill "${selectedUploadFile.name}" for category "${selectedUploadCategory}" uploaded successfully! AI is now extracting details.`);
    
    // Reset and close
    setShowUploadModal(false);
    setSelectedUploadFile(null);
    setSelectedUploadCategory('');
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-none w-full mx-auto pb-24 md:pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Budget Management
          </h1>
          <p className="text-gray-600 mt-1">Plan and track your spending across categories</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,.pdf"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSelectedUploadCategory(budgets.length > 0 ? budgets[0].name : '');
              setShowUploadModal(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-indigo-600 text-indigo-600 rounded-2xl font-semibold shadow-lg shadow-indigo-100 hover:bg-indigo-50 transition-colors"
          >
            <UploadCloud className="w-5 h-5" />
            Upload Bill
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSelectedCategory(PRESET_CATEGORIES[0].name);
              setCustomName('');
              setCategoryIcon(PRESET_CATEGORIES[0].icon);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-semibold shadow-lg shadow-indigo-500/30"
          >
            <Plus className="w-5 h-5" />
            Add Category
          </motion.button>
        </div>
      </motion.div>

      {/* Period Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['monthly'].map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-5 py-2.5 rounded-2xl capitalize font-semibold whitespace-nowrap transition-all ${
              selectedPeriod === period
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-indigo-300'
            }`}
          >
            {period}
          </button>
        ))}
      </div>

      {/* Overall Budget Summary */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 md:p-10 text-white shadow-2xl relative overflow-hidden"
      >
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
              <Target className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Overall Budget</h2>
              <p className="text-purple-200">Total spending overview</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
              <p className="text-purple-200 text-sm mb-1">Total Budget</p>
              <p className="text-4xl font-bold">₹{totalBudget.toLocaleString()}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
              <p className="text-purple-200 text-sm mb-1">Total Spent</p>
              <p className="text-4xl font-bold">₹{totalSpent.toLocaleString()}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
              <p className="text-purple-200 text-sm mb-1">Remaining</p>
              <p className="text-4xl font-bold">₹{remaining.toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold">Overall Progress</span>
              <span className="font-bold">{overallPercentage.toFixed(1)}% Used</span>
            </div>
            <div className="h-6 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/30">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(overallPercentage, 100)}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                className="h-full bg-gradient-to-r from-white to-purple-200 rounded-full shadow-lg relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30" />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Budget Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgetData.length > 0 ? budgetData.map((category, idx) => {
          const percentage = category.budget > 0 ? (category.spent / category.budget) * 100 : 0;
          const remaining = category.budget - category.spent;
          const isOverBudget = percentage > 100;
          const isNearLimit = percentage > 80 && !isOverBudget;

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className={`bg-white rounded-3xl p-6 shadow-xl border-2 transition-all relative overflow-hidden group ${
                isOverBudget
                  ? 'border-red-300 hover:shadow-red-200'
                  : isNearLimit
                  ? 'border-yellow-300 hover:shadow-yellow-200'
                  : 'border-gray-100 hover:shadow-2xl'
              }`}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 opacity-5 ${
                isOverBudget
                  ? 'bg-gradient-to-br from-red-500 to-red-600'
                  : isNearLimit
                  ? 'bg-gradient-to-br from-yellow-500 to-yellow-600'
                  : 'bg-gradient-to-br from-indigo-500 to-purple-600'
              }`} />

              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{category.icon}</div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-600">
                        ₹{category.spent.toLocaleString()} / ₹{category.budget.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => document.getElementById(`bill-upload-${category.id}`)?.click()}
                      className="p-2 hover:bg-indigo-100 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                      title="Upload Bill Image"
                    >
                      <UploadCloud className="w-4 h-4 text-indigo-600" />
                    </button>
                    <input
                      id={`bill-upload-${category.id}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          alert(`Bill image "${file.name}" selected for ${category.name}! In a production app, this would be uploaded to a server.`);
                        }
                      }}
                    />
                    <button 
                      onClick={() => openEditModal(category)}
                      className="p-2 hover:bg-gray-100 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                      title="Edit Category"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                    <button 
                      onClick={() => openDeleteModal(category)}
                      className="p-2 hover:bg-red-100 rounded-xl transition-all"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2 mb-4">
                  <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(percentage, 100)}%` }}
                      transition={{ duration: 1, delay: 0.5 + Math.min(idx * 0.05, 0.3) }}
                      className={`absolute h-full rounded-full ${
                        isOverBudget
                          ? 'bg-gradient-to-r from-red-500 to-red-600'
                          : isNearLimit
                          ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                          : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                      }`}
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-bold ${
                      isOverBudget ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-gray-600'
                    }`}>
                      {percentage.toFixed(0)}% used
                    </span>
                    <span className={`text-sm font-bold ${
                      isOverBudget ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {isOverBudget ? `₹${Math.abs(remaining).toLocaleString()} over` : `₹${remaining.toLocaleString()} left`}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                {isOverBudget && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border-2 border-red-200 rounded-2xl">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-700 font-semibold">Over budget!</p>
                  </div>
                )}

                {isNearLimit && !isOverBudget && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 border-2 border-yellow-200 rounded-2xl">
                    <TrendingDown className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <p className="text-sm text-yellow-700 font-semibold">
                      {(100 - percentage).toFixed(0)}% remaining
                    </p>
                  </div>
                )}

                {!isOverBudget && !isNearLimit && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border-2 border-green-200 rounded-2xl">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-sm text-green-700 font-semibold">On track!</p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        }) : (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No budget categories yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">Create one to start tracking your spending limit</p>
            <button 
              onClick={() => {
                setSelectedCategory(PRESET_CATEGORIES[0].name);
                setCustomName('');
                setCategoryIcon(PRESET_CATEGORIES[0].icon);
                setShowAddModal(true);
              }}
              className="px-6 py-2 bg-indigo-50 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-100 transition-colors"
            >
              Create Category
            </button>
          </div>
        )}
      </div>

      {/* AI Insights */}
      {budgetData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-3xl p-8 border-2 border-purple-100 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-20 -mr-24 -mt-24" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-8 h-8 text-purple-600" />
              <h3 className="text-2xl font-bold text-gray-900">AI Budget Insights</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 border-2 border-purple-200">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">✅</div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Well Managed</p>
                    <p className="text-sm text-gray-700">
                      You're staying within budget for {budgetData.filter(c => c.budget > 0 && (c.spent / c.budget) * 100 <= 80).length} categories
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 border-2 border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">💰</div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Great Savings</p>
                    <p className="text-sm text-gray-700">
                      You've saved ₹{remaining.toLocaleString()} this period
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 border-2 border-pink-200">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🎯</div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Recommendation</p>
                    <p className="text-sm text-gray-700">
                      Keep track of categories near their limit to avoid overspending
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Add Category Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Add Budget Category</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddBudget} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Category</label>
                  <div className="space-y-3">
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedCategory(val);
                        const preset = PRESET_CATEGORIES.find(c => c.name === val);
                        if (preset && val !== 'Custom') {
                          setCategoryIcon(preset.icon);
                        }
                      }}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="" disabled>Select a category...</option>
                      {PRESET_CATEGORIES.map(c => (
                        <option key={c.name} value={c.name}>
                          {c.icon} {c.name}
                        </option>
                      ))}
                    </select>
                    
                    {selectedCategory === 'Custom' && (
                      <input
                        type="text"
                        placeholder="Enter custom category name..."
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Budget Amount</label>
                  <input
                    name="amount"
                    type="number"
                    required
                    min="1"
                    placeholder="0.00"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Icon (Emoji)</label>
                  <input
                    type="text"
                    value={categoryIcon}
                    onChange={(e) => setCategoryIcon(e.target.value)}
                    placeholder="🎯"
                    maxLength={2}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!selectedCategory}
                  className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all ${
                    selectedCategory
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-500/30'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  Create Category
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Category Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Edit Budget Category</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleEditBudget} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Category</label>
                  <div className="space-y-3">
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedCategory(val);
                        const preset = PRESET_CATEGORIES.find(c => c.name === val);
                        if (preset && val !== 'Custom') {
                          setCategoryIcon(preset.icon);
                        }
                      }}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="" disabled>Select a category...</option>
                      {PRESET_CATEGORIES.map(c => (
                        <option key={c.name} value={c.name}>
                          {c.icon} {c.name}
                        </option>
                      ))}
                    </select>
                    
                    {selectedCategory === 'Custom' && (
                      <input
                        type="text"
                        placeholder="Enter custom category name..."
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Budget Amount</label>
                  <input
                    name="amount"
                    type="number"
                    required
                    min="1"
                    defaultValue={editingBudget?.budget}
                    placeholder="0.00"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Icon (Emoji)</label>
                  <input
                    type="text"
                    value={categoryIcon}
                    onChange={(e) => setCategoryIcon(e.target.value)}
                    placeholder="🎯"
                    maxLength={2}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!selectedCategory}
                  className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all ${
                    selectedCategory
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-500/30'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  Update Category
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-center mb-6">
                <div className="p-4 bg-red-100 rounded-full">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">Delete Budget Category</h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete <strong>"{deletingBudget?.name}"</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-2xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-3 px-4 bg-red-600 text-white rounded-2xl font-semibold hover:bg-red-700 transition-all"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Bill Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Upload Bill</h3>
                </div>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-6">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                    selectedUploadFile 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-indigo-200 hover:border-indigo-400 bg-indigo-50/30'
                  }`}
                >
                  {selectedUploadFile ? (
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <p className="font-semibold text-gray-900 truncate px-4">
                        {selectedUploadFile.name}
                      </p>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUploadFile(null);
                        }}
                        className="text-sm text-red-600 hover:underline font-medium"
                      >
                        Change file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
                        <Plus className="w-6 h-6 text-indigo-600" />
                      </div>
                      <p className="font-semibold text-gray-900">Click to select bill</p>
                      <p className="text-sm text-gray-500">Supports JPG, PNG, PDF</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Category</label>
                  <select
                    value={selectedUploadCategory}
                    onChange={(e) => setSelectedUploadCategory(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="" disabled>Select a category...</option>
                    {PRESET_CATEGORIES.map(c => (
                      <option key={c.name} value={c.name}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!selectedUploadFile || !selectedUploadCategory}
                  className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                    selectedUploadFile && selectedUploadCategory
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-500/30'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                  Process with AI
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
