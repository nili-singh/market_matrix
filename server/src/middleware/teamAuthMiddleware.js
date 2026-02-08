import jwt from 'jsonwebtoken';
import Team from '../models/Team.js';

/**
 * Team Authentication Middleware
 * Verifies team JWT token and loads team data into req.team
 */
const teamAuthMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verify it's a team token (not admin)
        if (decoded.type !== 'team') {
            return res.status(401).json({ error: 'Invalid token type' });
        }

        // Load team from database
        const team = await Team.findById(decoded.id).select('-password');

        if (!team) {
            return res.status(401).json({ error: 'Team not found' });
        }

        // Attach team to request
        req.team = team;
        req.teamId = team.teamId;

        next();
    } catch (error) {
        console.error('Team auth middleware error:', error);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

export default teamAuthMiddleware;
