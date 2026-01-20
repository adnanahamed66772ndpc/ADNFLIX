# ADNFLIX Setup and Run Guide

## Prerequisites
- Node.js installed (v18 or higher)
- MySQL installed and running
- npm or yarn package manager

## Step 1: Database Setup

### 1.1 Create MySQL Database
Open MySQL command line or phpMyAdmin and run:
```sql
CREATE DATABASE adnflix;
```

### 1.2 Import Database Schema
Run the migration SQL file:

**Option A: Command Line**
```bash
mysql -u root -p adnflix < backend/migrations/001_initial_schema.sql
```

okey 

**Option B: phpMyAdmin**
1. Open phpMyAdmin
2. Select `adnflix` database
3. Go to "Import" tab
4. Choose file: `backend/migrations/001_initial_schema.sql`
5. Click "Go"

**Option C: MySQL Workbench**
1. Open MySQL Workbench
2. Connect to your MySQL server
3. Open `backend/migrations/001_initial_schema.sql`
4. Execute the script

## Step 2: Configure Backend

### 2.1 Create Backend .env File
Navigate to `backend/` folder and create `.env` file:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=adnflix
JWT_SECRET=your_jwt_secret_change_this_in_production
JWT_EXPIRES_IN=7d
SESSION_SECRET=your_session_secret_change_this_in_production
CORS_ORIGIN=http://localhost:8080
VIDEO_STORAGE_PATH=./storage/videos
MAX_VIDEO_SIZE=5368709120
```

**Important:** Replace `your_mysql_password` with your actual MySQL password.

### 2.2 Install Backend Dependencies
```bash
cd backend
npm install
```

## Step 3: Configure Frontend

### 3.1 Create Frontend .env File
Navigate to `frontend/` folder and create `.env` file:

```env
VITE_API_URL=http://localhost:3000/api
```

### 3.2 Install Frontend Dependencies
```bash
cd frontend
npm install
```

## Step 4: Run the Application

### 4.1 Start Backend Server
Open a terminal/command prompt:

```bash
cd backend
npm start
```

You should see:
```
Server is running on port 3000
Environment: development
Connected to MySQL database
```

### 4.2 Start Frontend Server
Open a **NEW** terminal/command prompt:

```bash
cd frontend
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: use --host to expose
```

## Step 5: Access the Application

Open your browser and go to:
- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:3000/api

## Quick Start Commands (All in One)

If you want to run both servers quickly:

**Windows PowerShell:**
```powershell
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend (open new terminal)
cd frontend
npm run dev
```

**Linux/Mac:**
```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend (open new terminal)
cd frontend && npm run dev
```

## Troubleshooting

### Backend won't start
- Check if MySQL is running
- Verify database credentials in `backend/.env`
- Make sure database `adnflix` exists
- Check if port 3000 is available

### Frontend won't start
- Check if port 8080 is available
- Verify `frontend/.env` has correct API URL
- Make sure backend is running first

### Database connection errors
- Verify MySQL is running: `mysql -u root -p`
- Check database exists: `SHOW DATABASES;`
- Verify credentials in `backend/.env`
- Make sure you ran the migration SQL file

### Video upload not working
- Check `VIDEO_STORAGE_PATH` in `backend/.env`
- Ensure the storage directory exists: `backend/storage/videos`
- For cPanel, use absolute path: `/home/username/public_html/storage/videos`

## Development Mode

For auto-reload during development:

**Backend:**
```bash
cd backend
npm run dev  # if you have nodemon installed
# or
node --watch src/server.js
```

**Frontend:**
```bash
cd frontend
npm run dev  # Vite auto-reloads by default
```

## Production Build

**Frontend:**
```bash
cd frontend
npm run build
```

**Backend:**
```bash
cd backend
npm start
```

Make sure to set `NODE_ENV=production` in backend `.env` for production.
