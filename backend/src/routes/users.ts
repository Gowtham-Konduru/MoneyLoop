import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { JWTUtils } from '../utils/jwt';
import { logger } from '../utils/logger';
import { db } from '../models/Database';

const router = Router();

// Get user profile
router.get('/profile', async (req: Request, res: Response) => {
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

    const user = await db.getUserById(parseInt(decoded.userId));

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    const preferences = await db.getUserPreferencesByUserId(parseInt(decoded.userId));

    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          avatar: user.avatar,
          isEmailVerified: user.is_email_verified,
          lastLoginAt: user.last_login_at,
          createdAt: user.created_at,
          preferences: preferences || {
            currency: 'USD',
            language: 'en',
            timezone: 'UTC',
            notifications: { email: true, push: true, budgetAlerts: true, weeklyReports: true },
            theme: 'light'
          }
        }
      },
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

// Update user preferences
router.put('/preferences', [
  body('preferences').isObject()
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
    const { preferences } = req.body;

    // Update preferences
    const result = await db.updateUserPreferences(parseInt(decoded.userId), {
      currency: preferences.currency,
      language: preferences.language,
      timezone: preferences.timezone,
      notifications: JSON.stringify(preferences.notifications || {}),
      theme: preferences.theme
    });

    if (!result) {
      // Insert if not exists
      await db.createUserPreferences({
        user_id: parseInt(decoded.userId),
        currency: preferences.currency || 'USD',
        language: preferences.language || 'en',
        timezone: preferences.timezone || 'UTC',
        notifications: JSON.stringify(preferences.notifications || {}),
        theme: preferences.theme || 'light'
      });
    }

    logger.info(`User preferences updated: ${decoded.email}`);

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: { preferences },
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error) {
    logger.error('Update preferences error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

// Update user profile
router.put('/profile', [
  body('username').optional().isLength({ min: 2 }).trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phoneNumber').optional().trim()
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
    const { username, email, phoneNumber } = req.body;

    const updates: any = {};
    if (username) updates.username = username;
    if (email) updates.email = email;
    if (phoneNumber) updates.phone_number = phoneNumber;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No update data provided',
        timestamp: new Date().toISOString()
      });
    }

    const result = await db.updateUser(parseInt(decoded.userId), updates);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'User not found or no changes made',
        timestamp: new Date().toISOString()
      });
    }

    logger.info(`User profile updated: ${decoded.email}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { username, email, phoneNumber },
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get user statistics
router.get('/stats', async (req: Request, res: Response) => {
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

    // Get transaction stats
    const transactionStats = await db.getTransactionStats(parseInt(decoded.userId));
    const budgetSummary = await db.getBudgetSummary(parseInt(decoded.userId));
    const transactions = await db.getTransactionsByUserId(parseInt(decoded.userId));
    const recentTransactions = transactions.filter(t => 
      new Date(t.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    res.status(200).json({
      success: true,
      message: 'User statistics retrieved successfully',
      data: {
        stats: {
          totalIncome: transactionStats.total_income || 0,
          totalExpenses: transactionStats.total_expenses || 0,
          netIncome: (transactionStats.total_income || 0) - (transactionStats.total_expenses || 0),
          transactionCount: transactionStats.transaction_count || 0,
          activeBudgets: budgetSummary.active_budgets || 0,
          totalBudgeted: budgetSummary.total_budgeted || 0,
          totalSpent: budgetSummary.total_spent || 0,
          recentTransactions: recentTransactions.length || 0
        }
      },
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error) {
    logger.error('Get stats error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

// Get user notifications
router.get('/notifications', async (req: Request, res: Response) => {
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
    const notifications = await db.getNotificationsByUserId(parseInt(decoded.userId));

    res.status(200).json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: { notifications },
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

// Mark notification as read
router.put('/notifications/:id/read', async (req: Request, res: Response) => {
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
    const { id } = req.params;

    const result = await db.markNotificationAsRead(parseInt(id), parseInt(decoded.userId));

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error) {
    logger.error('Mark notification read error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

// Reset all user data
router.post('/profile/reset-data', async (req: Request, res: Response) => {
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
    const userId = parseInt(decoded.userId);

    await db.resetUserData(userId);

    res.status(200).json({
      success: true,
      message: 'All financial data has been reset successfully.',
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error) {
    logger.error('Reset user data error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

export default router;
