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
- **Node.js** - Runtime
- **Express.js** - Web Framework
- **MySQL** - Database (Aiven Cloud)
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
│   ├── src/
│   │   ├── config/          # Database & Storage Config
│   │   ├── controllers/     # Route Controllers
│   │   ├── middleware/      # Auth, Upload, etc.
│   │   ├── routes/          # API Routes
│   │   ├── migrations/      # Database Migrations
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

### Backend (.env)

```env
# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database (Aiven MySQL)
DB_HOST=mysql-xxxxx.aivencloud.com
DB_PORT=24641
DB_USER=avnadmin
DB_PASSWORD=your_password
DB_NAME=adnflix
DB_SSL=true

# Security
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=7d
SESSION_SECRET=your_session_secret

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
- Node.js 18+
- MySQL (or Aiven account)

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

### Option 2: cPanel

#### Backend Setup
1. Create folder: `/home/username/ADNFLIX/backend/`
2. Upload backend files (or clone repo)
3. Create `.env` file with Aiven credentials
4. Setup Node.js App in cPanel:
   - Root: `ADNFLIX/backend`
   - Startup: `src/server.js`
   - Run NPM Install
5. Create subdomain: `api.coliningram.site`

#### Frontend Setup
1. Build locally: `cd frontend && npm run build`
2. Upload `dist/` contents to domain root
3. Create `.htaccess`:
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

## Database (Aiven MySQL)

### Connection Details
- **Host**: mysql-bab0d9d-zohomail-e882.h.aivencloud.com
- **Port**: 24641
- **Database**: adnflix
- **SSL**: Required

### Run Migrations
```bash
cd backend
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
- Verify Aiven credentials
- Ensure `DB_SSL=true` is set
- Check firewall/IP whitelist on Aiven

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
