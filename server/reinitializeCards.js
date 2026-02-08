import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cardService from './src/services/cardService.js';
import connectDB from './src/config/database.js';

dotenv.config();

async function reinitializeCards() {
    try {
        console.log('Connecting to database...');
        await connectDB();

        console.log('Deleting old cards and creating new ones with updated values...');
        const result = await cardService.initializeCards();

        console.log(`✅ Successfully reinitialized ${result.length} cards with new effects!`);
        console.log('You can now shuffle the deck in the admin panel.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error reinitializing cards:', error);
        process.exit(1);
    }
}

reinitializeCards();
