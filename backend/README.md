# HazardWatch API

## Setup

1. Install MongoDB and start it locally.
2. Copy `backend/.env.example` to `backend/.env` and set the required values.
3. **Never commit `.env`. Use `.env.example` as a template.**
4. Install dependencies and seed optional development users:

```powershell
cd backend
npm install
npm run seed
npm run dev
```

The API runs at `http://localhost:5000`. The frontend uses `/api` by default; configure Vite's proxy or set `VITE_API_URL` to the API origin when deploying.

Registration is public at `POST /api/auth/register`. Report creation requires an authenticated JWT at `POST /api/reports`; public report listing is available at `GET /api/reports/public`.
