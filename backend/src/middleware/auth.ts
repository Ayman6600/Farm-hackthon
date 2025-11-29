import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email?: string;
    };
}

export const authenticateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // Clerk middleware already validates the token
        // We just need to extract auth from the request
        const auth = getAuth(req);

        if (!auth || !auth.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Attach user info to request
        req.user = {
            id: auth.userId,
            email: auth.sessionClaims?.email as string
        };

        next();
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(401).json({ error: 'Authentication failed' });
    }
};
