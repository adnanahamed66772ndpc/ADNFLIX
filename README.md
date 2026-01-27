# ADNFLIX - Video Streaming Platform

A full-stack video streaming platform with React frontend and Node.js backend.

## Live URLs

| Service | URL |
|---------|-----|
| Frontend | https://coliningram.site |
| Backend API | https://api.coliningram.site |
| API Health | https://api.coliningram.site/health |

---

## Tech Stack

### Frontend
- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **Radix UI** - Component Library
- **Framer Motion** - Animations
- **React Router** - Navigation
- **HLS.js** - Video Streaming
- **Zustand** - State Management

### Backend
- **Node.js** - Runtime (CommonJS)
- **Express.js** - Web Framework
- **MySQL** - Database (cPanel MySQL)
- **JWT** - Authentication
- **Multer** - File Uploads
- **Helmet** - Security Headers
- **Express Rate Limit** - API Protection

---

## Project Structure

```
STEMFLIX/
├── frontend/                 # React Frontend
│   ├── src/
│   │   ├── api/             # API Client
│   │   ├── components/      # Reusable Components
│   │   ├── hooks/           # Custom Hooks
│   │   ├── pages/           # Page Components
│   │   └── lib/             # Utilities
│   ├── public/              # Static Assets
│   └── dist/                # Build Output
│
├── backend/                  # Node.js Backend
│   ├── migrations/           # SQL schema (001, 002, 003, 004)
│   ├── src/
│   │   ├── config/          # Database & Storage Config
│   │   ├── controllers/     # Route Controllers
│   │   ├── middleware/      # Auth, Upload, etc.
│   │   ├── migrations/      # runMigrations.js runner
│   │   ├── routes/          # API Routes
│   │   └── server.js        # Entry Point
│   └── storage/             # Video Storage
│
├── android/                  # Android App (Kotlin)
├── render.yaml              # Render Deployment Config
└── package.json             # Root Scripts
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |

### Titles (Movies/Series)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/titles` | Get all titles |
| GET | `/api/titles/:id` | Get title by ID |
| GET | `/api/titles/featured` | Get featured titles |
| GET | `/api/titles/trending` | Get trending titles |
| GET | `/api/titles/search?q=` | Search titles |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get all categories |
| GET | `/api/categories/:id/titles` | Get titles by category |

### Watchlist
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/watchlist` | Get user's watchlist |
| POST | `/api/watchlist` | Add to watchlist |
| DELETE | `/api/watchlist/:titleId` | Remove from watchlist |

### Playback
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/playback/:titleId` | Get playback info |
| POST | `/api/playback/progress` | Update watch progress |
| GET | `/api/playback/continue` | Get continue watching |

### Videos (Streaming)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/videos/:filename` | Stream video file |

### Config
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/config/plans` | Get subscription plans |
| GET | `/api/config/payment-methods` | Get payment methods |

---

## Environment Variables

### Backend (.env) - cPanel MySQL

```env
# Server
NODE_ENV=production
PORT=3000

# Database (cPanel MySQL)
# Create in cPanel -> MySQL Databases
DB_HOST=localhost
DB_PORT=3306
DB_USER=colining_adnflix
DB_PASSWORD=your_database_password
DB_NAME=colining_adnflix

# Security (Generate secure random strings!)
# Run: node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
JWT_SECRET=your_64_char_jwt_secret
JWT_EXPIRES_IN=7d
SESSION_SECRET=your_64_char_session_secret

# CORS
CORS_ORIGINS=https://coliningram.site,https://www.coliningram.site

# Storage
VIDEO_STORAGE_PATH=./storage/videos
MAX_VIDEO_SIZE=5368709120
```

### Frontend (.env.production)

```env
VITE_API_URL=https://api.coliningram.site/api
```

---

## Local Development

### Prerequisites
- Node.js 18+ (or Node 20 on cPanel)
- MySQL (cPanel MySQL or local)

### Setup

```bash
# Clone repository
git clone https://github.com/adnanahamed66772ndpc/ADNFLIX.git
cd ADNFLIX

# Install all dependencies
npm run install:all

# Setup backend .env
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# Run database migrations
cd backend && npm run migrate

# Start development servers
cd .. && npm run dev
```

### Development URLs
- Frontend: http://localhost:8080
- Backend: http://localhost:3000
- API: http://localhost:3000/api

---

## Deployment

### Option 1: Render (Recommended)

#### Backend (Web Service)
1. Create new **Web Service**
2. Connect to GitHub repo
3. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add environment variables (see above)

#### Frontend (Static Site)
1. Create new **Static Site**
2. Connect to same repo
3. Settings:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add rewrite rule: `/* → /index.html`
5. Add env: `VITE_API_URL=https://api.coliningram.site/api`

### Option 2: cPanel (Current Deployment)

#### Step 1: Create MySQL Database
1. Login to cPanel
2. Go to **MySQL Databases**
3. Create database: `colining_adnflix`
4. Create user: `colining_adnflix` with strong password
5. Add user to database with **ALL PRIVILEGES**

#### Step 2: Backend Setup
```bash
# SSH into your cPanel
ssh colining@your-server

# Clone repo to api subdomain folder
cd ~/api.coliningram.site
git clone https://github.com/adnanahamed66772ndpc/ADNFLIX.git .
# OR if folder exists:
git pull origin main

# Create .env file
nano .env
# Paste production config (see Environment Variables above)

# Generate secure secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(48).toString('base64'))"
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(48).toString('base64'))"
```

#### Step 3: Setup Node.js App in cPanel
1. Go to cPanel → **Setup Node.js App**
2. Click **Create Application**
3. Settings:
   - **Node.js version**: 20.x
   - **Application mode**: Production
   - **Application root**: `api.coliningram.site`
   - **Application URL**: `api.coliningram.site`
   - **Startup file**: `src/server.js`
4. Click **Create**
5. Click **Run NPM Install**
6. Click **Restart**

#### Step 4: Run Database Migrations
```bash
cd ~/api.coliningram.site
source /home/colining/nodevenv/api.coliningram.site/20/bin/activate
npm run migrate
```

#### Step 5: Frontend Setup
1. Build locally: `cd frontend && npm run build`
2. Upload `dist/` contents to `~/coliningram.site/`
3. Create `.htaccess` in frontend root:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## Database (cPanel MySQL)

### Create Database in cPanel
1. Go to **cPanel → MySQL Databases**
2. Create database: `colining_adnflix`
3. Create user with strong password
4. Add user to database with ALL PRIVILEGES

### Run Migrations
```bash
cd ~/api.coliningram.site
# Activate Node.js environment
source /home/colining/nodevenv/api.coliningram.site/20/bin/activate
npm run migrate
```

---

## Features

### User Features
- User registration & login
- Browse movies & TV series
- Search titles
- Watchlist management
- Continue watching
- Video playback with custom player
- Multi-language audio support
- Subscription plans

### Admin Features
- Dashboard with analytics
- Manage titles (CRUD)
- Manage categories
- Manage users
- Upload videos
- Configure ads
- Support tickets

### Video Player
- HLS streaming support
- Custom controls
- Skip intro/outro
- Quality selection
- Audio track selection
- Fullscreen mode
- Progress tracking
- Ad integration (pre-roll, mid-roll)

---

## Security

- JWT authentication
- Password hashing (bcrypt)
- Rate limiting
- CORS protection
- Helmet security headers
- SQL injection prevention
- XSS protection

---

## Scripts

### Root
```bash
npm run dev          # Run frontend & backend
npm run build        # Build frontend
npm start            # Start backend (production)
npm run install:all  # Install all dependencies
```

### Backend
```bash
npm start           # Production server
npm run dev         # Development with hot reload
npm run migrate     # Run database migrations
```

### Frontend
```bash
npm run dev         # Development server
npm run build       # Production build
npm run preview     # Preview production build
```

---

## Troubleshooting

### CORS Errors
- Check `CORS_ORIGINS` in backend `.env`
- Ensure frontend URL is whitelisted

### Database Connection Failed
- Verify cPanel MySQL credentials
- Check username format: `cpaneluser_dbuser`
- Check database format: `cpaneluser_dbname`
- Ensure user has privileges on database

### 404 on Page Refresh (Frontend)
- Add `.htaccess` rewrite rules
- Or configure server for SPA routing

### Video Not Playing
- Check video URL is accessible
- Verify video format (MP4, HLS)
- Check browser console for errors

### Port Already in Use
```bash
# Windows
Get-NetTCPConnection -LocalPort 3000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# Linux/Mac
kill $(lsof -t -i:3000)
```

---

## License

ISC License

---

## Author

ADNFLIX Team

## Repository

https://github.com/adnanahamed66772ndpc/ADNFLIX
