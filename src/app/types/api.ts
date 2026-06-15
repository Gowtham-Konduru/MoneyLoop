export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: string;
  isEmailVerified: boolean;
  lastLoginAt?: string;
}

export interface UserPreferences {
  currency: string;
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    budgetAlerts: boolean;
    weeklyReports: boolean;
  };
  theme: 'light' | 'dark' | 'auto';
}

export interface Transaction {
  id: number;
  userId: number;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description?: string;
  date: string;
  account: string;
  tags: string[];
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: number;
  userId: number;
  name: string;
  amount: number;
  spent: number;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  categories: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Analytics {
  period: string;
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  transactionCount: number;
  averageTransaction: number;
  savingsRate: number;
  categoryBreakdown: Array<{
    category: string;
    totalAmount: number;
    count: number;
    averageAmount: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    income: number;
    expenses: number;
    net: number;
  }>;
  budgetSummary: Array<{
    period: string;
    totalBudgeted: number;
    totalSpent: number;
    budgetCount: number;
  }>;
  topCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  averageDailySpending: number;
}
