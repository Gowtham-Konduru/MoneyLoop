import { Router, Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import { JWTUtils } from '../utils/jwt';
import { logger } from '../utils/logger';
import { db } from '../models/Database';

const router = Router();

// Get dashboard analytics
router.get('/dashboard', [
  query('period').optional().isIn(['7d', '30d', '90d', '1y'])
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        timestamp: new Date().toISOString()
      });
    }

    const authHeader = req.headers.authorization;
    const token = JWTUtils.extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
        timestamp: new Date().toISOString()
      });
    }

    const decoded = JWTUtils.verifyToken(token);
    const period = req.query.period || '30d';

    let dateFilter = "date >= date('now', '-30 days')";
    if (period === '7d') dateFilter = "date >= date('now', '-7 days')";
    if (period === '90d') dateFilter = "date >= date('now', '-90 days')";
    if (period === '1y') dateFilter = "date >= date('now', '-1 year')";

    // Get income and expenses using MySQLDatabase method
    const incomeExpense = await db.getTransactionStats(parseInt(decoded.userId), dateFilter);

    // Get category breakdown using MySQLDatabase method
    const transactions = await db.getTransactionsByUserId(parseInt(decoded.userId), { dateFilter });
    const categoryBreakdown = transactions.reduce((acc: any[], t: any) => {
      const existing = acc.find(c => c.category === t.category);
      if (existing) {
        existing.total_amount += t.amount;
        existing.count += 1;
      } else {
        acc.push({
          category: t.category,
          total_amount: t.amount,
          count: 1,
          average_amount: t.amount
        });
      }
      return acc;
    }, []).sort((a: any, b: any) => b.total_amount - a.total_amount).slice(0, 10);

    // Get monthly trends using MySQLDatabase method
    const monthlyTrends = await db.getTransactionStats(parseInt(decoded.userId), dateFilter);
    
    // Get budget summary using MySQLDatabase method
    const budgetSummary = await db.getBudgetSummary(parseInt(decoded.userId));

    // Get top categories
    const topCategories = categoryBreakdown.map((cat: any, index: number) => ({
      category: cat.category,
      amount: cat.total_amount,
      percentage: incomeExpense.total_expenses > 0 ? (cat.total_amount / incomeExpense.total_expenses) * 100 : 0
    }));

    // Calculate average daily spending
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const averageDailySpending = incomeExpense.total_expenses / days;

    res.status(200).json({
      success: true,
      message: 'Dashboard analytics retrieved successfully',
      data: {
        analytics: {
          period,
          startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
          totalIncome: incomeExpense.total_income || 0,
          totalExpenses: incomeExpense.total_expenses || 0,
          netIncome: (incomeExpense.total_income || 0) - (incomeExpense.total_expenses || 0),
          transactionCount: incomeExpense.transaction_count || 0,
          averageTransaction: incomeExpense.average_transaction || 0,
          savingsRate: incomeExpense.total_income > 0 ? 
            ((incomeExpense.total_income - incomeExpense.total_expenses) / incomeExpense.total_income) * 100 : 0,
          categoryBreakdown,
          monthlyTrends,
          budgetSummary,
          topCategories,
          averageDailySpending
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get dashboard analytics error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      timestamp: new Date().toISOString()
    });
  }
});

// Get spending patterns
router.get('/spending-patterns', [
  query('months').optional().isInt({ min: 1, max: 12 })
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        timestamp: new Date().toISOString()
      });
    }

    const authHeader = req.headers.authorization;
    const token = JWTUtils.extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
        timestamp: new Date().toISOString()
      });
    }

    const decoded = JWTUtils.verifyToken(token);
    const months = parseInt(req.query.months as string) || 6;

    const patterns = await db.getSpendingPatterns(parseInt(decoded.userId), months);

    res.status(200).json({
      success: true,
      message: 'Spending patterns retrieved successfully',
      data: { patterns },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get spending patterns error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
