# NTMC Transit — Turso Setup (Bangla)

এই package-এ পুরোনো frontend এবং নতুন Turso backend একসঙ্গে আছে। পুরোনো SQLite data `migration/transit.db`-এ আছে; এটি GitHub-এ upload করবেন না।

## 1. GitHub repository-তে project upload
1. GitHub-এ নতুন **Private** repository তৈরি করুন।
2. এই ZIP extract করুন।
3. Git for Windows ইনস্টল থাকলে project root-এ Git Bash খুলুন।
4. `git init`
5. `git add .`
6. `git status` চালিয়ে নিশ্চিত করুন `migration/transit.db` এবং `backend/.env` staging-এ নেই।
7. `git commit -m "Prepare NTMC Transit Turso deployment"`
8. `git branch -M main`
9. `git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git`
10. `git push -u origin main`

`git status`-এ `migration/transit.db` বা `backend/.env` দেখা গেলে commit/push করবেন না। `.gitignore` ওই ফাইলগুলো বাদ দেওয়ার কথা।

## 2. Turso
1. https://app.turso.tech খুলুন।
2. `ntmc-transit` নামে database তৈরি করুন; Singapore region থাকলে সেটি নির্বাচন করুন।
3. Database URL এবং auth token তৈরি/কপি করুন।
4. Token কাউকে পাঠাবেন না, GitHub-এ রাখবেন না।

## 3. Render backend deploy
1. https://render.com → New → Web Service → আপনার GitHub repository connect করুন।
2. Root Directory: `backend`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Environment Variables যোগ করুন:
   - `TURSO_URL` = Turso URL
   - `TURSO_TOKEN` = Turso token
   - `JWT_SECRET` = random secret (PowerShell: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)
6. Deploy করুন।
7. `https://YOUR-RENDER-URL.onrender.com/ping` এবং `/api/health` খুলে status `ok` যাচাই করুন।

## 4. পুরোনো SQLite data Turso-তে migrate
এটি প্রথমে করুন **শুধু তখনই**, যখন Render deploy সফল এবং Turso-তে `records`, `letters`, `addresses` এখনো empty। Script existing records পেলে থেমে যাবে।

Windows CMD-তে project root-এ:
```
cd backend
npm install
set "TURSO_URL=আপনার_প্রকৃত_Turso_URL"
set "TURSO_TOKEN=আপনার_প্রকৃত_Turso_TOKEN"
npm run migrate:sqlite
```
Placeholders-এর বদলে প্রকৃত মান বসান। এই মানগুলো এখানে বা GitHub-এ প্রকাশ করবেন না। Migration script `migration/transit.db` পড়ে users, distribution areas, records, letters, addresses এবং suggestions import করবে। সফল হলে Turso dashboard-এ table counts যাচাই করুন।

যদি script বলে database-এ আগে থেকেই data আছে, জোর করে পুনরায় চালাবেন না। আগে database backup নিয়ে অবস্থা যাচাই করুন।

## 5. Frontend deploy to GitHub Pages
1. GitHub repository → Settings → Pages।
2. Source হিসেবে `Deploy from a branch` নির্বাচন করলে `gh-pages` branch deploy করুন; অথবা নিচের command ব্যবহার করুন।
3. CMD-তে:
```
cd frontend
npm install
set "REACT_APP_API_URL=https://YOUR-RENDER-URL.onrender.com"
npm run deploy
```
`YOUR-RENDER-URL`-এর জায়গায় প্রকৃত Render URL দিন। `npm run deploy` build করে `gh-pages` branch publish করবে। এরপর repository Settings → Pages-এ `gh-pages` branch / root নির্বাচন করুন (যদি auto-configured না হয়)।
4. Published URL খুলুন। Routing `/#/login` ধরনের হবে; GitHub Pages-এর জন্য এটি স্বাভাবিক।

## 6. প্রথম login ও verification
নতুন backend প্রথমবার `admin` / `admin123` তৈরি করে, কিন্তু migration পুরোনো database-এর `admin` account/password hash import করে সেটি প্রতিস্থাপন করবে। তাই migration-এর পর পুরোনো admin username/password ব্যবহার করুন। লগইন হলে অবিলম্বে password পরিবর্তন করুন, যদি UI-তে সুবিধা থাকে; না থাকলে admin user-management-এর password feature পরীক্ষা করুন।

পরীক্ষা করুন: login, records search, create/edit, suggestions, PDF transit, PDF envelope, backup download। Restore destructive: এটি records/letters/addresses/suggestions মুছে backup বসায়। Restore-এর আগে backup নিন।

## Important notes
- `migration/transit.db` ও `backend/.env` private; কখনো GitHub-এ push করবেন না।
- Turso migration script-এ database empty না থাকলে stop করে।
- GitHub Pages frontend public; কোনো secret সেখানে রাখবেন না।
- Render free service sleep করতে পারে; ping monitor uptime guarantee করে না.
- PDF generation Puppeteer-এর উপর নির্ভরশীল; deploy-এর পর বাস্তবে PDF test করুন.
