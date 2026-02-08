import express from 'express';
import teamAuthMiddleware from '../middleware/teamAuthMiddleware.js';
import Team from '../models/Team.js';
import Asset from '../models/Asset.js';

const router = express.Router();

/**
 * GET /api/team-data/dashboard
 * Get team's dashboard data (protected route)
 */
router.get('/dashboard', teamAuthMiddleware, async (req, res) => {
    try {
        const team = req.team;

        // Get current asset prices
        const assets = await Asset.find({});
        const assetPrices = {};
        assets.forEach(asset => {
            assetPrices[asset.assetType] = asset.currentValue;
        });

        // Calculate portfolio value
        const portfolioValue = calculatePortfolio(team, assetPrices);

        // Get rank
        const rank = await calculateTeamRank(team._id, assetPrices);

        res.json({
            success: true,
            team: {
                teamId: team.teamId,
                teamName: team.teamName,
                balance: team.balance,
                assets: team.assets,
                portfolioValue,
                rank: rank.rank,
                totalTeams: rank.total,
            },
            assetPrices,
        });
    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * GET /api/team-data/portfolio
 * Get team's portfolio value
 */
router.get('/portfolio', teamAuthMiddleware, async (req, res) => {
    try {
        const team = req.team;

        // Get current asset prices
        const assets = await Asset.find({});
        const assetPrices = {};
        assets.forEach(asset => {
            assetPrices[asset.assetType] = asset.currentValue;
        });

        const portfolioValue = calculatePortfolio(team, assetPrices);

        res.json({
            success: true,
            portfolioValue,
            breakdown: {
                balance: team.balance,
                cryptoValue: team.assets.CRYPTO * assetPrices.CRYPTO,
                stockValue: team.assets.STOCK * assetPrices.STOCK,
                goldValue: team.assets.GOLD * assetPrices.GOLD,
                euroBondValue: team.assets.EURO_BOND * assetPrices.EURO_BOND,
                treasuryBillValue: team.assets.TREASURY_BILL * assetPrices.TREASURY_BILL,
            },
        });
    } catch (error) {
        console.error('Get portfolio error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * GET /api/team-data/rank
 * Get team's current rank
 */
router.get('/rank', teamAuthMiddleware, async (req, res) => {
    try {
        const team = req.team;

        // Get current asset prices
        const assets = await Asset.find({});
        const assetPrices = {};
        assets.forEach(asset => {
            assetPrices[asset.assetType] = asset.currentValue;
        });

        const rankData = await calculateTeamRank(team._id, assetPrices);

        res.json({
            success: true,
            rank: rankData.rank,
            totalTeams: rankData.total,
            portfolioValue: rankData.portfolioValue,
        });
    } catch (error) {
        console.error('Get rank error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * Helper: Calculate portfolio value
 */
function calculatePortfolio(team, assetPrices) {
    const assetValue =
        (team.assets.CRYPTO || 0) * (assetPrices.CRYPTO || 0) +
        (team.assets.STOCK || 0) * (assetPrices.STOCK || 0) +
        (team.assets.GOLD || 0) * (assetPrices.GOLD || 0) +
        (team.assets.EURO_BOND || 0) * (assetPrices.EURO_BOND || 0) +
        (team.assets.TREASURY_BILL || 0) * (assetPrices.TREASURY_BILL || 0);

    return (team.balance || 0) + assetValue;
}

/**
 * Helper: Calculate team's rank
 */
async function calculateTeamRank(teamId, assetPrices) {
    // Get all qualified teams
    const allTeams = await Team.find({ round1Qualified: true });

    // Calculate portfolio for each team
    const teamsWithPortfolio = allTeams.map(team => ({
        _id: team._id,
        teamId: team.teamId,
        teamName: team.teamName,
        portfolioValue: calculatePortfolio(team, assetPrices),
    }));

    // Sort by portfolio value (descending)
    teamsWithPortfolio.sort((a, b) => b.portfolioValue - a.portfolioValue);

    // Find current team's rank
    const rankIndex = teamsWithPortfolio.findIndex(t => t._id.toString() === teamId.toString());
    const rank = rankIndex + 1;
    const currentTeam = teamsWithPortfolio[rankIndex];

    return {
        rank,
        total: teamsWithPortfolio.length,
        portfolioValue: currentTeam?.portfolioValue || 0,
    };
}

export default router;
