import express from 'express';
import jwt from 'jsonwebtoken';
import Team from '../models/Team.js';

const router = express.Router();

/**
 * POST /api/team-auth/login
 * Team login with teamId and password
 */
router.post('/login', async (req, res) => {
    try {
        const { teamId, password } = req.body;

        if (!teamId || !password) {
            return res.status(400).json({ error: 'Team ID and password required' });
        }

        // Find team by teamId
        const team = await Team.findOne({ teamId });

        if (!team) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Compare password
        const isMatch = await team.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token for team
        const token = jwt.sign(
            {
                teamId: team.teamId,
                id: team._id,
                type: 'team' // Distinguish from admin tokens
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            team: {
                teamId: team.teamId,
                teamName: team.teamName,
                id: team._id,
            },
        });
    } catch (error) {
        console.error('Team login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * POST /api/team-auth/verify
 * Verify team JWT token
 */
router.post('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verify it's a team token
        if (decoded.type !== 'team') {
            return res.status(401).json({ error: 'Invalid token type' });
        }

        // Get team data
        const team = await Team.findById(decoded.id).select('-password');

        if (!team) {
            return res.status(401).json({ error: 'Team not found' });
        }

        res.json({
            success: true,
            team: {
                teamId: team.teamId,
                teamName: team.teamName,
                id: team._id,
            },
        });
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
});

/**
 * GET /api/team-auth/me
 * Get current authenticated team's full data
 */
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.type !== 'team') {
            return res.status(401).json({ error: 'Invalid token type' });
        }

        const team = await Team.findById(decoded.id).select('-password');

        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        res.json({
            success: true,
            team,
        });
    } catch (error) {
        console.error('Get team error:', error);
        res.status(401).json({ error: 'Invalid or expired token' });
    }
});

export default router;
