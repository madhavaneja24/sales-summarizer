# 📊 Sales Summarizer

> Upload CSV/XLSX sales data → Get an AI-generated executive summary → Delivered to your inbox.

Built with **MERN Stack** (MongoDB-free variant: React + Express + Node.js) + **Google Gemini AI** + **Nodemailer**.

---

## 🏗 Architecture

```
sales-summarizer/
├── backend/              # Express.js API
│   ├── src/
│   │   ├── server.js         # Entry point
│   │   ├── config/swagger.js # OpenAPI spec
│   │   ├── middleware/
│   │   │   ├── fileUpload.js  # Multer config + validation
│   │   │   ├── rateLimiter.js # express-rate-limit
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── upload.js      # POST /api/summarize, POST /api/preview
│   │   │   └── health.js      # GET /api/health
│   │   └── services/
│   │       ├── fileParser.js  # CSV/XLSX → JSON + stats
│   │       ├── geminiService.js # Google Gemini AI
│   │       └── emailService.js  # Nodemailer
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/             # React + Vite SPA
│   ├── src/
│   │   ├── App.jsx       # Single-page app (upload, loading, success, error)
│   │   └── App.css       # Full dark editorial design
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .env.example
│
├── docker-compose.yml    # Full stack local deployment
├── .env.example          # Root env for docker-compose
└── .github/workflows/ci.yml # GitHub Actions CI/CD
```

---

## 🚀 Quick Start — docker-compose

### Step 1: Clone & configure

```bash
git clone https://github.com/YOUR_USERNAME/sales-summarizer.git
cd sales-summarizer

# Copy and fill in environment variables
cp .env.example .env
nano .env   # or open in your editor
```

### Step 2: Fill in `.env`

```env
GEMINI_API_KEY=AIzaSy_your_key_here
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=xxxx_xxxx_xxxx_xxxx
```

### Step 3: Launch

```bash
docker-compose up --build
```

| Service  | URL                              |
|----------|----------------------------------|
| Frontend | http://localhost:3000            |
| Backend  | http://localhost:5000            |
| API Docs | http://localhost:5000/api-docs   |
| Health   | http://localhost:5000/api/health |

### Stop

```bash
docker-compose down
```

---

## 🔑 API Keys — Where to Get Them

### 1. Google Gemini API Key

| Step | Action |
|------|--------|
| 1 | Go to https://makersuite.google.com/app/apikey |
| 2 | Sign in with a Google account |
| 3 | Click **"Create API Key"** |
| 4 | Select or create a Google Cloud project |
| 5 | Copy the key → paste as `GEMINI_API_KEY` |

**Free tier:** 60 requests/min, 1500 requests/day — more than enough for development.

### 2. Gmail App Password (for Nodemailer)

> ⚠️ You **cannot** use your regular Gmail password. You need an App Password.

| Step | Action |
|------|--------|
| 1 | Go to https://myaccount.google.com |
| 2 | Security → **2-Step Verification** (enable it) |
| 3 | Security → **App Passwords** (scroll down) |
| 4 | Select app: **Mail**, Device: **Other** → name it "SalesSummarizer" |
| 5 | Click **Generate** → copy the 16-char password |
| 6 | Paste as `EMAIL_PASS` in `.env` |

---

## 🔒 Security Implementation

| Layer | Mechanism | Details |
|-------|-----------|---------|
| **Rate Limiting** | express-rate-limit | Global: 100 req/15min; Upload: 10 req/hour per IP |
| **Security Headers** | Helmet.js | Sets X-Content-Type, X-Frame-Options, CSP, HSTS, etc. |
| **CORS** | Whitelist | Only accepts requests from `FRONTEND_URL` in production |
| **Input Validation** | express-validator | Email format validated server-side |
| **File Validation** | Extension + MIME check | Only `.csv`, `.xlsx`, `.xls`; max 10MB |
| **Memory-only storage** | multer memoryStorage | Files never written to disk |
| **Non-root Docker** | Node user UID 1001 | Backend container runs as non-root |
| **Error sanitization** | Custom error handler | Stack traces never leaked to client |

---

## 🛠 Running Locally (Without Docker)

### Backend

```bash
cd backend
cp .env.example .env   # fill in values
npm install
npm run dev            # starts on :5000
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev            # starts on :3000
```

---

## 📦 Docker Image Submission

### Build images individually

```bash
# Backend
docker build -t sales-summarizer-backend:latest ./backend

# Frontend  
docker build -t sales-summarizer-frontend:latest ./frontend \
  --build-arg VITE_API_URL=https://your-render-url.onrender.com
```

### Save images as tar files (for submission)

```bash
docker save sales-summarizer-backend:latest | gzip > backend-image.tar.gz
docker save sales-summarizer-frontend:latest | gzip > frontend-image.tar.gz
```

### Push to Docker Hub

```bash
docker tag sales-summarizer-backend:latest YOUR_DOCKERHUB/sales-summarizer-backend:latest
docker push YOUR_DOCKERHUB/sales-summarizer-backend:latest

docker tag sales-summarizer-frontend:latest YOUR_DOCKERHUB/sales-summarizer-frontend:latest
docker push YOUR_DOCKERHUB/sales-summarizer-frontend:latest
```

---

## ☁️ Cloud Deployment

### Backend → Render

1. Push repo to GitHub
2. Go to https://render.com → New → **Web Service**
3. Connect your GitHub repo, set **Root Directory** to `backend`
4. Build command: `npm install`
5. Start command: `node src/server.js`
6. Add **Environment Variables** (same as `.env`):
   - `GEMINI_API_KEY`
   - `EMAIL_USER`
   - `EMAIL_PASS`
   - `FRONTEND_URL` = your Vercel URL

### Frontend → Vercel

1. Go to https://vercel.com → New Project → Import from GitHub
2. Set **Root Directory** to `frontend`
3. Framework preset: **Vite**
4. Add **Environment Variable**:
   - `VITE_API_URL` = your Render backend URL
5. Deploy

---

## 📚 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health + service status |
| POST | `/api/summarize` | Upload file + email → AI summary |
| POST | `/api/preview` | Parse file, return stats preview |
| GET | `/api-docs` | Swagger UI documentation |
| GET | `/api-docs.json` | Raw OpenAPI JSON spec |

Full interactive docs at `/api-docs` (Swagger UI).

---

## 🔄 CI/CD Pipeline

GitHub Actions triggers on every **Pull Request to main** and **push to main**:

1. **Backend job**: `npm ci` → `eslint` → smoke test (server starts + `/api/health` responds)
2. **Frontend job**: `npm ci` → `vite build` → verify `dist/` output
3. **Docker job**: builds both images (no push unless you add registry credentials)

---

## 📝 .env.example

```env
# Root (docker-compose)
GEMINI_API_KEY=AIzaSy_your_gemini_api_key_here
EMAIL_SERVICE=gmail
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=xxxx_xxxx_xxxx_xxxx

# Backend only
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
API_BASE_URL=http://localhost:5000

# Frontend only
VITE_API_URL=http://localhost:5000
```
