# MongoDB Local Installation Guide for Windows

## Step-by-Step Installation

### 1. Download MongoDB Community Server

**Download Link**: https://www.mongodb.com/try/download/community

- **Version**: Choose latest stable version (7.0 or higher)
- **Platform**: Windows
- **Package**: MSI installer

### 2. Run the Installer

1. Double-click the downloaded `.msi` file
2. Click "Next" on the welcome screen
3. Accept the license agreement
4. **Choose Setup Type**: Select **"Complete"**
5. **Service Configuration**:
   - ✅ Check "Install MongoDB as a Service"
   - ✅ Check "Run service as Network Service user"
   - Data Directory: `C:\Program Files\MongoDB\Server\7.0\data\`
   - Log Directory: `C:\Program Files\MongoDB\Server\7.0\log\`
6. **MongoDB Compass**: You can uncheck this (optional GUI tool)
7. Click "Install"
8. Wait for installation to complete
9. Click "Finish"

### 3. Verify Installation

Open PowerShell and run:

```powershell
mongod --version
```

If you see version information, MongoDB is installed correctly!

### 4. Start MongoDB Service (if not running)

MongoDB should start automatically as a Windows Service. To verify:

```powershell
# Check if MongoDB service is running
Get-Service -Name MongoDB

# If not running, start it:
Start-Service -Name MongoDB
```

### 5. Test Connection

```powershell
# Connect to MongoDB shell
mongosh
```

You should see a connection message. Type `exit` to quit.

---

## After Installation - Run the Application

Once MongoDB is installed and running:

```bash
# 1. Seed the database
cd C:\Users\Asus\Desktop\Market_matrix\server
npm run seed

# 2. Start the backend server
npm run dev

# 3. In a NEW terminal, start the frontend
cd C:\Users\Asus\Desktop\Market_matrix\client
npm run dev
```

Then visit: **http://localhost:5173**

---

## Troubleshooting

### If `mongod` command not found:

Add MongoDB to your PATH:
1. Search "Environment Variables" in Windows
2. Click "Environment Variables"
3. Under "System variables", find "Path"
4. Click "Edit"
5. Click "New"
6. Add: `C:\Program Files\MongoDB\Server\7.0\bin`
7. Click "OK" on all dialogs
8. **Restart PowerShell**

### If MongoDB service won't start:

```powershell
# Create data directory manually
mkdir C:\data\db

# Start MongoDB manually
mongod --dbpath C:\data\db
```

---

## Quick Reference

**Check MongoDB Status:**
```powershell
Get-Service -Name MongoDB
```

**Start MongoDB:**
```powershell
Start-Service -Name MongoDB
```

**Stop MongoDB:**
```powershell
Stop-Service -Name MongoDB
```

**Connect to MongoDB Shell:**
```powershell
mongosh
```

---

Let me know once MongoDB is installed, and I'll help you seed the database and start the application!
