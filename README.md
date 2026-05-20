# CaliTourSys Business Accreditation Module

This workspace now follows the CaliTourSys-style full-stack structure.

```text
backend/   Node.js + Express.js + PostgreSQL API
frontend/  Vue 3 + Vite + Vue Router + Pinia + Axios
archive/   Older React/Figma prototype kept as migration reference
```

## Backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Create the PostgreSQL database, then run:

```bash
psql -d calitoursys -f database/schema.sql
psql -d calitoursys -f database/seed.sql
```

## Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend URL: `http://localhost:5173`
Backend URL: `http://localhost:5000`

Seeded demo accounts use the password `password123`:

- `admin@tourism.gov.ph`
- `maria.santos@tourism.gov.ph`
- `john@sunsetresort.com`

You can also use the frontend demo role buttons while the API/database is not running yet.
