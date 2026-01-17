# MongoDB Atlas Setup Guide

Since MongoDB is not installed locally, you have **two options**:

---

## Option 1: Use MongoDB Atlas (Recommended - No Installation)

### Step 1: Create Free MongoDB Atlas Account

1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up for a **free account**
3. Create a **free cluster** (M0 tier)
4. Click "Connect" → "Connect your application"
5. Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

### Step 2: Update .env File

Replace the `MONGODB_URI` in `server/.env`:

```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/market_matrix?retryWrites=true&w=majority
```

**Important:** Replace `YOUR_USERNAME`, `YOUR_PASSWORD`, and `YOUR_CLUSTER` with your actual values.

### Step 3: Whitelist Your IP

1. In MongoDB Atlas dashboard
2. Go to "Network Access"
3. Click "Add IP Address"
4. Click "Allow Access from Anywhere" (for development)
5. Click "Confirm"

### Step 4: Run the Application

```bash
# Seed database
cd server
npm run seed

# Start backend
npm run dev

# In new terminal - Start frontend
cd client
npm run dev
```

---

## Option 2: Install MongoDB Locally

### For Windows:

1. Download MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Run the installer (choose "Complete" installation)
3. Install as a Windows Service
4. MongoDB will start automatically

### After Installation:

```bash
# Create data directory
mkdir C:\data\db

# Start MongoDB (if not running as service)
mongod

# Then run the application
cd server
npm run seed
npm run dev
```

---

## Quick Test (Without Database)

If you want to test the frontend immediately without database:

```bash
# Just start the frontend
cd client
npm run dev
```

Then visit: http://localhost:5173

The frontend will load, but API calls will fail until the backend is connected to a database.

---

## Recommended: MongoDB Atlas

**Pros:**
- ✅ No installation required
- ✅ Free tier available
- ✅ Cloud-hosted (accessible anywhere)
- ✅ Automatic backups
- ✅ Production-ready

**Setup time:** ~5 minutes

Let me know which option you prefer, and I can help you configure it!
