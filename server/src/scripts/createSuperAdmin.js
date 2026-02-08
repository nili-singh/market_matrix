import mongoose from 'mongoose';
import SuperAdmin from '../models/SuperAdmin.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script to create the super admin account
 * Run this once to initialize the super admin: node server/src/scripts/createSuperAdmin.js
 */
const createSuperAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/market_matrix');
        console.log('✅ Connected to MongoDB');

        const username = 'superadmin';
        const password = 'superadmin';

        // Check if super admin already exists
        const existing = await SuperAdmin.findOne({ username });

        if (existing) {
            console.log('⚠️  Super admin already exists. Skipping creation.');
            await mongoose.connection.close();
            process.exit(0);
        }

        // Create new super admin
        const superAdmin = new SuperAdmin({
            username,
            password, // Will be automatically hashed by the model
        });

        await superAdmin.save();

        console.log('✅ Super admin created successfully!');
        console.log(`   Username: ${username}`);
        console.log(`   Password: ${password}`);
        console.log('\n🔐 Please change the password after first login for security!');

        await mongoose.connection.close();
        console.log('✅ Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating super admin:', error);
        process.exit(1);
    }
};

createSuperAdmin();
