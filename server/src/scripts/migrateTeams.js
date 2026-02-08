import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/market_matrix');

// Define Team schema (without strict validation)
const teamSchema = new mongoose.Schema({}, { strict: false });
const Team = mongoose.model('Team', teamSchema);

async function migrateTeams() {
    try {
        console.log('🔄 Starting team migration...');

        // Get all teams
        const teams = await Team.find({});
        console.log(`Found ${teams.length} teams`);

        let migratedCount = 0;

        for (let i = 0; i < teams.length; i++) {
            const team = teams[i];
            let updated = false;

            // Add teamId if missing
            if (!team.teamId) {
                team.teamId = `TEAM_${String(i + 1).padStart(3, '0')}`;
                updated = true;
                console.log(`  ✓ Added teamId ${team.teamId} to ${team.teamName}`);
            }

            // Add password if missing (generate random password)
            if (!team.password) {
                const randomPassword = generatePassword();
                const salt = await bcrypt.genSalt(10);
                team.password = await bcrypt.hash(randomPassword, salt);
                updated = true;
                console.log(`  ✓ Added password to ${team.teamName} (password: ${randomPassword})`);
            }

            // Add balance if missing (rename virtualBalance)
            if (!team.balance && team.virtualBalance) {
                team.balance = team.virtualBalance;
                updated = true;
                console.log(`  ✓ Migrated virtualBalance to balance for ${team.teamName}`);
            } else if (!team.balance) {
                team.balance = 100000;
                updated = true;
                console.log(`  ✓ Added default balance to ${team.teamName}`);
            }

            if (updated) {
                await team.save();
                migratedCount++;
            }
        }

        console.log(`\n✅ Migration complete! Updated ${migratedCount} teams.`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

function generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

migrateTeams();
