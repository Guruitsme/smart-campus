# 🚢 Smart Campus — Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Browser/Mobile     →    Web/Mobile App                  │
│  Next.js (Vercel)   →    Node.js API (Railway/Render)    │
│  Expo (EAS Build)   →    MongoDB (Atlas)                 │
│                          Cloudinary (Files)              │
└─────────────────────────────────────────────────────────┘
```

---

## 1. 🗄️ Database — MongoDB Atlas

1. Create a free account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a new **M0 Free** cluster
3. Create a database user with read/write permissions
4. Whitelist IP `0.0.0.0/0` (all IPs) for deployment
5. Copy the connection string:
   ```
   mongodb+srv://<user>:<password>@cluster.mongodb.net/smart_campus
   ```

---

## 2. 📁 File Storage — Cloudinary

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. From dashboard, copy:
   - Cloud Name
   - API Key
   - API Secret
3. Add these to backend `.env`

---

## 3. 🔧 Backend — Railway

1. Push backend to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select your backend repo/folder
4. Add environment variables from `.env.example`
5. Set **Start Command**: `npm start`
6. Railway auto-detects Node.js and deploys
7. Copy the generated URL (e.g., `https://smart-campus-api.railway.app`)

**Alternative: Render**
```bash
# Build Command
npm install

# Start Command
node src/server.js
```

---

## 4. 🌐 Frontend — Vercel

1. Push frontend to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. Set Framework: **Next.js**
4. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
   NEXT_PUBLIC_SOCKET_URL=https://your-backend.railway.app
   ```
5. Click Deploy

---

## 5. 📱 Mobile — Expo EAS Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
cd mobile
eas build:configure

# Set env
# Edit eas.json and set API_URL

# Build for Android
eas build --platform android --profile preview

# Build for iOS (requires Apple Developer account)
eas build --platform ios --profile preview

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

---

## 6. 🌱 Seed Production Database

```bash
# From backend folder, with production MONGODB_URI in .env
npm run seed
```

---

## 7. 🔒 Production Checklist

- [ ] Change all JWT secrets to long random strings
- [ ] Set `NODE_ENV=production` in backend
- [ ] Enable MongoDB Atlas Network Access rules
- [ ] Set up Cloudinary upload presets with restrictions
- [ ] Configure CORS to only allow your Vercel domain
- [ ] Enable rate limiting (already configured)
- [ ] Set up error monitoring (Sentry recommended)
- [ ] Configure automated backups in MongoDB Atlas

---

## Environment Variables Summary

### Backend
| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Long random secret for JWT signing |
| `JWT_REFRESH_SECRET` | Long random secret for refresh tokens |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `CLIENT_URL` | Your Vercel frontend URL |
| `PORT` | Server port (default: 5000) |

### Frontend
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL |
| `NEXT_PUBLIC_SOCKET_URL` | Backend Socket.IO URL |

---

## Quick Local Setup

```bash
# 1. Clone and install
git clone https://github.com/your/smart-campus
cd smart-campus

# 2. Backend
cd backend && cp .env.example .env
# Edit .env with your values
npm install && npm run seed && npm run dev

# 3. Frontend (new terminal)
cd frontend && cp .env.example .env.local
# Edit .env.local
npm install && npm run dev

# 4. Mobile (new terminal)
cd mobile && npm install && npx expo start
```

All three services will run simultaneously:
- API:      http://localhost:5000
- Web App:  http://localhost:3000
- Mobile:   Expo Go QR code in terminal
