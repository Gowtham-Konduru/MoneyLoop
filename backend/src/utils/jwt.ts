import jwt, { SignOptions } from 'jsonwebtoken';
import { logger } from './logger';

const JWT_SECRET: string = process.env.JWT_SECRET || 'MoneyLoopSecretKey2024!@#$%^&*()';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '24h';

export interface JWTPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  iat?: number;
  exp?: number;
}

export class JWTUtils {
  /**
   * Generate a JWT token for a user
   */
  static generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    try {
      const options: SignOptions = {
        expiresIn: JWT_EXPIRES_IN as any,
        issuer: 'moneyloop-backend',
        audience: 'moneyloop-frontend'
      };
      return jwt.sign(payload, JWT_SECRET as any, options);
    } catch (error) {
      logger.error('Error generating JWT token:', error);
      throw new Error('Failed to generate token');
    }
  }

  /**
   * Verify and decode a JWT token
   */
  static verifyToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'moneyloop-backend',
        audience: 'moneyloop-frontend'
      }) as JWTPayload;
      
      return decoded;
    } catch (error) {
      logger.error('Error verifying JWT token:', error);
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Get token expiration time in seconds
   */
  static getTokenExpirationTime(): number {
    const expiresIn = JWT_EXPIRES_IN;
    const timeUnit = expiresIn.slice(-1);
    const timeValue = parseInt(expiresIn.slice(0, -1));

    switch (timeUnit) {
      case 's':
        return timeValue;
      case 'm':
        return timeValue * 60;
      case 'h':
        return timeValue * 60 * 60;
      case 'd':
        return timeValue * 60 * 60 * 24;
      default:
        return 24 * 60 * 60; // Default to 24 hours
    }
  }
}
