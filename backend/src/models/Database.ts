import { logger } from '../utils/logger';
import { db as mysqlDb } from './MySQLDatabase';

// Simple in-memory database for demonstration
interface User {
  id: number;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  avatar?: string;
  is_email_verified: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: number;
  user_id: number;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description?: string;
  date: string;
  account: string;
  tags: string[];
  attachments: string[];
  created_at: string;
  updated_at: string;
}

interface Budget {
  id: number;
  user_id: number;
  name: string;
  amount: number;
  spent: number;
  period: 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date: string;
  categories: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserPreferences {
  id: number;
  user_id: number;
  currency: string;
  language: string;
  timezone: string;
  notifications: string;
  theme: string;
  created_at: string;
  updated_at: string;
}

class InMemoryDatabase {
  private users: User[] = [];
  private transactions: Transaction[] = [];
  private budgets: Budget[] = [];
  private userPreferences: UserPreferences[] = [];
  private nextId = 1;

  constructor() {
    logger.info('In-memory database initialized');
  }

  // Users
  createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): User {
    const user: User = {
      ...userData,
      id: this.nextId++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.users.push(user);
    return user;
  }

  getUserByEmail(email: string): User | undefined {
    return this.users.find(u => u.email === email);
  }

  getUserById(id: number): User | undefined {
    return this.users.find(u => u.id === id);
  }

  updateUser(id: number, updates: Partial<User>): boolean {
    const index = this.users.findIndex(u => u.id === id);
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...updates, updated_at: new Date().toISOString() };
      return true;
    }
    return false;
  }

  // Transactions
  createTransaction(transactionData: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Transaction {
    const transaction: Transaction = {
      ...transactionData,
      id: this.nextId++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.transactions.push(transaction);
    return transaction;
  }

  getTransactionsByUserId(userId: number, filters?: any): Transaction[] {
    let transactions = this.transactions.filter(t => t.user_id === userId);
    
    if (filters?.category) {
      transactions = transactions.filter(t => t.category === filters.category);
    }
    if (filters?.type) {
      transactions = transactions.filter(t => t.type === filters.type);
    }
    if (filters?.search) {
      transactions = transactions.filter(t => 
        t.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
        t.category.toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getTransactionStats(userId: number, dateFilter?: string): any {
    let transactions = this.transactions.filter(t => t.user_id === userId);
    
    if (dateFilter) {
      transactions = transactions.filter(t => t.date >= dateFilter);
    }

    const incomeStats = transactions.filter(t => t.type === 'income');
    const expenseStats = transactions.filter(t => t.type === 'expense');

    return {
      total_income: incomeStats.reduce((sum, t) => sum + t.amount, 0),
      total_expenses: expenseStats.reduce((sum, t) => sum + t.amount, 0),
      income_count: incomeStats.length,
      expense_count: expenseStats.length,
      transaction_count: transactions.length
    };
  }

  // Budgets
  createBudget(budgetData: Omit<Budget, 'id' | 'created_at' | 'updated_at'>): Budget {
    const budget: Budget = {
      ...budgetData,
      id: this.nextId++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.budgets.push(budget);
    return budget;
  }

  getBudgetsByUserId(userId: number, filters?: any): Budget[] {
    let budgets = this.budgets.filter(b => b.user_id === userId);
    
    if (filters?.isActive !== undefined) {
      budgets = budgets.filter(b => b.is_active === filters.isActive);
    }
    if (filters?.period) {
      budgets = budgets.filter(b => b.period === filters.period);
    }
    
    return budgets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  getBudgetSummary(userId: number): any {
    const budgets = this.budgets.filter(b => b.user_id === userId && b.is_active);
    
    return {
      total_budgets: budgets.length,
      active_budgets: budgets.filter(b => b.is_active).length,
      total_budgeted: budgets.reduce((sum, b) => sum + b.amount, 0),
      total_spent: budgets.reduce((sum, b) => sum + b.spent, 0)
    };
  }

  deleteBudget(id: number): boolean {
    const index = this.budgets.findIndex(b => b.id === id);
    if (index !== -1) {
      this.budgets.splice(index, 1);
      return true;
    }
    return false;
  }

  updateBudget(id: number, updates: Partial<Budget>): boolean {
    const index = this.budgets.findIndex(b => b.id === id);
    if (index !== -1) {
      this.budgets[index] = { ...this.budgets[index], ...updates, updated_at: new Date().toISOString() };
      return true;
    }
    return false;
  }

  getBudgetById(id: number): Budget | undefined {
    return this.budgets.find(b => b.id === id);
  }

  // User Preferences
  createUserPreferences(prefData: Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'>): UserPreferences {
    const pref: UserPreferences = {
      ...prefData,
      id: this.nextId++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.userPreferences.push(pref);
    return pref;
  }

  getUserPreferencesByUserId(userId: number): UserPreferences | undefined {
    return this.userPreferences.find(p => p.user_id === userId);
  }

  updateUserPreferences(userId: number, updates: Partial<UserPreferences>): boolean {
    const index = this.userPreferences.findIndex(p => p.user_id === userId);
    if (index !== -1) {
      this.userPreferences[index] = { ...this.userPreferences[index], ...updates, updated_at: new Date().toISOString() };
      return true;
    }
    return false;
  }

  // Analytics methods
  getDashboardAnalytics(userId: number, period?: string): any {
    const transactions = this.transactions.filter(t => t.user_id === userId);
    let dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    if (period === '7d') dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (period === '90d') dateFilter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    if (period === '1y') dateFilter = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

    const filteredTransactions = transactions.filter(t => new Date(t.date) >= dateFilter);
    
    const incomeStats = filteredTransactions.filter(t => t.type === 'income');
    const expenseStats = filteredTransactions.filter(t => t.type === 'expense');

    // Category breakdown
    const categoryBreakdown: any[] = [];
    const categoryMap = new Map<string, { amount: number; count: number }>();
    
    expenseStats.forEach(t => {
      const existing = categoryMap.get(t.category) || { amount: 0, count: 0 };
      categoryMap.set(t.category, {
        amount: existing.amount + t.amount,
        count: existing.count + 1
      });
    });

    categoryMap.forEach((value, key) => {
      categoryBreakdown.push({
        category: key,
        total_amount: value.amount,
        count: value.count,
        average_amount: value.amount / value.count
      });
    });

    // Monthly trends
    const monthlyTrends: any[] = [];
    const monthlyMap = new Map<string, { income: number; expenses: number }>();
    
    filteredTransactions.forEach(t => {
      const month = t.date.substring(0, 7);
      const existing = monthlyMap.get(month) || { income: 0, expenses: 0 };
      
      if (t.type === 'income') {
        existing.income += t.amount;
      } else {
        existing.expenses += t.amount;
      }
      
      monthlyMap.set(month, existing);
    });

    monthlyMap.forEach((value, key) => {
      monthlyTrends.push({
        month: key,
        income: value.income,
        expenses: value.expenses,
        net: value.income - value.expenses
      });
    });

    const budgets = this.budgets.filter(b => b.user_id === userId && b.is_active);
    const budgetSummary = budgets.reduce((acc, budget) => {
      const period = budget.start_date.substring(0, 7);
      const existing = acc.get(period) || { total_budgeted: 0, total_spent: 0, budget_count: 0 };
      
      return acc.set(period, {
        total_budgeted: existing.total_budgeted + budget.amount,
        total_spent: existing.total_spent + budget.spent,
        budget_count: existing.budget_count + 1
      });
    }, new Map<string, any>());

    const budgetSummaryArray = Array.from(budgetSummary.entries()).map(([period, data]) => ({
      period,
      ...data
    }));

    return {
      period: period || '30d',
      startDate: dateFilter.toISOString(),
      endDate: new Date().toISOString(),
      totalIncome: incomeStats.reduce((sum, t) => sum + t.amount, 0),
      totalExpenses: expenseStats.reduce((sum, t) => sum + t.amount, 0),
      netIncome: (incomeStats.reduce((sum, t) => sum + t.amount, 0) - expenseStats.reduce((sum, t) => sum + t.amount, 0)),
      transactionCount: filteredTransactions.length,
      averageTransaction: filteredTransactions.length > 0 ? filteredTransactions.reduce((sum, t) => sum + t.amount, 0) / filteredTransactions.length : 0,
      categoryBreakdown,
      monthlyTrends,
      budgetSummary: budgetSummaryArray,
      topCategories: categoryBreakdown.map(cat => ({
        category: cat.category,
        amount: cat.total_amount,
        percentage: expenseStats.reduce((sum, t) => sum + t.amount, 0) > 0 ? (cat.total_amount / expenseStats.reduce((sum, t) => sum + t.amount, 0)) * 100 : 0
      })),
      averageDailySpending: expenseStats.reduce((sum, t) => sum + t.amount, 0) / 30
    };
  }

  getSpendingPatterns(userId: number, months: number = 6): any {
    const transactions = this.transactions.filter(t => 
      t.user_id === userId && 
      t.type === 'expense' &&
      new Date(t.date) >= new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000)
    );

    const patterns: any[] = [];
    const patternMap = new Map<string, Map<string, { total_spent: number; transaction_count: number }>>();
    
    transactions.forEach(t => {
      const month = t.date.substring(0, 7);
      const category = t.category;
      
      if (!patternMap.has(month)) {
        patternMap.set(month, new Map());
      }
      
      const monthData = patternMap.get(month)!;
      const existing = monthData.get(category) || { total_spent: 0, transaction_count: 0 };
      
      monthData.set(category, {
        total_spent: existing.total_spent + t.amount,
        transaction_count: existing.transaction_count + 1
      });
    });

    patternMap.forEach((monthData, month) => {
      monthData.forEach((data, category) => {
        patterns.push({
          month,
          category,
          total_spent: data.total_spent,
          transaction_count: data.transaction_count
        });
      });
    });

    return { patterns };
  }
}

export const db = mysqlDb;
