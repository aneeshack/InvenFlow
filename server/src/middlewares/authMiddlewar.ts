import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request interface to include user property
export interface AuthenticatedRequest extends Request {
  user?: { email: string };
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('inside authenticate')
    // Get token from cookie
    const token = req.cookies.jwt;

    // Check if token exists
    if (!token) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { email: string };

    // Attach user information to request object
    req.user = { email: decoded.email };
    console.log('success authenticate')
    // Proceed to next middleware/route handler
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    
    // Handle specific JWT errors
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Token expired' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }

    res.status(500).json({ message: 'Authentication error' });
  }
};
