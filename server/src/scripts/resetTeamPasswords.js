import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Team from '../models/Team.js';

dotenv.config();

// Generate random password (5 characters: uppercase + numbers for easy typing)
function generatePassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars: I, O, 0, 1
    let password = '';
    for (let i = 0; i < 5; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

async function resetAllTeamPasswords() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const teams = await Team.find({}).sort({ teamId: 1 });
        console.log(`\nFound ${teams.length} teams. Resetting passwords...\n`);

        console.log('='.repeat(80));
        console.log('NEW TEAM CREDENTIALS - SHARE WITH TEAMS');
        console.log('='.repeat(80));
        console.log('');

        const credentials = [];

        for (const team of teams) {
            const newPassword = generatePassword();

            // Update password (will be hashed by pre-save hook)
            team.password = newPassword;
            await team.save();

            const creds = {
                teamId: team.teamId,
                teamName: team.teamName,
                password: newPassword
            };
            credentials.push(creds);

            console.log(`Team: ${team.teamName.padEnd(30)} | ID: ${team.teamId.padEnd(10)} | Password: ${newPassword}`);
        }

        console.log('');
        console.log('='.repeat(80));
        console.log(`✓ Successfully reset passwords for ${teams.length} teams`);
        console.log('='.repeat(80));
        console.log('');
        console.log('SAVE THESE CREDENTIALS! They will be hashed in the database.');
        console.log('');

        // Optionally save to a file
        const fs = await import('fs');
        const outputPath = './team-credentials.txt';
        let output = '='.repeat(80) + '\n';
        output += 'TEAM CREDENTIALS - ' + new Date().toISOString() + '\n';
        output += '='.repeat(80) + '\n\n';
        credentials.forEach(c => {
            output += `Team: ${c.teamName.padEnd(30)} | ID: ${c.teamId.padEnd(10)} | Password: ${c.password}\n`;
        });
        fs.writeFileSync(outputPath, output);
        console.log(`Credentials also saved to: ${outputPath}`);
        console.log('');

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

resetAllTeamPasswords();
