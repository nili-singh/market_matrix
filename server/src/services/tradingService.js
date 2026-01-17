import Team from '../models/Team.js';
import Asset from '../models/Asset.js';
import Transaction from '../models/Transaction.js';
import assetService from './assetService.js';

class TradingService {
    /**
     * Execute a buy transaction
     */
    async executeBuy(teamId, assetType, quantity, currentRound) {
        const team = await Team.findById(teamId);
        if (!team) throw new Error('Team not found');

        const asset = await Asset.findOne({ assetType });
        if (!asset) throw new Error('Asset not found');

        const totalCost = asset.currentValue * quantity;

        // Validate sufficient balance
        if (team.virtualBalance < totalCost) {
            throw new Error('Insufficient balance');
        }

        // Update team
        team.virtualBalance -= totalCost;
        team.assets[assetType] += quantity;
        await team.save();

        // Update asset value based on volume
        const { asset: updatedAsset, priceChanged } = await assetService.updateAssetValue(
            assetType,
            'BUY',
            quantity,
            currentRound
        );

        // Log transaction
        const transaction = new Transaction({
            teamId,
            round: currentRound,
            assetType,
            action: 'BUY',
            quantity,
            pricePerUnit: asset.currentValue,
            totalAmount: totalCost,
            balanceAfter: team.virtualBalance,
        });
        await transaction.save();

        return {
            team,
            asset: updatedAsset,
            transaction,
            priceChanged,
        };
    }

    /**
     * Execute a sell transaction
     */
    async executeSell(teamId, assetType, quantity, currentRound) {
        const team = await Team.findById(teamId);
        if (!team) throw new Error('Team not found');

        const asset = await Asset.findOne({ assetType });
        if (!asset) throw new Error('Asset not found');

        // Validate sufficient assets
        if (team.assets[assetType] < quantity) {
            throw new Error('Insufficient assets');
        }

        const totalRevenue = asset.currentValue * quantity;

        // Update team
        team.virtualBalance += totalRevenue;
        team.assets[assetType] -= quantity;
        await team.save();

        // Update asset value based on volume
        const { asset: updatedAsset, priceChanged } = await assetService.updateAssetValue(
            assetType,
            'SELL',
            quantity,
            currentRound
        );

        // Log transaction
        const transaction = new Transaction({
            teamId,
            round: currentRound,
            assetType,
            action: 'SELL',
            quantity,
            pricePerUnit: asset.currentValue,
            totalAmount: totalRevenue,
            balanceAfter: team.virtualBalance,
        });
        await transaction.save();

        return {
            team,
            asset: updatedAsset,
            transaction,
            priceChanged,
        };
    }

    /**
     * Execute team-to-team trade (admin controlled)
     */
    async executeTeamTrade(fromTeamId, toTeamId, assetType, quantity, agreedPrice, currentRound) {
        const fromTeam = await Team.findById(fromTeamId);
        const toTeam = await Team.findById(toTeamId);

        if (!fromTeam || !toTeam) throw new Error('Team not found');

        // Validate from team has assets
        if (fromTeam.assets[assetType] < quantity) {
            throw new Error('Selling team has insufficient assets');
        }

        const totalCost = agreedPrice * quantity;

        // Validate to team has balance
        if (toTeam.virtualBalance < totalCost) {
            throw new Error('Buying team has insufficient balance');
        }

        // Execute transfer
        fromTeam.assets[assetType] -= quantity;
        fromTeam.virtualBalance += totalCost;

        toTeam.assets[assetType] += quantity;
        toTeam.virtualBalance -= totalCost;

        await fromTeam.save();
        await toTeam.save();

        // Log transactions for both teams
        const sellTransaction = new Transaction({
            teamId: fromTeamId,
            round: currentRound,
            assetType,
            action: 'TEAM_TRADE',
            quantity,
            pricePerUnit: agreedPrice,
            totalAmount: totalCost,
            counterpartyTeamId: toTeamId,
            balanceAfter: fromTeam.virtualBalance,
        });

        const buyTransaction = new Transaction({
            teamId: toTeamId,
            round: currentRound,
            assetType,
            action: 'TEAM_TRADE',
            quantity,
            pricePerUnit: agreedPrice,
            totalAmount: totalCost,
            counterpartyTeamId: fromTeamId,
            balanceAfter: toTeam.virtualBalance,
        });

        await sellTransaction.save();
        await buyTransaction.save();

        return {
            fromTeam,
            toTeam,
            transactions: [sellTransaction, buyTransaction],
        };
    }

    /**
     * Calculate team portfolio value
     */
    async calculatePortfolioValue(teamId) {
        const team = await Team.findById(teamId);
        if (!team) throw new Error('Team not found');

        const assets = await Asset.find();
        let portfolioValue = team.virtualBalance;

        for (const asset of assets) {
            const quantity = team.assets[asset.assetType] || 0;
            portfolioValue += asset.currentValue * quantity;
        }

        return {
            teamId,
            teamName: team.teamName,
            balance: team.virtualBalance,
            portfolioValue,
            assets: team.assets,
        };
    }

    /**
     * Get leaderboard (sorted by portfolio value)
     */
    async getLeaderboard() {
        const teams = await Team.find({ round1Qualified: true });
        const assets = await Asset.find();

        const leaderboard = await Promise.all(
            teams.map(async (team) => {
                let portfolioValue = team.virtualBalance;

                for (const asset of assets) {
                    const quantity = team.assets[asset.assetType] || 0;
                    portfolioValue += asset.currentValue * quantity;
                }

                return {
                    teamId: team._id,
                    teamName: team.teamName,
                    balance: team.virtualBalance,
                    assets: team.assets,
                    portfolioValue,
                };
            })
        );

        // Sort by portfolio value descending
        leaderboard.sort((a, b) => b.portfolioValue - a.portfolioValue);

        return leaderboard;
    }
}

export default new TradingService();
