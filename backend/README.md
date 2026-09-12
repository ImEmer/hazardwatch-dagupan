# HazardWatch API

## Setup

1. Install MongoDB and start it locally.
2. Create `backend/.env` and set `MONGO_URI`, a long random `JWT_SECRET`, and the Cloudinary variables `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.
3. Install dependencies and seed optional development users:

```powershell
cd backend
npm install
npm run seed
npm run dev
```

The API runs at `http://localhost:5000`. The frontend uses `/api` by default; configure Vite's proxy or set `VITE_API_URL` to the API origin when deploying.

Registration is public at `POST /api/auth/register`. Public report creation is available at `POST /api/reports`; all administrative report and statistics endpoints require a JWT bearer token.
