import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, Filter, ArrowUpRight, ArrowDownLeft, ShoppingBag, Coffee, Car, Home, Zap, MoreHorizontal, Calendar, Download, X, Check } from 'lucide-react';
import { useFinance, TransactionType } from '../context/FinanceContext';

const getIconForCategory = (category: string) => {
  switch (category) {
    case 'Food & Dining': return Coffee;
    case 'Transportation': return Car;
    case 'Shopping': return ShoppingBag;
    case 'Bills & Utilities': return Zap;
    case 'Entertainment': return ShoppingBag;
    default: return ShoppingBag;
  }
};

export default function Transactions() {
  const { transactions, totalIncome, totalExpense, addTransaction } = useFinance();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');

  const categories = ['all', 'Food & Dining', 'Transportation', 'Bills & Utilities', 'Shopping', 'Entertainment', 'Personal Care', 'Subscriptions', 'Travel', 'Investments', 'Insurance', 'Gifts & Donations', 'Taxes', 'Debt & EMI', 'Pets', 'Income'];

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || transaction.type === filterType;
    const matchesCategory = selectedCategory === 'all' || transaction.category === selectedCategory;
    return matchesSearch && matchesFilter && matchesCategory;
  });

  const netBalance = totalIncome - totalExpense;

  const handleAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get('amount'));
    
    addTransaction({
      name: formData.get('description') as string,
      amount: transactionType === 'expense' ? -amount : amount,
      category: formData.get('category') as string,
      date: new Date().toLocaleDateString(), // or use a date picker
      type: transactionType
    });
    
    setShowAddModal(false);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-none w-full mx-auto pb-24 md:pb-8">
      {/* Header */}
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
            All Transactions
          </h1>
          <p className="text-gray-600 mt-1">Manage and track all your financial activities</p>
        </div>
        <div className="flex items-center gap-3 overflow-hidden">
          <button
            className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold hover:border-indigo-300 hover:shadow-md transition-all duration-300"
          >
            <Download className="w-5 h-5" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <div className="flex items-center gap-3 overflow-hidden">
            <button
              onClick={() => {
                addTransaction({
                  name: 'Income',
                  amount: 1000,
                  category: 'Salary',
                  date: new Date().toLocaleDateString(),
                  type: 'income'
                });
              }}
              className="flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-2xl font-semibold shadow-lg shadow-green-500/30 hover:shadow-xl transition-all duration-300"
            >
              <ArrowDownLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Income</span>
            </button>
            <button
              onClick={() => {
                addTransaction({
                  name: 'Expense',
                  amount: -500,
                  category: 'Food & Dining',
                  date: new Date().toLocaleDateString(),
                  type: 'expense'
                });
              }}
              className="flex items-center gap-2 px-5 py-3 bg-red-600 text-white rounded-2xl font-semibold shadow-lg shadow-red-500/30 hover:shadow-xl transition-all duration-300"
            >
              <ArrowUpRight className="w-5 h-5" />
              <span className="hidden sm:inline">Expense</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        className="flex flex-col md:flex-row gap-4"
      >
        {/* Category Filter */}
        <div
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300"
        >
          {categories.map((category, index) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-xl capitalize whitespace-nowrap font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-300'
                  : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div
        className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 overflow-hidden"
      >
        <div className="divide-y-2 divide-gray-100">
          {filteredTransactions.map((transaction, idx) => {
              const Icon = transaction.type === 'income' ? ArrowDownLeft : getIconForCategory(transaction.category);
              return (
                <div
                  key={transaction.id}
                  className="p-4 md:p-6 transition-all cursor-pointer group relative"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`p-3 rounded-2xl bg-gradient-to-br ${
                        transaction.type === 'income'
                          ? 'from-green-100 to-emerald-100'
                          : 'from-gray-100 to-gray-200'
                      }`}>
                        <Icon className={`w-6 h-6 ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-gray-700'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">{transaction.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-gray-600">{transaction.category}</p>
                          <span className="text-gray-300">•</span>
                          <p className="text-sm text-gray-500">{transaction.date}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <div className="text-right">
                        <p className={`font-bold text-xl ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}₹{Math.abs(transaction.amount).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">{transaction.category}</p>
                      </div>
                      <button className="p-2 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-all">
                        <MoreHorizontal className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No transactions found</p>
            <p className="text-sm text-gray-400 mt-1">Try adding a new transaction</p>
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Add Transaction</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Transaction Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button" 
                      onClick={() => setTransactionType('income')}
                      className={`py-3 rounded-2xl font-semibold transition-all ${
                        transactionType === 'income' 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md shadow-green-500/30' 
                          : 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Income
                    </button>
                    <button 
                      type="button"
                      onClick={() => setTransactionType('expense')}
                      className={`py-3 rounded-2xl font-semibold transition-all ${
                        transactionType === 'expense' 
                          ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-md shadow-red-500/30' 
                          : 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Expense
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select name="category" required className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {transactionType === 'expense' ? (
                      <>
                        <option>Food & Dining</option>
                        <option>Transportation</option>
                        <option>Shopping</option>
                        <option>Entertainment</option>
                        <option>Bills & Utilities</option>
                        <option>Personal Care</option>
                        <option>Subscriptions</option>
                        <option>Travel</option>
                        <option>Investments</option>
                        <option>Insurance</option>
                        <option>Gifts & Donations</option>
                        <option>Taxes</option>
                        <option>Debt & EMI</option>
                        <option>Pets</option>
                      </>
                    ) : (
                      <>
                        <option>Salary</option>
                        <option>Freelance</option>
                        <option>Investments</option>
                        <option>Other</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <input
                    name="description"
                    type="text"
                    required
                    placeholder="Enter description..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/30"
                >
                  Add Transaction
                </button>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SummaryCard({ title, amount, count, gradient, icon: Icon }: any) {
  return (
    <div
      className="bg-white rounded-3xl p-6 shadow-xl border-2 border-gray-100 hover:shadow-2xl transition-all relative overflow-hidden group"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`} />
      <div className="relative">
        <div className={`inline-flex p-3 bg-gradient-to-br ${gradient} rounded-2xl mb-4 shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mb-1">{amount}</p>
        <p className="text-xs text-gray-500">{count} transactions</p>
      </div>
    </div>
  );
}
