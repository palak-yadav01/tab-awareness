<img width="1174" height="1012" alt="Screenshot 2026-03-11 113917" src="https://github.com/user-attachments/assets/e868e7a4-b73a-4f3c-b43b-8d4457d4de69" />
<img width="1149" height="1002" alt="Screenshot 2026-03-11 113847" src="https://github.com/user-attachments/assets/d8757103-3a6d-49eb-9b47-a577ccc68d13" />
# 🧠 Tab Awareness System

A full-stack browser productivity tool that tracks your tab usage 
and helps you identify distraction patterns and reduce tab hoarding.

## What it does
- 📊 Tracks every tab you open, close and switch
- 🧠 Calculates a hoarding score (0-100)
- 🌐 Shows which websites you visit most
- 🧟 Detects zombie tabs open for 2+ hours
- 📈 Live dashboard with charts and stats

## Tech Stack
- **Chrome Extension** — Manifest V3, tracks tab events
- **Node.js + Express** — Backend API server
- **PostgreSQL** — Stores all tab events
- **React + Recharts** — Live dashboard with charts

## How to run it
1. Load the `/extension` folder into Chrome as an unpacked extension
2. Run the backend: `cd backend && node server.js`
3. Run the dashboard: `cd dashboard && npm run dev`
4. Open `http://localhost:5173`

## Screenshots
*(Add a screenshot of your dashboard here)*
