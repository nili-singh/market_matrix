import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

/**
 * POST /api/superadmin/login
 * Super admin login - Simple env-based authentication
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // Simple env-based authentication
        const envUsername = process.env.SUPERADMIN_USERNAME || 'superadmin';
        const envPassword = process.env.SUPERADMIN_PASSWORD || 'superadmin';

        if (username !== envUsername || password !== envPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token with isSuperAdmin flag
        const token = jwt.sign(
            {
                username: username,
                isSuperAdmin: true  // Flag to distinguish from regular admin
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            superAdmin: {
                username: username,
            },
        });
    } catch (error) {
        console.error('Super admin login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * POST /api/superadmin/verify
 * Verify JWT token
 */
router.post('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verify this is a super admin token
        if (!decoded.isSuperAdmin) {
            return res.status(403).json({ error: 'Not a super admin token' });
        }

        res.json({
            success: true,
            superAdmin: {
                id: decoded.id,
                username: decoded.username,
            },
        });
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
});

export default router;
