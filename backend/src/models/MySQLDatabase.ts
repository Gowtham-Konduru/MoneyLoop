import mysql from 'mysql2/promise';
import { logger } from '../utils/logger';

// MySQL Database connection
export class MySQLDatabase {
  private static instance: MySQLDatabase;
  private connection: mysql.Connection | null = null;

  public constructor() {
    this.connect();
  }

  public static getInstance(): MySQLDatabase {
    if (!MySQLDatabase.instance) {
      MySQLDatabase.instance = new MySQLDatabase();
    }
    return MySQLDatabase.instance;
  }

  private async connect(): Promise<void> {
    try {
      const dbName = process.env.DB_NAME || 'moneyloop';
      
      // First connect without database to create it if it doesn't exist
      const tempConnection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'gowtham@1',
      });
      await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
      await tempConnection.end();

      // Now connect with the database
      this.connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'gowtham@1',
        database: dbName,
        multipleStatements: true
      });

      await this.connection.ping();
      logger.info('MySQL database connected successfully');
      
      // Initialize tables
      await this.initializeTables();
    } catch (error) {
      logger.error('Database connection failed:', error);
      throw error;
    }
  }

  public async getConnection(): Promise<mysql.Connection> {
    if (!this.connection) {
      await this.connect();
    }
    return this.connection!;
  }

  private async initializeTables(): Promise<void> {
    const connection = await this.getConnection();
    
    try {
      // Create users table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
          user_id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          username VARCHAR(100) UNIQUE NOT NULL,
          phone_number VARCHAR(20),
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create transactions table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS transactions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          type ENUM('income', 'expense') NOT NULL,
          category VARCHAR(100) NOT NULL,
          description TEXT,
          date DATE NOT NULL,
          account VARCHAR(100) NOT NULL,
          tags JSON,
          attachments JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
      `);

      // Create budgets table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS budgets (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          spent DECIMAL(10,2) DEFAULT 0,
          period ENUM('weekly', 'monthly', 'yearly') NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          categories JSON,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
      `);

      // Create notifications table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          type ENUM('info', 'warning', 'success', 'error') DEFAULT 'info',
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
      `);

      // Create otp table for password reset
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS otp (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          otp VARCHAR(6) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_email (email),
          INDEX idx_expires_at (expires_at)
        )
      `);

      // Check if we need to migrate from phone_number to email (for existing tables)
      try {
        const [columns] = await connection.execute(`
          SHOW COLUMNS FROM otp WHERE Field = 'phone_number'
        `);
        
        if ((columns as any[]).length > 0) {
          logger.info('Migrating OTP table from phone_number to email');
          // Drop old phone_number column if it exists
          await connection.execute(`
            ALTER TABLE otp DROP COLUMN phone_number
          `);
        }
      } catch (error) {
        // Ignore migration errors, table might be new
        logger.info('OTP table migration check completed');
      }

      // Create goals table (checking if it exists elsewhere in the file)
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS goals (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          target_amount DECIMAL(10,2) NOT NULL,
          current_amount DECIMAL(10,2) DEFAULT 0,
          target_date DATE NOT NULL,
          is_completed BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
      `);

      // Create user_preferences table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS user_preferences (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT UNIQUE NOT NULL,
          currency VARCHAR(10) DEFAULT 'INR',
          language VARCHAR(10) DEFAULT 'en',
          timezone VARCHAR(50) DEFAULT 'UTC',
          notifications JSON,
          theme VARCHAR(20) DEFAULT 'light',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
      `);

      logger.info('Database tables initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize tables:', error);
      throw error;
    }
  }

  // Users
  async createUser(userData: {
    email: string;
    username?: string;
    phone_number?: string;
    password: string;
  }): Promise<any> {
    const connection = await this.getConnection();
    const [result] = await connection.execute(`
      INSERT INTO users (email, username, phone_number, password)
      VALUES (?, ?, ?, ?)
    `, [
      userData.email,
      userData.username || userData.email, // Use email as username if not provided
      userData.phone_number || null,
      userData.password
    ]);
    
    return result;
  }

  async getUserByEmail(email: string): Promise<any> {
    const connection = await this.getConnection();
    const [rows] = await connection.execute(`
      SELECT * FROM users WHERE email = ?
    `, [email]);
    
    return (rows as any[])[0] || null;
  }

  async getUserByIdentifier(identifier: string): Promise<any> {
    const connection = await this.getConnection();
    const [rows] = await connection.execute(`
      SELECT * FROM users 
      WHERE email = ? OR username = ? OR phone_number = ?
    `, [identifier, identifier, identifier]);
    
    return (rows as any[])[0] || null;
  }

  async getUserById(id: number): Promise<any> {
    const connection = await this.getConnection();
    const [rows] = await connection.execute(`
      SELECT user_id, email, username, phone_number, created_at
      FROM users WHERE user_id = ?
    `, [id]);
    
    return (rows as any[])[0] || null;
  }

  async isEmailEligibleForPasswordReset(email: string): Promise<{ exists: boolean; isOldEnough: boolean; user?: any }> {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(`
        SELECT user_id, email, username, created_at
        FROM users WHERE email = ?
      `, [email]);
      
      const user = (rows as any[])[0];
      
      if (!user) {
        return { exists: false, isOldEnough: false };
      }
      
      // Check if account is at least 1 year old
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const accountCreatedDate = new Date(user.created_at);
      const isOldEnough = accountCreatedDate <= oneYearAgo;
      
      logger.info(`Email eligibility check for ${email}:`, {
        exists: true,
        accountCreatedDate: accountCreatedDate.toISOString(),
        oneYearAgo: oneYearAgo.toISOString(),
        isOldEnough,
        daysSinceCreation: Math.floor((new Date().getTime() - accountCreatedDate.getTime()) / (1000 * 60 * 60 * 24))
      });
      
      return { 
        exists: true, 
        isOldEnough, 
        user: {
          user_id: user.user_id,
          email: user.email,
          username: user.username,
          created_at: user.created_at
        }
      };
    } catch (error) {
      logger.error('Error checking email eligibility:', error);
      return { exists: false, isOldEnough: false };
    }
  }

  async updateUser(id: number, updates: Partial<any>): Promise<boolean> {
    const connection = await this.getConnection();
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    if (fields.length === 0) return false;
    
    values.push(id);
    const [result] = await connection.execute(`
      UPDATE users SET ${fields.join(', ')} WHERE user_id = ?
    `, values);
    
    return (result as any).affectedRows > 0;
  }

  // Transactions
  async createTransaction(transactionData: {
    user_id: number;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    description?: string;
    date: string;
    account: string;
    tags?: string[];
    attachments?: string[];
  }): Promise<any> {
    const connection = await this.getConnection();
    const [result] = await connection.execute(`
      INSERT INTO transactions (user_id, amount, type, category, description, date, account, tags, attachments)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      transactionData.user_id,
      transactionData.amount,
      transactionData.type,
      transactionData.category,
      transactionData.description || null,
      transactionData.date,
      transactionData.account,
      JSON.stringify(transactionData.tags || []),
      JSON.stringify(transactionData.attachments || [])
    ]);
    
    return result;
  }

  async getTransactionsByUserId(userId: number, filters?: any): Promise<any[]> {
    const connection = await this.getConnection();
    let query = `
      SELECT * FROM transactions 
      WHERE user_id = ?
    `;
    const params: any[] = [userId];
    
    if (filters?.category) {
      query += ` AND category = ?`;
      params.push(filters.category);
    }
    
    if (filters?.type) {
      query += ` AND type = ?`;
      params.push(filters.type);
    }
    
    if (filters?.search) {
      query += ` AND (description LIKE ? OR category LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    
    query += ` ORDER BY date DESC`;
    
    const [rows] = await connection.execute(query, params);
    return rows as any[];
  }

  async getTransactionStats(userId: number, dateFilter?: string): Promise<any> {
    const connection = await this.getConnection();
    let dateCondition = '';
    const params: any[] = [userId];
    
    if (dateFilter) {
      dateCondition = ` AND date >= ?`;
      params.push(dateFilter);
    }
    
    const [rows] = await connection.execute(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
        SUM(CASE WHEN type = 'income' THEN 1 ELSE 0 END) as income_count,
        SUM(CASE WHEN type = 'expense' THEN 1 ELSE 0 END) as expense_count,
        COUNT(*) as transaction_count
      FROM transactions 
      WHERE user_id = ?${dateCondition}
    `, params);
    
    return (rows as any[])[0] || {
      total_income: 0,
      total_expenses: 0,
      income_count: 0,
      expense_count: 0,
      transaction_count: 0
    };
  }

  // Budgets
  async createBudget(budgetData: {
    user_id: number;
    name: string;
    amount: number;
    period: 'weekly' | 'monthly' | 'yearly';
    start_date: string;
    end_date: string;
    categories: string[];
  }): Promise<any> {
    const connection = await this.getConnection();
    const [result] = await connection.execute(`
      INSERT INTO budgets (user_id, name, amount, period, start_date, end_date, categories)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      budgetData.user_id,
      budgetData.name,
      budgetData.amount,
      budgetData.period,
      budgetData.start_date,
      budgetData.end_date,
      JSON.stringify(budgetData.categories)
    ]);
    
    return result;
  }

  async getBudgetsByUserId(userId: number, filters?: any): Promise<any[]> {
    const connection = await this.getConnection();
    let query = `
      SELECT * FROM budgets 
      WHERE user_id = ?
    `;
    const params: any[] = [userId];
    
    if (filters?.isActive !== undefined) {
      query += ` AND is_active = ?`;
      params.push(filters.isActive);
    }
    
    if (filters?.period) {
      query += ` AND period = ?`;
      params.push(filters.period);
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const [rows] = await connection.execute(query, params);
    return rows as any[];
  }

  async getBudgetSummary(userId: number): Promise<any> {
    const connection = await this.getConnection();
    const [rows] = await connection.execute(`
      SELECT 
        COUNT(*) as total_budgets,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_budgets,
        SUM(CASE WHEN is_active = 1 THEN amount ELSE 0 END) as total_budgeted,
        SUM(CASE WHEN is_active = 1 THEN spent ELSE 0 END) as total_spent
      FROM budgets 
      WHERE user_id = ?
    `, [userId]);
    
    return (rows as any[])[0] || {
      total_budgets: 0,
      active_budgets: 0,
      total_budgeted: 0,
      total_spent: 0
    };
  }

  async deleteBudget(id: number): Promise<boolean> {
    const connection = await this.getConnection();
    const [result] = await connection.execute(`
      DELETE FROM budgets WHERE id = ?
    `, [id]);
    
    return (result as any).affectedRows > 0;
  }

  async updateBudget(id: number, updates: any): Promise<boolean> {
    const connection = await this.getConnection();
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    if (fields.length === 0) return false;
    
    values.push(id);
    const [result] = await connection.execute(`
      UPDATE budgets SET ${fields.join(', ')} WHERE id = ?
    `, values);
    
    return (result as any).affectedRows > 0;
  }

  async getBudgetById(id: number): Promise<any> {
    const connection = await this.getConnection();
    const [rows] = await connection.execute(`
      SELECT * FROM budgets WHERE id = ?
    `, [id]);
    
    return (rows as any[])[0] || null;
  }

  // User Preferences
  async createUserPreferences(prefData: {
    user_id: number;
    currency?: string;
    language?: string;
    timezone?: string;
    notifications?: string;
    theme?: string;
  }): Promise<any> {
    const connection = await this.getConnection();
    const [result] = await connection.execute(`
      INSERT INTO user_preferences (user_id, currency, language, timezone, notifications, theme)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      prefData.user_id,
      prefData.currency || 'INR',
      prefData.language || 'en',
      prefData.timezone || 'UTC',
      prefData.notifications || '{"email": true, "push": true, "budgetAlerts": true, "weeklyReports": true}',
      prefData.theme || 'light'
    ]);
    
    return result;
  }

  async getUserPreferencesByUserId(userId: number): Promise<any> {
    const connection = await this.getConnection();
    const [rows] = await connection.execute(`
      SELECT * FROM user_preferences WHERE user_id = ?
    `, [userId]);
    
    return (rows as any[])[0] || null;
  }

  async getNotificationsByUserId(userId: number): Promise<any[]> {
    const connection = await this.getConnection();
    const [rows] = await connection.execute(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    return rows as any[];
  }

  async markNotificationAsRead(id: number, userId: number): Promise<boolean> {
    const connection = await this.getConnection();
    const [result] = await connection.execute(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return (result as any).affectedRows > 0;
  }

  async createNotification(data: {
    user_id: number;
    title: string;
    message: string;
    type?: 'info' | 'warning' | 'success' | 'error';
  }): Promise<any> {
    const connection = await this.getConnection();
    const [result] = await connection.execute(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [data.user_id, data.title, data.message, data.type || 'info']
    );
    return result;
  }

  async updateUserPreferences(userId: number, updates: Partial<any>): Promise<boolean> {
    const connection = await this.getConnection();
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'user_id' && value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    if (fields.length === 0) return false;
    
    values.push(userId);
    const [result] = await connection.execute(`
      UPDATE user_preferences SET ${fields.join(', ')} WHERE user_id = ?
    `, values);
    
    return (result as any).affectedRows > 0;
  }

  // Analytics methods
  async getDashboardAnalytics(userId: number, period?: string): Promise<any> {
    const connection = await this.getConnection();
    let dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    if (period === '7d') dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (period === '90d') dateFilter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    if (period === '1y') dateFilter = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

    const dateStr = dateFilter.toISOString().split('T')[0];

    // Get transaction stats
    const [transactionStats] = await connection.execute(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as totalIncome,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as totalExpenses,
        COUNT(*) as transactionCount,
        AVG(amount) as averageTransaction
      FROM transactions 
      WHERE user_id = ? AND date >= ?
    `, [userId, dateStr]);

    // Get category breakdown
    const [categoryBreakdown] = await connection.execute(`
      SELECT 
        category,
        SUM(amount) as total_amount,
        COUNT(*) as count,
        AVG(amount) as average_amount
      FROM transactions 
      WHERE user_id = ? AND type = 'expense' AND date >= ?
      GROUP BY category
      ORDER BY total_amount DESC
    `, [userId, dateStr]);

    // Get monthly trends
    const [monthlyTrends] = await connection.execute(`
      SELECT 
        DATE_FORMAT(date, '%Y-%m') as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses,
        SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net
      FROM transactions 
      WHERE user_id = ? AND date >= ?
      GROUP BY DATE_FORMAT(date, '%Y-%m')
      ORDER BY month DESC
      LIMIT 12
    `, [userId, dateStr]);

    // Get budget summary
    const [budgetSummary] = await connection.execute(`
      SELECT 
        DATE_FORMAT(start_date, '%Y-%m') as period,
        SUM(amount) as total_budgeted,
        SUM(spent) as total_spent,
        COUNT(*) as budget_count
      FROM budgets 
      WHERE user_id = ? AND is_active = 1
      GROUP BY DATE_FORMAT(start_date, '%Y-%m')
      ORDER BY period DESC
      LIMIT 12
    `, [userId]);

    const stats = (transactionStats as any[])[0] || {};
    const income = parseFloat(stats.totalIncome || 0);
    const expenses = parseFloat(stats.totalExpenses || 0);

    return {
      period: period || '30d',
      startDate: dateFilter.toISOString(),
      endDate: new Date().toISOString(),
      totalIncome: income,
      totalExpenses: expenses,
      netIncome: income - expenses,
      transactionCount: parseInt(stats.transactionCount || 0),
      averageTransaction: parseFloat(stats.averageTransaction || 0),
      categoryBreakdown: categoryBreakdown as any[],
      monthlyTrends: monthlyTrends as any[],
      budgetSummary: budgetSummary as any[],
      topCategories: (categoryBreakdown as any[]).map((cat: any) => ({
        category: cat.category,
        amount: parseFloat(cat.total_amount),
        percentage: expenses > 0 ? (parseFloat(cat.total_amount) / expenses) * 100 : 0
      })),
      averageDailySpending: expenses / 30
    };
  }

  async getSpendingPatterns(userId: number, months: number = 6): Promise<any> {
    const connection = await this.getConnection();
    const dateFilter = new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000);
    const dateStr = dateFilter.toISOString().split('T')[0];

    const [patterns] = await connection.execute(`
      SELECT 
        DATE_FORMAT(date, '%Y-%m') as month,
        category,
        SUM(amount) as total_spent,
        COUNT(*) as transaction_count
      FROM transactions 
      WHERE user_id = ? AND type = 'expense' AND date >= ?
      GROUP BY DATE_FORMAT(date, '%Y-%m'), category
      ORDER BY month DESC, total_spent DESC
    `, [userId, dateStr]);

    return { patterns: patterns as any[] };
  }

  // OTP Methods for Password Reset
  private otpCache = new Map<string, { otp: string; expiresAt: Date }>();

  async storeOtp(email: string, otp: string): Promise<boolean> {
    try {
      logger.info(`Storing OTP for email: ${email}, OTP: ${otp}`);
      
      // First try database storage
      const connection = await this.getConnection();
      
      // Delete any existing OTP for this email
      await connection.execute(`
        DELETE FROM otp WHERE email = ?
      `, [email]);
      
      // Store new OTP with 5-minute expiration
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      
      const [result] = await connection.execute(`
        INSERT INTO otp (email, otp, expires_at)
        VALUES (?, ?, ?)
      `, [email, otp, expiresAt]);
      
      const affectedRows = (result as any).affectedRows;
      
      if (affectedRows > 0) {
        logger.info(`OTP stored successfully in database for ${email}`);
        // Also store in cache as backup
        this.otpCache.set(email, { otp, expiresAt });
        return true;
      } else {
        logger.warn(`Database insert returned 0 affected rows for ${email}, using cache fallback`);
        // Fallback to cache storage
        this.otpCache.set(email, { otp, expiresAt });
        return true;
      }
    } catch (error) {
      logger.error('Database error storing OTP, using cache fallback:', error);
      // Fallback to in-memory cache
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      this.otpCache.set(email, { otp, expiresAt });
      logger.info(`OTP stored in cache fallback for ${email}`);
      return true;
    }
  }

  async verifyOtp(email: string, otp: string): Promise<boolean> {
    try {
      // First try database verification
      const connection = await this.getConnection();
      const [rows] = await connection.execute(`
        SELECT * FROM otp 
        WHERE email = ? AND otp = ? AND expires_at > NOW()
      `, [email, otp]);
      
      const otpRecord = (rows as any[])[0];
      if (otpRecord) {
        logger.info(`OTP verified successfully from database for ${email}`);
        return true;
      }
      
      // Fallback to cache verification
      const cachedOtp = this.otpCache.get(email);
      if (cachedOtp && cachedOtp.otp === otp && cachedOtp.expiresAt > new Date()) {
        logger.info(`OTP verified successfully from cache for ${email}`);
        return true;
      }
      
      logger.warn(`OTP verification failed for ${email}`);
      return false;
    } catch (error) {
      logger.error('Database error verifying OTP, trying cache fallback:', error);
      
      // Fallback to cache only
      const cachedOtp = this.otpCache.get(email);
      if (cachedOtp && cachedOtp.otp === otp && cachedOtp.expiresAt > new Date()) {
        logger.info(`OTP verified successfully from cache fallback for ${email}`);
        return true;
      }
      
      return false;
    }
  }

  async deleteOtp(email: string): Promise<boolean> {
    try {
      // Delete from database
      const connection = await this.getConnection();
      const [result] = await connection.execute(`
        DELETE FROM otp WHERE email = ?
      `, [email]);
      
      // Always delete from cache
      this.otpCache.delete(email);
      logger.info(`OTP deleted from cache for ${email}`);
      
      return (result as any).affectedRows > 0;
    } catch (error) {
      logger.error('Database error deleting OTP, cleaning cache only:', error);
      // At least clean up the cache
      this.otpCache.delete(email);
      return true;
    }
  }

  async resetUserData(userId: number): Promise<boolean> {
    const connection = await this.getConnection();
    try {
      await connection.beginTransaction();
      
      await connection.execute('DELETE FROM transactions WHERE user_id = ?', [userId]);
      await connection.execute('DELETE FROM budgets WHERE user_id = ?', [userId]);
      await connection.execute('DELETE FROM goals WHERE user_id = ?', [userId]);
      await connection.execute('DELETE FROM notifications WHERE user_id = ?', [userId]);
      
      await connection.commit();
      logger.info(`Successfully reset all financial data for user ID: ${userId}`);
      return true;
    } catch (error) {
      await connection.rollback();
      logger.error(`Failed to reset data for user ID: ${userId}`, error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      logger.info('Database connection closed');
    }
  }
}

export const db = new MySQLDatabase();
