import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { JWTUtils } from '../utils/jwt';
import { logger } from '../utils/logger';
import { db } from '../models/Database';

const router = Router();

// Get budgets
router.get('/', [
  query('isActive').optional().isBoolean(),
  query('period').optional().isIn(['weekly', 'monthly', 'yearly'])
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
    const { isActive, period } = req.query;

    const budgets = await db.getBudgetsByUserId(parseInt(decoded.userId), {
      isActive: isActive === 'true' ? 1 : (isActive === 'false' ? 0 : undefined),
      period
    });

    res.status(200).json({
      success: true,
      message: 'Budgets retrieved successfully',
      data: {
        budgets: budgets.map((b: any) => ({
          ...b,
          categories: typeof b.categories === 'string' ? JSON.parse(b.categories) : b.categories || []
        }))
      },
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error) {
    logger.error('Get budgets error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

// Create budget
router.post('/', [
  body('name').isLength({ min: 1 }),
  body('amount').isFloat({ min: 0.01 }),
  body('period').isIn(['weekly', 'monthly', 'yearly']),
  body('startDate').isISO8601(),
  body('endDate').isISO8601()
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
    const { name, amount, period, startDate, endDate, categories = [] } = req.body;

    const result = await db.createBudget({
      user_id: parseInt(decoded.userId),
      name,
      amount,
      period,
      start_date: startDate,
      end_date: endDate,
      categories
    });

    logger.info(`Budget created: ${name} for user ${decoded.userId}`);

    res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      data: {
        budget: {
          id: result.insertId,
          name,
          amount,
          spent: 0,
          period,
          startDate,
          endDate,
          categories,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error) {
    logger.error('Create budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

// Update budget
router.put('/:id', [
  body('name').optional().isLength({ min: 1 }),
  body('amount').optional().isFloat({ min: 0 })
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
    const budgetId = req.params.id;
    const { name, amount, icon } = req.body;

    // Verify the budget belongs to the user
    const budget = await db.getBudgetById(parseInt(budgetId));
    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found',
        timestamp: new Date().toISOString()
      });
    }

    if (budget.user_id !== parseInt(decoded.userId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this budget',
        timestamp: new Date().toISOString()
      });
    }

    // Update the budget
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (amount !== undefined) updateData.amount = amount;

    const updated = await db.updateBudget(parseInt(budgetId), updateData);

    if (updated) {
      logger.info(`Budget updated: ${budgetId} by user ${decoded.userId}`);
      res.status(200).json({
        success: true,
        message: 'Budget updated successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to update budget',
        timestamp: new Date().toISOString()
      });
    }
    return;
  } catch (error) {
    logger.error('Update budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

// Delete budget
router.delete('/:id', async (req: Request, res: Response) => {
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
    const budgetId = req.params.id;

    // Verify the budget belongs to the user
    const budget = await db.getBudgetById(parseInt(budgetId));
    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found',
        timestamp: new Date().toISOString()
      });
    }

    if (budget.user_id !== parseInt(decoded.userId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this budget',
        timestamp: new Date().toISOString()
      });
    }

    await db.deleteBudget(parseInt(budgetId));

    logger.info(`Budget deleted: ${budgetId} by user ${decoded.userId}`);

    res.status(200).json({
      success: true,
      message: 'Budget deleted successfully',
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error) {
    logger.error('Delete budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

// Get budget summary
router.get('/summary/overview', async (req: Request, res: Response) => {
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

    const budgetSummary = await db.getBudgetSummary(parseInt(decoded.userId));

    res.status(200).json({
      success: true,
      message: 'Budget summary retrieved successfully',
      data: {
        budgetSummary: {
          totalBudgets: budgetSummary.total_budgets || 0,
          activeBudgets: budgetSummary.active_budgets || 0,
          totalBudgeted: parseFloat(budgetSummary.total_budgeted || 0),
          totalSpent: parseFloat(budgetSummary.total_spent || 0),
          remaining: parseFloat(budgetSummary.total_budgeted || 0) - parseFloat(budgetSummary.total_spent || 0)
        }
      },
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error) {
    logger.error('Get budget summary error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

export default router;
