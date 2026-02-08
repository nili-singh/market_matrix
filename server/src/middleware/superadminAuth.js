import jwt from 'jsonwebtoken';

/**
 * Middleware to authenticate super admin requests
 */
const superadminAuthMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Ensure this is a super admin token (has isSuperAdmin flag)
        if (!decoded.isSuperAdmin) {
            return res.status(403).json({ error: 'Access denied. Super admin privileges required.' });
        }

        // Attach super admin info to request
        req.superAdmin = {
            id: decoded.id,
            username: decoded.username,
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        res.status(500).json({ error: 'Server error' });
    }
};

export default superadminAuthMiddleware;
