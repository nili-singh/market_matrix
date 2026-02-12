import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const teamSchema = new mongoose.Schema({
    teamId: {
        type: String,
        unique: true,
        // Auto-generated: TEAM_001, TEAM_002, etc.
    },
    teamName: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        // Hashed with bcrypt
    },
    members: [{
        name: {
            type: String,
            required: true,
        },
        email: String,
    }],
    registrationType: {
        type: String,
        enum: ['SOLO', 'DUO', 'SQUAD'],
        required: true,
    },
    registrationFee: {
        type: Number,
        required: true,
    },
    round1Qualified: {
        type: Boolean,
        default: false,
    },
    round1Participant: {
        type: String, // Name of the member who attempted Round 1
    },
    // Round 2 Trading Data
    balance: {
        type: Number,
        default: 100000, // ₹1,00,000 (renamed from virtualBalance)
    },
    assets: {
        CRYPTO: {
            type: Number,
            default: 0,
        },
        STOCK: {
            type: Number,
            default: 0,
        },
        GOLD: {
            type: Number,
            default: 0,
        },
        EURO_BOND: {
            type: Number,
            default: 0,
        },
        TREASURY_BILL: {
            type: Number,
            default: 0,
        },
    },
    // Active Card Effects
    activeCardEffects: [{
        cardType: String,
        effect: String,
        expiresAtRound: Number,
    }],
    // Special Flags
    hasInsiderInfo: {
        type: Boolean,
        default: false, // Skip card draw next round
    },
    tradeFrozen: {
        type: Boolean,
        default: false, // Can only trade one asset
    },
    reverseImpact: {
        type: Boolean,
        default: false, // Next card effect is reversed
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Generate random password (8 characters: letters + numbers)
function generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

// Generate unique team ID
async function generateTeamId() {
    const count = await mongoose.model('Team').countDocuments();
    const nextNumber = count + 1;
    return `TEAM_${String(nextNumber).padStart(3, '0')}`;
}

// Pre-save hook: Auto-generate teamId and hash password
teamSchema.pre('save', async function (next) {
    try {
        // Generate teamId if not present
        if (!this.teamId) {
            // Find the highest existing team number
            const teams = await this.constructor.find({}, { teamId: 1 }).sort({ teamId: -1 }).limit(1);

            let nextNumber = 1;
            if (teams.length > 0 && teams[0].teamId) {
                // Extract number from TEAM_XXX format
                const match = teams[0].teamId.match(/TEAM_(\d+)/);
                if (match) {
                    nextNumber = parseInt(match[1], 10) + 1;
                }
            }

            // Generate teamId with retry mechanism (max 10 attempts)
            let attempts = 0;
            const maxAttempts = 10;

            while (attempts < maxAttempts) {
                const proposedId = `TEAM_${String(nextNumber).padStart(3, '0')}`;

                // Check if this ID already exists
                const exists = await this.constructor.findOne({ teamId: proposedId });

                if (!exists) {
                    this.teamId = proposedId;
                    break;
                }

                // If exists, try next number
                nextNumber++;
                attempts++;
            }

            if (attempts >= maxAttempts) {
                throw new Error('Failed to generate unique team ID after maximum attempts');
            }
        }

        // Hash password if it's new or modified (and not already hashed)
        if (this.isModified('password') && this.password && !this.password.startsWith('$2')) {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        }

        next();
    } catch (error) {
        console.error('Pre-save hook error:', error);
        next(error);
    }
});

// Method to compare password for login
teamSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual field for portfolio value (calculated with current asset prices)
teamSchema.virtual('portfolioValue').get(function () {
    // This will be calculated dynamically with current asset prices
    return 0; // Placeholder
});

// Keep virtualBalance for backwards compatibility (alias to balance)
teamSchema.virtual('virtualBalance').get(function () {
    return this.balance || 100000;
});

teamSchema.virtual('virtualBalance').set(function (value) {
    this.balance = value;
});

// Enable virtuals in toJSON
teamSchema.set('toJSON', { virtuals: true });
teamSchema.set('toObject', { virtuals: true });

const Team = mongoose.model('Team', teamSchema);

export default Team;
