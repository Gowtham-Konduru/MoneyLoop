import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { JWTUtils } from '../utils/jwt';
import { logger } from '../utils/logger';
import { db } from '../models/Database';

const router = Router();

// Get transactions
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().isString(),
  query('type').optional().isIn(['income', 'expense']),
  query('search').optional().isString()
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
    const { category, type, search, page = 1, limit = 10 } = req.query;
    const transactions = await db.getTransactionsByUserId(parseInt(decoded.userId), {
      category: category as string,
      type: type as string,
      search: search as string,
      page: Number(page),
      limit: Number(limit)
    });

    const stats = await db.getTransactionStats(parseInt(decoded.userId));
    const total = stats.transaction_count;

    res.status(200).json({
      success: true,
      message: 'Transactions retrieved successfully',
      data: {
        transactions: transactions.map((t: any) => ({
          ...t,
          tags: typeof t.tags === 'string' ? JSON.parse(t.tags) : t.tags || [],
          attachments: typeof t.attachments === 'string' ? JSON.parse(t.attachments) : t.attachments || []
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      },
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error) {
    logger.error('Get transactions error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

// Create transaction
router.post('/', [
  body('amount').isFloat({ min: 0.01 }),
  body('type').isIn(['income', 'expense']),
  body('category').isLength({ min: 1 }),
  body('date').isISO8601(),
  body('account').isLength({ min: 1 })
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
    const { amount, type, category, description, date, account, tags = [], attachments = [] } = req.body;

    const result = await db.createTransaction({
      user_id: parseInt(decoded.userId),
      amount,
      type,
      category,
      description: description || null,
      date,
      account,
      tags,
      attachments
    });

    // Create a real-time notification
    await db.createNotification({
      user_id: parseInt(decoded.userId),
      title: type === 'income' ? 'Income Received' : 'Expense Logged',
      message: `${type === 'income' ? 'Received' : 'Spent'} ₹${amount} for ${category}`,
      type: type === 'income' ? 'success' : 'info'
    });

    logger.info(`Transaction created: ${type} ${amount} for user ${decoded.userId}`);

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: {
        transaction: {
          id: result.insertId,
          amount,
          type,
          category,
          description,
          date,
          account,
          tags,
          attachments,
          createdAt: new Date().toISOString()
        }
      },
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error) {
    logger.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

// Get transaction statistics
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
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

    const stats = await db.getTransactionStats(parseInt(decoded.userId));

    res.status(200).json({
      success: true,
      message: 'Transaction statistics retrieved successfully',
      data: {
        stats: {
          totalIncome: parseFloat(stats.total_income || 0),
          totalExpenses: parseFloat(stats.total_expenses || 0),
          netIncome: parseFloat(stats.total_income || 0) - parseFloat(stats.total_expenses || 0),
          incomeCount: stats.income_count || 0,
          expenseCount: stats.expense_count || 0,
          transactionCount: stats.transaction_count || 0
        }
      },
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error) {
    logger.error('Get transaction stats error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

export default router;
