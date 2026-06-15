import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_USER === 'your_email@gmail.com') {
      logger.warn('Email credentials not configured. Email service will be disabled. Please set EMAIL_USER and EMAIL_PASS in .env file');
      this.transporter = null as any;
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Verify connection on startup
    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    if (!this.transporter) return;
    
    try {
      await this.transporter.verify();
      logger.info('Email service connection verified successfully');
    } catch (error) {
      logger.error('Email service connection failed:', error);
    }
  }

  async sendOtpEmail(email: string, otp: string): Promise<boolean> {
    if (!this.transporter) {
      logger.warn(`Email service not configured. OTP for ${email}: ${otp}`);
      return true; // Return true to avoid blocking the flow
    }

    try {
      const mailOptions = {
        from: `"MoneyLoop Finance" <${process.env.EMAIL_USER || process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Password Reset OTP - MoneyLoop Finance',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">MoneyLoop Finance</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">AI-Powered Financial Management</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center; border-left: 4px solid #667eea;">
              <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Password Reset Request</h2>
              <p style="color: #666; margin: 0 0 30px 0; font-size: 16px; line-height: 1.5;">
                You requested to reset your password. Use the One-Time Password (OTP) below to proceed:
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px dashed #667eea;">
                <p style="color: #666; margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">YOUR OTP CODE</p>
                <p style="color: #667eea; margin: 0; font-size: 36px; font-weight: bold; letter-spacing: 5px; font-family: 'Courier New', monospace;">${otp}</p>
              </div>
              
              <p style="color: #999; margin: 20px 0 0 0; font-size: 14px;">
                This OTP will expire in <strong>5 minutes</strong>.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f1f3f4; border-radius: 10px;">
              <p style="color: #666; margin: 0 0 15px 0; font-size: 14px;">
                <strong>Security Notice:</strong> Never share this OTP with anyone.
              </p>
              <p style="color: #999; margin: 0; font-size: 12px;">
                If you didn't request this password reset, please ignore this email or contact our support team.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="color: #999; margin: 0; font-size: 12px;">
                © 2026 MoneyLoop Finance. All rights reserved.
              </p>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`OTP email sent successfully to ${email}`, { messageId: result.messageId });
      return true;
    } catch (error) {
      logger.error(`Failed to send OTP email to ${email}:`, error);
      return false;
    }
  }

  async sendPasswordResetConfirmation(email: string): Promise<boolean> {
    if (!this.transporter) {
      logger.warn(`Email service not configured. Password reset confirmation for ${email}`);
      return true; // Return true to avoid blocking the flow
    }

    try {
      const mailOptions = {
        from: `"MoneyLoop Finance" <${process.env.EMAIL_USER || process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Password Reset Successful - MoneyLoop Finance',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">MoneyLoop Finance</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">AI-Powered Financial Management</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center; border-left: 4px solid #28a745;">
              <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Password Reset Successful</h2>
              <p style="color: #666; margin: 0 0 30px 0; font-size: 16px; line-height: 1.5;">
                Your password has been successfully reset. You can now log in to your account with your new password.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
                   style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); 
                          color: white; 
                          padding: 12px 30px; 
                          text-decoration: none; 
                          border-radius: 6px; 
                          font-weight: 600; 
                          display: inline-block;
                          font-size: 16px;">
                  Log In to Your Account
                </a>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f1f3f4; border-radius: 10px;">
              <p style="color: #666; margin: 0 0 15px 0; font-size: 14px;">
                <strong>Security Notice:</strong> If you didn't reset your password, please contact our support team immediately.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="color: #999; margin: 0; font-size: 12px;">
                © 2026 MoneyLoop Finance. All rights reserved.
              </p>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Password reset confirmation email sent to ${email}`, { messageId: result.messageId });
      return true;
    } catch (error) {
      logger.error(`Failed to send password reset confirmation to ${email}:`, error);
      return false;
    }
  }

  async sendWelcomeEmail(email: string, username: string): Promise<boolean> {
    if (!this.transporter) {
      logger.warn(`Email service not configured. Welcome email for ${email}`);
      return true; // Return true to avoid blocking the flow
    }

    try {
      const mailOptions = {
        from: `"MoneyLoop Finance" <${process.env.EMAIL_USER || process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Welcome to MoneyLoop Finance! 🎉',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">MoneyLoop Finance</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">AI-Powered Financial Management</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center; border-left: 4px solid #667eea;">
              <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Welcome to MoneyLoop Finance! 🎉</h2>
              <p style="color: #666; margin: 0 0 30px 0; font-size: 16px; line-height: 1.5;">
                Dear <strong>${username}</strong>,<br><br>
                Thank you for joining MoneyLoop Finance! Your account has been successfully created. We're excited to help you take control of your financial future with our AI-powered insights and intelligent budget tracking.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 12px 30px; 
                          text-decoration: none; 
                          border-radius: 6px; 
                          font-weight: 600; 
                          display: inline-block;
                          font-size: 16px;">
                  Get Started with Your Dashboard
                </a>
              </div>
              
              <div style="text-align: left; margin: 30px 0; padding: 20px; background: white; border-radius: 8px;">
                <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">What's Next?</h3>
                <ul style="color: #666; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
                  <li>Set up your budget categories</li>
                  <li>Add your income and expenses</li>
                  <li>Explore AI-powered financial insights</li>
                  <li>Track your spending patterns</li>
                </ul>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f1f3f4; border-radius: 10px;">
              <p style="color: #666; margin: 0 0 15px 0; font-size: 14px;">
                <strong>Need Help?</strong> Our support team is here to assist you.
              </p>
              <p style="color: #999; margin: 0; font-size: 12px;">
                If you have any questions, feel free to reach out to our support team.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="color: #999; margin: 0; font-size: 12px;">
                © 2026 MoneyLoop Finance. All rights reserved.
              </p>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Welcome email sent successfully to ${email}`, { messageId: result.messageId });
      return true;
    } catch (error) {
      logger.error(`Failed to send welcome email to ${email}:`, error);
      return false;
    }
  }

  async sendLoginNotification(email: string, username: string, loginTime: string): Promise<boolean> {
    if (!this.transporter) {
      logger.warn(`Email service not configured. Login notification for ${email}`);
      return true; // Return true to avoid blocking the flow
    }

    try {
      const mailOptions = {
        from: `"MoneyLoop Finance" <${process.env.EMAIL_USER || process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'New Login Detected - MoneyLoop Finance',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">MoneyLoop Finance</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">AI-Powered Financial Management</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center; border-left: 4px solid #667eea;">
              <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">New Login Detected</h2>
              <p style="color: #666; margin: 0 0 30px 0; font-size: 16px; line-height: 1.5;">
                Dear <strong>${username}</strong>,<br><br>
                We detected a new login to your MoneyLoop Finance account.
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #667eea;">
                <p style="color: #666; margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">LOGIN DETAILS</p>
                <p style="color: #333; margin: 5px 0; font-size: 14px;">
                  <strong>Email:</strong> ${email}
                </p>
                <p style="color: #333; margin: 5px 0; font-size: 14px;">
                  <strong>Time:</strong> ${loginTime}
                </p>
              </div>
              
              <p style="color: #666; margin: 20px 0; font-size: 14px; line-height: 1.5;">
                If this was you, you can safely ignore this email. If you didn't log in, please secure your account immediately.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile" 
                   style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); 
                          color: white; 
                          padding: 12px 30px; 
                          text-decoration: none; 
                          border-radius: 6px; 
                          font-weight: 600; 
                          display: inline-block;
                          font-size: 16px;">
                  Secure Your Account
                </a>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f1f3f4; border-radius: 10px;">
              <p style="color: #666; margin: 0 0 15px 0; font-size: 14px;">
                <strong>Security Notice:</strong> If you didn't log in, please change your password immediately.
              </p>
              <p style="color: #999; margin: 0; font-size: 12px;">
                MoneyLoop Finance will never ask for your password via email.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="color: #999; margin: 0; font-size: 12px;">
                © 2026 MoneyLoop Finance. All rights reserved.
              </p>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Login notification email sent to ${email}`, { messageId: result.messageId });
      return true;
    } catch (error) {
      logger.error(`Failed to send login notification to ${email}:`, error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      logger.warn('Email service not configured');
      return false;
    }
    
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      logger.error('Email service test connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
