# Market Matrix - Trading Simulation Platform

A production-ready, full-stack web application for the **Market Matrix** financial simulation event featuring real-time trading, a 40-card system with percentage-based effects, admin controls, and persistent data storage.

---

## 🎯 Features

### Core Functionality
- ✅ **Multi-round trading simulation** (6-8 rounds)
- ✅ **5 tradable assets** with volume-based price changes
- ✅ **40 virtual cards** (percentage-based effects)
- ✅ **Real-time updates** via WebSocket
- ✅ **Persistent storage** (MongoDB)
- ✅ **Admin authentication** (JWT)
- ✅ **Team-to-team trading** (admin-controlled)
- ✅ **Live price graphs** (Chart.js)

### Access Control
- **Admin Panel**: Secure login, full control over game state
- **Player View**: No login required, view-only graphs

---

## 🏗️ Architecture

```
Market_matrix/
├── server/               # Backend (Node.js + Express + Socket.IO)
│   ├── src/
│   │   ├── config/      # Database & constants
│   │   ├── models/      # Mongoose schemas
│   │   ├── services/    # Business logic
│   │   ├── routes/      # API endpoints
│   │   ├── middleware/  # Auth middleware
│   │   ├── sockets/     # WebSocket handlers
│   │   └── scripts/     # Database seeding
│   └── package.json
│
├── client/              # Frontend (Vite + Vanilla JS)
│   ├── src/
│   │   ├── views/       # Page views
│   │   ├── components/  # Reusable components
│   │   ├── utils/       # API & Socket clients
│   │   └── styles/      # CSS design system
│   └── package.json
│
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (running locally or remote)

### Installation

1. **Clone or navigate to the project**
   ```bash
   cd Market_matrix
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Configure environment**
   ```bash
   cd server
   cp .env.example .env
   # Edit .env with your MongoDB URI if needed
   ```

4. **Seed the database**
   ```bash
   cd server
   npm run seed
   ```
   
   This creates:
   - Default admin (username: `admin`, password: `admin123`)
   - 5 assets with base values
   - 40 cards (12 increase, 12 decrease, 8 inter-team, 8 neutral)
   - Initial game state

5. **Start the application**
   
   **Option A: Run both servers concurrently (from root)**
   ```bash
   npm run dev
   ```
   
   **Option B: Run separately**
   ```bash
   # Terminal 1 - Backend
   cd server
   npm run dev
   
   # Terminal 2 - Frontend
   cd client
   npm run dev
   ```

6. **Access the application**
   - **Landing Page**: http://localhost:5173
   - **Player View**: http://localhost:5173/player
   - **Admin Login**: http://localhost:5173/admin
   - **API**: http://localhost:3000/api

---

## 📋 Game Rules

### Round 1: Pen & Paper
- Teams: 1-4 members
- Only 1 member attempts Round 1
- Top 10 teams qualify for Round 2
- Solo/duo teams merge to 3-4 members

### Round 2: Trading Simulation

#### Assets & Base Values
| Asset | Base Value | Buy Threshold | Sell Threshold | Price Change |
|-------|------------|---------------|----------------|--------------|
| Crypto Token | ₹250 | 500 units | 400 units | ±10% |
| Stock | ₹300 | 400 units | 300 units | ±10% |
| Gold Coin | ₹500 | 250 units | 200 units | ±10% |
| Euro Bond | ₹750 | 150 units | 130 units | ±10% |
| Treasury Bill | ₹900 | 120 units | 110 units | ±10% |

#### Trading Rules
- Each team starts with **₹1,00,000**
- Teams trade **one at a time** in circular order
- Asset prices are **global** and shared
- Prices change based on **cumulative volume**
- **Team-to-team trading** allowed (admin-controlled)

#### Card System (40 Cards)
**Category 1: Asset Increase (12 cards)**
- Crypto: +10% to +20% (3 cards)
- Stock: +8% to +15% (3 cards)
- Gold: +6% to +10% (2 cards)
- Euro Bond: +5% to +8% (2 cards)
- Treasury Bill: +3% to +5% (2 cards)

**Category 2: Asset Decrease (12 cards)**
- Crypto: -10% to -20% (3 cards)
- Stock: -8% to -15% (3 cards)
- Gold: -6% to -10% (2 cards)
- Euro Bond: -5% to -8% (2 cards)
- Treasury Bill: -3% to -5% (2 cards)

**Category 3: Inter-Team Impact (8 cards)**
- Trade Freeze: Next team can trade only ONE asset (2 cards)
- Market Shock: Next team's highest asset -10% (2 cards)
- Insider Information: Skip card draw next round (2 cards)
- Reverse Impact: Next card effect is reversed (2 cards)

**Category 4: Neutral (8 cards)**
- Better Luck Next Time: No effect (8 cards)

**Card Rules:**
- Deck shuffles **before every even round**
- Each team draws **one card before trading**
- Effects apply **immediately**
- Effects last **only one round**

---

## 🎮 Usage Guide

### Admin Panel

1. **Login**
   - Navigate to `/admin`
   - Default credentials: `admin` / `admin123`

2. **Start Round 2**
   - Click "Start Round 2" button
   - Ensures 10 qualified teams exist

3. **Manage Rounds**
   - **Next Round**: Advance to next round (auto-shuffles on even rounds)
   - **Next Team**: Rotate to next team's turn
   - **Shuffle Deck**: Manually shuffle cards

4. **Draw Cards**
   - Select team from dropdown
   - Click "Draw Card"
   - View card effect and impacts

5. **Execute Trades**
   - **Market Trading**: Team buys/sells from market
   - **Team-to-Team**: Transfer assets between teams

6. **View Leaderboard**
   - Real-time portfolio values
   - Team assets and balances
   - Auto-updates on trades

### Player View

1. Navigate to `/player`
2. View live asset price graphs
3. See current asset values
4. No login required
5. Auto-refreshes on price changes

---

## 🔧 API Endpoints

### Public (No Auth)
- `GET /api/assets` - Get all assets with price history
- `GET /api/game-state` - Get current round and phase
- `GET /api/leaderboard/public` - Get sanitized rankings

### Admin (JWT Required)
- `POST /api/auth/login` - Admin login
- `POST /api/auth/verify` - Verify token
- `GET /api/admin/leaderboard` - Full leaderboard
- `GET /api/admin/teams` - Get all teams
- `POST /api/admin/teams` - Create team
- `PUT /api/admin/teams/:id` - Update team
- `POST /api/admin/round/start` - Start Round 2
- `POST /api/admin/round/next` - Next round
- `POST /api/admin/team/next` - Next team
- `POST /api/admin/card/shuffle` - Shuffle deck
- `POST /api/admin/card/draw/:teamId` - Draw card
- `POST /api/admin/trade` - Execute market trade
- `POST /api/admin/trade/team-to-team` - Team trade
- `PUT /api/admin/assets/:assetType` - Manual price adjustment

---

## 🔌 WebSocket Events

### Server → Client
- `asset:update` - Asset price changed
- `leaderboard:update` - Rankings updated
- `round:change` - New round started
- `card:drawn` - Card drawn (admin only)
- `trade:executed` - Trade completed
- `team:change` - Active team changed

### Client → Server
- `admin:authenticate` - Authenticate admin socket
- `subscribe:updates` - Subscribe to real-time updates

---

## 🎨 Design System

### Color Palette
- **Primary**: Indigo (#6366f1)
- **Secondary**: Purple (#8b5cf6)
- **Success**: Green (#10b981)
- **Danger**: Red (#ef4444)
- **Warning**: Orange (#f59e0b)

### Features
- Glassmorphism effects
- Gradient backgrounds
- Smooth animations
- Responsive design
- Dark theme optimized

---

## 🗄️ Database Schema

### Collections
- **admins**: Admin authentication
- **teams**: Team data, assets, balances
- **assets**: Current values, price history
- **cards**: Card definitions
- **gamestates**: Round, turn, deck state
- **transactions**: Audit trail

---

## 🔒 Security

- JWT authentication for admin routes
- Password hashing with bcrypt
- CORS configuration
- Input validation
- SQL injection prevention (NoSQL)

---

## 📦 Deployment

### Production Checklist
1. Change `JWT_SECRET` in `.env`
2. Update `ADMIN_PASSWORD`
3. Set `MONGODB_URI` to production database
4. Update `CORS_ORIGINS`
5. Build frontend: `cd client && npm run build`
6. Set `NODE_ENV=production`
7. Use process manager (PM2)

### Example PM2
```bash
pm2 start server/src/index.js --name market-matrix-api
pm2 startup
pm2 save
```

---

## 🐛 Troubleshooting

### MongoDB Connection Failed
- Ensure MongoDB is running: `mongod`
- Check `MONGODB_URI` in `.env`
- Verify network connectivity

### WebSocket Not Connecting
- Check CORS origins match
- Verify port 3000 is accessible
- Check browser console for errors

### Cards Not Shuffling
- Ensure game is in Round 2
- Check current round number
- Manually shuffle via admin panel

---

## 📝 License

MIT License - Free to use and modify

---

## 👥 Support

For issues or questions:
1. Check this README
2. Review API documentation
3. Check browser console logs
4. Review server logs

---

**Built with ❤️ for Market Matrix Event**
#   m a r k e t _ m a t r i x  
 