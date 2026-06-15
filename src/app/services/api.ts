import { ApiResponse, AuthTokens, User, Transaction, Budget, Analytics } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export class ApiService {
  private static instance: ApiService;
  private baseURL: string;

  private constructor() {
    this.baseURL = API_BASE_URL;
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add Authorization header if token exists
    const token = this.getToken();
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  private getToken(): string | null {
    try {
      return localStorage.getItem('accessToken');
    } catch {
      return null;
    }
  }

  private setToken(token: string): void {
    try {
      localStorage.setItem('accessToken', token);
    } catch (error) {
      console.error('Error setting token:', error);
    }
  }

  private removeToken(): void {
    try {
      localStorage.removeItem('accessToken');
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  // Authentication methods
  async login(identifier: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });

    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async googleLogin(token: string): Promise<ApiResponse<{ user: User; token: string }>> {
    // ID tokens are JWTs and always have 3 segments separated by dots.
    // Access tokens can have dots but usually don't have exactly 3 segments.
    const body = (token.split('.').length === 3) 
      ? { idToken: token } 
      : { accessToken: token };

    const response = await this.request<{ user: User; token: string }>('/auth/google-login', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<any>> {
    return this.request<any>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Forgot Password - Send OTP
  async sendOtp(email: string): Promise<ApiResponse<any>> {
    return this.request<any>('/auth/forgot-password/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Forgot Password - Verify OTP
  async verifyOtp(email: string, otp: string): Promise<ApiResponse<any>> {
    return this.request<any>('/auth/forgot-password/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  // Forgot Password - Reset Password
  async resetPassword(email: string, otp: string, newPassword: string): Promise<ApiResponse<any>> {
    return this.request<any>('/auth/forgot-password/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    });
  }

  async register(userData: {
    email: string;
    password: string;
    username: string;
    phoneNumber?: string;
  }): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async logout(): Promise<ApiResponse<null>> {
    const response = await this.request<null>('/auth/logout', {
      method: 'POST',
    });

    this.removeToken();
    return response;
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>('/auth/me');
  }

  // User methods
  async getUserProfile(): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>('/users/profile');
  }

  async getNotifications(): Promise<ApiResponse<{ notifications: any[] }>> {
    return this.request<{ notifications: any[] }>('/users/notifications');
  }

  async markNotificationAsRead(id: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/users/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async updateUserProfile(userData: {
    username?: string;
    email?: string;
    phoneNumber?: string;
  }): Promise<ApiResponse<{ username: string; email: string; phoneNumber: string }>> {
    return this.request<{ username: string; email: string; phoneNumber: string }>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async updateUserPreferences(preferences: any): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>('/users/preferences', {
      method: 'PUT',
      body: JSON.stringify({ preferences }),
    });
  }

  async getUserStats(): Promise<ApiResponse<{ stats: any }>> {
    return this.request<{ stats: any }>('/users/stats');
  }

  // Transaction methods
  async getTransactions(params?: {
    page?: number;
    limit?: number;
    category?: string;
    type?: string;
    search?: string;
  }): Promise<ApiResponse<{ transactions: Transaction[]; pagination: any }>> {
    const queryString = params 
      ? `?${new URLSearchParams(params as any).toString()}`
      : '';
    
    return this.request<{ transactions: Transaction[]; pagination: any }>(`/transactions${queryString}`);
  }

  async getTransaction(id: string): Promise<ApiResponse<{ transaction: Transaction }>> {
    return this.request<{ transaction: Transaction }>(`/transactions/${id}`);
  }

  async createTransaction(transactionData: {
    amount: number;
    type: 'income' | 'expense';
    category: string;
    description?: string;
    date: string;
    account: string;
    tags?: string[];
    attachments?: string[];
  }): Promise<ApiResponse<{ transaction: Transaction }>> {
    return this.request<{ transaction: Transaction }>('/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  }

  async updateTransaction(id: string, transactionData: any): Promise<ApiResponse<{ transaction: Transaction }>> {
    return this.request<{ transaction: Transaction }>(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transactionData),
    });
  }

  async deleteTransaction(id: string): Promise<ApiResponse<null>> {
    return this.request<null>(`/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  async getTransactionStats(): Promise<ApiResponse<{ stats: any }>> {
    return this.request<{ stats: any }>('/transactions/stats/summary');
  }

  async getCategoryBreakdown(params?: { type?: string }): Promise<ApiResponse<{ categoryBreakdown: any[] }>> {
    const queryString = params 
      ? `?${new URLSearchParams(params).toString()}`
      : '';
    
    return this.request<{ categoryBreakdown: any[] }>(`/transactions/stats/categories${queryString}`);
  }

  // Budget methods
  async getBudgets(params?: {
    isActive?: boolean;
    period?: string;
  }): Promise<ApiResponse<{ budgets: Budget[] }>> {
    const queryString = params 
      ? `?${new URLSearchParams(params as any).toString()}`
      : '';
    
    return this.request<{ budgets: Budget[] }>(`/budgets${queryString}`);
  }

  async getActiveBudgets(): Promise<ApiResponse<{ budgets: Budget[] }>> {
    return this.request<{ budgets: Budget[] }>('/budgets?isActive=true');
  }

  async getBudget(id: string): Promise<ApiResponse<{ budget: Budget }>> {
    return this.request<{ budget: Budget }>(`/budgets/${id}`);
  }

  async createBudget(budgetData: {
    name: string;
    amount: number;
    period: 'weekly' | 'monthly' | 'yearly';
    startDate: string;
    endDate: string;
    categories: string[];
  }): Promise<ApiResponse<{ budget: Budget }>> {
    return this.request<{ budget: Budget }>('/budgets', {
      method: 'POST',
      body: JSON.stringify(budgetData),
    });
  }

  async updateBudget(id: string, budgetData: any): Promise<ApiResponse<{ budget: Budget }>> {
    return this.request<{ budget: Budget }>(`/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(budgetData),
    });
  }

  async deleteBudget(id: string): Promise<ApiResponse<null>> {
    return this.request<null>(`/budgets/${id}`, {
      method: 'DELETE',
    });
  }

  async getBudgetSummary(): Promise<ApiResponse<{ budgetSummary: any }>> {
    return this.request<{ budgetSummary: any }>('/budgets/summary/overview');
  }

  // Analytics methods
  async getDashboardAnalytics(params?: { period?: string }): Promise<ApiResponse<{ analytics: Analytics }>> {
    const queryString = params 
      ? `?${new URLSearchParams(params).toString()}`
      : '';
    
    return this.request<{ analytics: Analytics }>(`/analytics/dashboard${queryString}`);
  }

  async getSpendingPatterns(params?: { months?: number }): Promise<ApiResponse<{ patterns: any }>> {
    const queryString = params 
      ? `?${new URLSearchParams(params as any).toString()}`
      : '';
    
    return this.request<{ patterns: any }>(`/analytics/spending-patterns${queryString}`);
  }

  async getBudgetPerformance(): Promise<ApiResponse<{ performance: any }>> {
    return this.request<{ performance: any }>('/analytics/budget-performance');
  }

  async getFinancialHealthScore(): Promise<ApiResponse<{ healthScore: any }>> {
    return this.request<{ healthScore: any }>('/analytics/health-score');
  }

  async resetUserData(): Promise<ApiResponse<null>> {
    return this.request<null>('/users/profile/reset-data', {
      method: 'POST',
    });
  }

  // Health check
  async healthCheck(): Promise<Response> {
    return fetch(`${this.baseURL.replace('/api/v1', '')}/health`);
  }
}

export const apiService = ApiService.getInstance();
