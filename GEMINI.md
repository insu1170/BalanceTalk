# GEMINI.md

## Project Overview

This is a real-time debate platform called **BalanceTalk**. It allows users to create or join debate rooms, choose a side (A or B), and engage in a timed debate. After the debate, a vote determines the winning side. The rooms are ephemeral and are deleted after the debate.

The project is a monorepo with a `web` frontend and a `server` backend.

*   **Frontend:** Built with Next.js, React, and TypeScript.
*   **Backend:** Built with Express.js, Socket.IO, and TypeScript.

## Building and Running

### Environment Variables

**web/.env.local**

```
NEXT_PUBLIC_SOCKET_URL=http://localhost:8080
NEXT_PUBLIC_DEFAULT_DURATION=300
NEXT_PUBLIC_NICK_PREFIX=BT
```

**server/.env**

```
PORT=8080
CORS_ORIGIN=http://localhost:3000
REDIS_URL=redis://localhost:6379
ROOM_TTL_SEC=420
```

### Running the Application

**Server:**

```bash
cd server
pnpm i
pnpm dev
```

**Web:**

```bash
cd web
pnpm i
pnpm dev
```

The server runs on port `8080` and the web application on port `3000`.

## Development Conventions

### Commit Convention

| Type         | Description            |
| ---------- | ------------- |
| `feat`     | New feature addition     |
| `fix`      | Bug fix         |
| `chore`    | Environment setup, package management |
| `docs`     | Documentation changes         |
| `refactor` | Code refactoring      |

**Example:**

```
feat(web): Add room creation form and validation logic
fix(server): Fix logic to prevent duplicate vote submission
refactor(socket): Improve event namespace structure
```

## Project Structure

```
BalanceTalk/
├─ web/                         # Next.js (Frontend)
│  ├─ app/
│  │  ├─ page.tsx              # Landing / Quick Join screen
│  │  ├─ create/page.tsx       # Room creation page
│  │  └─ room/[roomId]/page.tsx# Debate and voting screen
│  ├─ components/
│  │  ├─ RoomHeader.tsx
│  │  ├─ DualChat.tsx
│  │  ├─ VotePanel.tsx
│  │  ├─ Timer.tsx
│  │  └─ NicknameBadge.tsx
│  ├─ lib/socket.ts             # Socket.IO client
│  ├─ store/room.ts             # Zustand global state (team/nickname/timer)
│  └─ styles/globals.css
│
└─ server/                      # Express + Socket.IO (Backend)
   ├─ src/
   │  ├─ index.ts               # Server entry point
   │  ├─ socket.ts              # Event handler management
   │  ├─ rooms.ts               # Room creation / deletion / TTL logic
   │  ├─ redis.ts               # Redis client and utilities
   │  └─ types.ts               # Common type definitions
   ├─ package.json
   └─ tsconfig.json
```
