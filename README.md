# 200M Meeting Room Management Tool (MERN)

A complete **meeting room reservation system** for office **200M** with one default room, built using:
- **Frontend:** React (JSX) + Tailwind + Vite
- **Backend:** Node.js + Express + MongoDB + JWT

## Features

- User authentication (register/login)
- Role-based access (`user`, `admin`)
- Single office support (`200M`) with default seeded meeting room
- Create reservation requests with attendees and description
- Conflict detection for overlapping booking windows
- 30-minute availability slot view (9 AM - 6 PM)
- Reservation workflow: pending, approved, rejected, cancelled
- Admin actions to approve/reject requests
- In-app notifications for new requests and status updates

---

## 1) Setup backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Backend runs at `http://localhost:5000`.

## 2) Setup frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Demo flow

1. Register one `admin` user and one `user` account.
2. Login as `user`, create reservations.
3. Login as `admin`, approve/reject pending reservations.
4. Check notification panel for updates.

## API Overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/rooms`
- `POST /api/rooms` (admin)
- `GET /api/reservations`
- `POST /api/reservations`
- `PATCH /api/reservations/:id/status` (admin)
- `GET /api/reservations/availability?roomId=<id>&date=YYYY-MM-DD`
- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
