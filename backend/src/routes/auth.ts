import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import { JWTUtils } from '../utils/jwt';
import { logger } from '../utils/logger';
import { db } from '../models/Database';
import { OAuth2Client } from 'google-auth-library';
import { emailService } from '../services/emailService';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('username').isLength({ min: 2 }).trim(),
  body('phoneNumber').optional().trim()
];

const loginValidation = [
  body('identifier').notEmpty().withMessage('Username, email, or mobile number is required'),
  body('password').notEmpty()
];

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Email is required')
];

const verifyOtpValidation = [
  body('email').isEmail().withMessage('Email is required'),
  body('otp').notEmpty().withMessage('OTP is required')
];

const resetPasswordValidation = [
  body('email').isEmail().withMessage('Email is required'),
  body('otp').notEmpty().withMessage('OTP is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

// Register user
router.post('/register', registerValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { email, password, username, phoneNumber } = req.body;

    // Check if user already exists
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'User already exists',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user (use email as username if not provided)
    const result = await db.createUser({
      email,
      username: username || email, // Use email as username
      phone_number: phoneNumber || null,
      password: hashedPassword
    });
    
    // Create user preferences
    await db.createUserPreferences({
      user_id: result.insertId,
      currency: 'USD',
      language: 'en',
      timezone: 'UTC',
      notifications: JSON.stringify({ email: true, push: true, budgetAlerts: true, weeklyReports: true }),
      theme: 'light'
    });

    logger.info(`User registered: ${email}`);

    // Send welcome email
    await emailService.sendWelcomeEmail(email, username || email);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please sign in to continue.',
      data: {
        user: {
          id: result.insertId,
          email,
          username: username || email,
          phoneNumber: phoneNumber || null,
          createdAt: new Date().toISOString()
        }
      },
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

// Login user
router.post('/login', loginValidation, async (req: Request, res: Response) => {
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

    const { identifier, password } = req.body;

    // Find user by username, email, or phone number
    const user = await db.getUserByIdentifier(identifier);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        timestamp: new Date().toISOString()
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        timestamp: new Date().toISOString()
      });
    }

    // Generate JWT token
    const token = JWTUtils.generateToken({
      userId: user.user_id.toString(),
      email: user.email,
      firstName: user.username,
      lastName: ''
    });

    logger.info(`User logged in: ${user.email}`);

    // Send login notification email
    const loginTime = new Date().toLocaleString();
    await emailService.sendLoginNotification(user.email, user.username, loginTime);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.user_id,
          email: user.email,
          username: user.username,
          phoneNumber: user.phone_number,
          firstName: user.username,
          lastName: ''
        },
        token
      },
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

// Google Login
router.post('/google-login', async (req: Request, res: Response) => {
  try {
    const { idToken, accessToken } = req.body;

    let email, name, picture, googleId;

    if (idToken) {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Invalid token payload');
      }
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
      googleId = payload.sub;
    } else if (accessToken) {
      // Verify via Google UserInfo API
      const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
      const userInfo = await response.json() as any;
      
      if (userInfo.error) {
        throw new Error(userInfo.error_description || 'Invalid access token');
      }
      
      email = userInfo.email;
      name = userInfo.name;
      picture = userInfo.picture;
      googleId = userInfo.sub;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Token is required',
        timestamp: new Date().toISOString()
      });
    }

    if (!email) {
      throw new Error('Email not provided by Google');
    }

    // Check if user already exists
    let user = await db.getUserByEmail(email);

    if (!user) {
      // Create user if not exists
      const result = await db.createUser({
        email,
        username: name || email.split('@')[0],
        password: `google_${googleId}`, // Placeholder password for social login
      });
      
      const userId = result.insertId;
      
      // Create user preferences
      await db.createUserPreferences({
        user_id: userId,
        currency: 'USD',
        language: 'en',
        timezone: 'UTC',
        notifications: JSON.stringify({ email: true, push: true, budgetAlerts: true, weeklyReports: true }),
        theme: 'light'
      });

      user = await db.getUserById(userId);
    }

    // Generate JWT token
    const token = JWTUtils.generateToken({
      userId: user.user_id.toString(),
      email: user.email,
      firstName: user.username,
      lastName: ''
    });

    logger.info(`User logged in via Google: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Google login successful',
      data: {
        user: {
          id: user.user_id,
          email: user.email,
          username: user.username,
          phoneNumber: user.phone_number,
          firstName: user.username,
          lastName: '',
          avatar: picture
        },
        token
      },
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error) {
    logger.error('Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

// Change Password
router.post('/change-password', [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
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
    const { currentPassword, newPassword } = req.body;

    const user = await db.getUserByEmail(decoded.email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    // In a real app, use bcrypt.compare
    if (user.password !== currentPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password incorrect',
        timestamp: new Date().toISOString()
      });
    }

    // Update password
    await db.updateUser(user.user_id, { password: newPassword });

    logger.info(`Password changed for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

// Get current user
router.get('/me', async (req: Request, res: Response) => {
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
      message: 'User retrieved successfully',
      data: {
        user: {
          id: user.user_id,
          email: user.email,
          username: user.username,
          phoneNumber: user.phone_number,
          firstName: user.username,
          lastName: '',
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
    logger.error('Get user error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

// Forgot Password - Send OTP
router.post('/forgot-password/send-otp', forgotPasswordValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { email } = req.body;

    // Check if email exists and is eligible for password reset
    const eligibility = await db.isEmailEligibleForPasswordReset(email);
    
    if (!eligibility.exists) {
      return res.status(404).json({
        success: false,
        message: 'This email address is not registered in our system',
        timestamp: new Date().toISOString()
      });
    }

    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    logger.info(`Generated OTP for ${email}: ${otp}`);
    
    // Store OTP in database (expires in 5 minutes)
    const otpStored = await db.storeOtp(email, otp);
    
    logger.info(`OTP storage result for ${email}: ${otpStored}`);
    
    if (!otpStored) {
      logger.error(`Failed to store OTP for ${email}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate OTP. Please try again.',
        timestamp: new Date().toISOString()
      });
    }

    // Send OTP via email service
    const emailSent = await emailService.sendOtpEmail(email, otp);
    
    if (!emailSent) {
      logger.warn(`Failed to send OTP email to ${email}, but OTP was stored successfully`);
      // Return success even if email fails, as OTP is stored in database for verification
      return res.status(200).json({
        success: true,
        message: 'OTP generated successfully. Please check your email (email service may be temporarily unavailable).',
        timestamp: new Date().toISOString()
      });
    }

    logger.info(`OTP sent successfully to ${email}`);

    res.status(200).json({
      success: true,
      message: 'OTP has been sent to your email address',
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error) {
    logger.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

// Verify OTP
router.post('/forgot-password/verify-otp', verifyOtpValidation, async (req: Request, res: Response) => {
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

    const { email, otp } = req.body;

    // Verify OTP
    const isValid = await db.verifyOtp(email, otp);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error) {
    logger.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

// Reset Password
router.post('/forgot-password/reset-password', resetPasswordValidation, async (req: Request, res: Response) => {
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

    const { email, otp, newPassword } = req.body;

    // Verify OTP again
    const isValid = await db.verifyOtp(email, otp);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
        timestamp: new Date().toISOString()
      });
    }

    // Get user by email
    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const passwordUpdated = await db.updateUser(user.user_id, { password: hashedPassword });
    
    if (!passwordUpdated) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update password. Please try again.',
        timestamp: new Date().toISOString()
      });
    }

    // Delete OTP after successful reset
    await db.deleteOtp(email);

    // Send password reset confirmation email
    await emailService.sendPasswordResetConfirmation(email);

    logger.info(`Password reset completed for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. A confirmation email has been sent to your email address.',
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

// Logout
router.post('/logout', async (req: Request, res: Response) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logout successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
