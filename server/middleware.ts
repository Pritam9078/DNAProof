import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

export interface AuthRequest extends Request {
  user?: { address: string; role: string };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized: Missing Token" });
  }

  const token = authHeader.split(' ')[1];
  
  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ message: "Unauthorized: Invalid Token Format" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Forbidden: Invalid or Expired Token" });
    }
    req.user = user as any;
    next();
  });
};
