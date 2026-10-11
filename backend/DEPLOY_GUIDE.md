# Deploy Guide — Turso + Render + GitHub Pages

## ধাপ ১: Turso DB সেটআপ
1. https://app.turso.tech → Login → Create Database
2. Database name: `ntmc-transit`, Region: `Singapore (sin)`
3. Dashboard → Database → **Connect** বাটন
4. `libsql://...` URL এবং Token কপি করুন

## ধাপ ২: পুরনো data import (optional)
Turso CLI দিয়ে পুরনো transit.db import করতে পারবেন:
```bash
# Turso CLI install
curl -sSfL https://get.tur.so/install.sh | bash
turso auth login
turso db shell ntmc-transit < export.sql
```
অথবা প্রথমে নতুন deploy করুন, তারপর backup/restore দিয়ে data import করুন।

## ধাপ ৩: GitHub repo তৈরি
1. https://github.com → New repository → `ntmc-transit-system`
2. Private রাখুন
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/ntmc-transit-system.git
git push -u origin main
```

## ধাপ ৪: Render backend deploy
1. https://render.com → New → Web Service
2. Connect GitHub repo
3. Settings:
   - **Name:** ntmc-transit-backend
   - **Root Directory:** backend
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
4. Environment Variables যোগ করুন:
   ```
   TURSO_URL     = libsql://your-db.turso.io
   TURSO_TOKEN   = your-token
   JWT_SECRET    = your-random-secret-here
   NODE_VERSION  = 20
   ```
5. Deploy → URL কপি করুন (যেমন: https://ntmc-transit-backend.onrender.com)

## ধাপ ৫: UptimeRobot (ঘুম prevent)
1. https://uptimerobot.com → Add Monitor
2. Type: HTTP(s)
3. URL: `https://ntmc-transit-backend.onrender.com/ping`
4. Interval: 14 minutes
✅ এখন server কখনো ঘুমাবে না

## ধাপ ৬: Frontend build ও GitHub Pages
1. `frontend/package.json` এ proxy বদলান:
   ```json
   "proxy": "https://ntmc-transit-backend.onrender.com"
   ```
2. Build করুন:
   ```bash
   cd frontend
   npm run build
   ```
3. GitHub Pages deploy:
   ```bash
   npm install -g gh-pages
   gh-pages -d build
   ```
4. GitHub repo → Settings → Pages → Source: `gh-pages` branch
5. URL পাবেন: `https://YOUR_USERNAME.github.io/ntmc-transit-system`

## ধাপ ৭: Custom domain (optional)
GitHub Pages → Custom domain → আপনার domain যোগ করুন

## পরবর্তীতে update করতে
```bash
# Backend
git add . && git commit -m "update" && git push
# Render auto-deploy হবে

# Frontend
cd frontend && npm run build && gh-pages -d build
```

## পুরনো data migrate করতে
1. cPanel থেকে backup নিন (Admin Panel → Backup)
2. নতুন site-এ login করুন
3. Admin Panel → Backup → Restore → JSON file upload
