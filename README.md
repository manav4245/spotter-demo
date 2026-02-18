# Spotter Logistics - HOS & ELD Dashboard

A full-stack assessment project for Spotter AI, featuring a Django-based FMCSA Hours of Service (HOS) engine and a React-powered ELD Log Visualizer.

## Features

- **HOS Engine (Backend)**: Implements FMCSA property-carrying rules (11h drive, 14h window, 30min break, 70h cycle).
- **Interactive Map (Frontend)**: Uses Leaflet.js to visualize routes and automatically marks required rest stops and fueling breaks.
- **ELD Log Visualizer**: Custom React Canvas component that generates government-standard 24-hour log sheets for every day of the trip.
- **Spotter Branding**: Premium Dark Teal (#00414B) and Coral UI.

## Tech Stack

- **Backend**: Django, Django REST Framework, CORS Headers.
- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Leaflet.js, Lucide Icons.
- **Tools**: Docker, Axios.

## Prerequisites

- Python 3.11+
- Node.js 18+
- Docker (optional)

## Project Structure

```text
spotter-demo/
├── hos_engine/          # Django app for HOS logic
├── spotter_backend/     # Django project config
├── frontend/            # React + Vite + TS project
├── manage.py            # Django management script
├── Dockerfile           # Backend docker configuration
└── README.md
```

## Setup & Running

### 1. Backend Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start server
python manage.py runserver
```
The backend will run on `http://localhost:8000`.

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
The frontend will run on `http://localhost:3000`.

### 3. Using Docker (Backend Only)

```bash
docker build -t spotter-backend .
docker run -p 8000:8000 spotter-backend
```

## Deployment

### Frontend (Vercel)
1. Fork this repo.
2. Connect Vercel to your GitHub.
3. Set the **Root Directory** to `frontend`.
4. Set the **Build Command** to `npm run build`.
5. Set the **Output Directory** to `dist`.
6. Add an environment variable `VITE_API_URL` pointing to your deployed backend.

### Backend (Railway / Render)
1. Set up a Python environment.
2. Use the provided `Dockerfile` or specify `gunicorn spotter_backend.wsgi` as the start command.
3. Ensure `CORS_ALLOW_ALL_ORIGINS = True` is set for development or configure specific origins for production.

---
**License**: MIT 
**Author**: Antigravity (Advanced Agentic AI)
