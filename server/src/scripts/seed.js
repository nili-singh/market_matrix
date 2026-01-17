import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import Admin from '../models/Admin.js';
import assetService from '../services/assetService.js';
import cardService from '../services/cardService.js';
import roundService from '../services/roundService.js';

dotenv.config();

/**
 * Seed script to initialize database with default data
 */
const seed = async () => {
    try {
        console.log('🌱 Starting database seed...\n');

        // Connect to database
        await connectDB();

        // 1. Create default admin
        const existingAdmin = await Admin.findOne({ username: process.env.ADMIN_USERNAME || 'admin' });

        if (!existingAdmin) {
            const admin = new Admin({
                username: process.env.ADMIN_USERNAME || 'admin',
                password: process.env.ADMIN_PASSWORD || 'admin123',
            });
            await admin.save();
            console.log('✅ Default admin created');
            console.log(`   Username: ${admin.username}`);
            console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'admin123'}\n`);
        } else {
            console.log('ℹ️  Admin already exists\n');
        }

        // 2. Initialize assets
        await assetService.initializeAssets();
        console.log('✅ Assets initialized with base values\n');

        // 3. Initialize cards
        const cards = await cardService.initializeCards();
        console.log(`✅ ${cards.length} cards initialized\n`);

        // 4. Initialize game state
        await roundService.initializeGame();
        console.log('✅ Game state initialized\n');

        console.log('🎉 Database seeding completed successfully!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error);
        process.exit(1);
    }
};

seed();
